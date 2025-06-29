import jwt from "jsonwebtoken";
import path from "path";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import { formatFileSize, getMimeType } from "../utils/file.util.js";
import Trash from "../models/trash.model.js";
import imagekit from "../config/imagekit.js";
import axios from "axios";
export const uploadFile = async (req, res, next) => {
  const parentDirId = req.params.parentDirId || req.user.rootDirId;

  try {
    const parentDirData = await Directory.findOne({
      _id: parentDirId,
      userId: req.user._id,
    });

    if (!parentDirData) {
      return res.status(404).json({ error: "Parent directory not found!" });
    }

    const filename = req.headers.filename || "untitled";
    const extension = path.extname(filename);

    const fileBuffer = [];
    let totalBytes = 0;

    req.on("data", (chunk) => {
      fileBuffer.push(chunk);
      totalBytes += chunk.length;
    });

    req.on("end", async () => {
      const buffer = Buffer.concat(fileBuffer);

      try {
        const uploadResponse = await imagekit.upload({
          file: buffer,
          fileName: filename,
          folder: `/user-files`,
        });

        const insertedFile = await File.create({
          name: filename,
          extension,
          parentDirId: parentDirData._id,
          userId: req.user._id,
          size: totalBytes,
          imageKitUrl: uploadResponse.url,
          imageKitFileId: uploadResponse.fileId,
        });

        return res.status(201).json({
          message: "File uploaded to ImageKit",
          file: {
            id: insertedFile._id,
            name: insertedFile.name,
            size: insertedFile.size,
            url: uploadResponse.url,
          },
        });
      } catch (uploadErr) {
        console.error("ImageKit upload failed:", uploadErr);
        return res.status(500).json({ error: "Image upload failed" });
      }
    });

    req.on("error", (err) => {
      console.error("Request error:", err);
      return res.status(500).json({ error: "File upload error" });
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const getFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    let file;
    let isSharedAccess = false;

    if (req.user && fileId.length === 24) {
      file = await File.findOne({ _id: fileId, userId: req.user._id });
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
    } else {
      if (fileId.length <= 24) {
        return res.status(400).json({ error: "Invalid shared link" });
      }

      let decodedToken;
      try {
        decodedToken = jwt.verify(fileId, "secret");
        isSharedAccess = true;
      } catch (jwtError) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      file = await File.findById(decodedToken.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
    }

    if (isSharedAccess && req.query.action === "download") {
      return res.status(403).json({
        error: "Download not allowed",
        message: "You are not allowed to download shared files",
      });
    }

    if (req.user) {
      await File.findByIdAndUpdate(
        { _id: file._id, userId: req.user._id },
        { $set: { updatedAt: new Date() } }
      );
    }

    const imageKitUrl = file.imageKitUrl;

    // If download is requested
    if (req.query.action === "download") {
      const response = await axios.get(imageKitUrl, {
        responseType: "stream",
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(file.name)}"`
      );
      res.setHeader("Content-Type", response.headers["content-type"]);

      return response.data.pipe(res);
    }

    return res.redirect(imageKitUrl);
  } catch (err) {
    console.error("Get file error:", err);
    next(err);
  }
};

export const getFileMetadata = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    let file;

    if (req.user) {
      file = await File.findOne({ _id: fileId, userId: req.user._id });
    } else {
      if (fileId.length <= 24) {
        return res.status(400).json({
          error: "Invalid shared file link",
          message: "The shared link appears to be malformed or incomplete.",
        });
      }

      let decodedToken;
      try {
        decodedToken = jwt.verify(fileId, "secret");
      } catch (jwtError) {
        return res.status(401).json({
          error: "Invalid or expired token",
          message: jwtError.message || "Could not verify the shared link",
        });
      }

      file = await File.findOne({ _id: decodedToken.fileId });
    }

    if (!file) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found or you don't have permission to access it",
      });
    }

    return res.json({
      id: file._id,
      name: file.name,
      type: getMimeType(file.extension),
      size: formatFileSize(file.size),
      extension: file.extension,
      uploadDate: file.createdAt,
      owner: req?.user?.name || req?.user?.email || "Anonymous",
      url: `http://localhost:3000/api/files/${fileId}`,
      fileMode: req.user ? "private" : "view",
    });
  } catch (err) {
    console.error("Get file metadata error:", err);
    next(err);
  }
};

export const renameFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { newFileName } = req.body;
    const file = await File.findById({
      _id: fileId,
      userId: req.user._id,
    }).lean();

    if (!file) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found!",
      });
    }
    const existingFileNameInSameDir = await File.findOne({
      name: newFileName,
      parentDirId: file.parentDirId,
      userId: req.user._id,
    }).lean();
    if (existingFileNameInSameDir) {
      return res.status(400).json({
        error: "File name already exists",
        message: "File already exists in the same directory",
      });
    }
    await File.updateOne(
      { _id: fileId, userId: req.user._id },
      { $set: { name: newFileName } }
    );
    res.status(200).json({ message: "File renamed successfully" });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById({
      _id: fileId,
      userId: req.user._id,
    }).select("extension name parentDirId");
    if (!file) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found!",
      });
    }
    await File.findByIdAndUpdate(
      {
        _id: fileId,
        userId: req.user._id,
      },
      {
        $set: { isDeleted: true },
      }
    );
    const parentDirName = await Directory.findOne({
      _id: file.parentDirId,
      userId: req.user._id,
    }).select("name");
    await Trash.insertOne({
      _id: fileId,
      name: file.name,
      extension: file.extension,
      userId: req.user._id,
      parentDirId: file.parentDirId,
      parentDirName: parentDirName.name,
    });
    res.status(200).json({ message: "File moved to trash successfully" });
  } catch (error) {
    next(error);
  }
};

export const getFileAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
    const PDF_EXTENSIONS = [".pdf"];
    const TEXT_EXTENSIONS = [".txt"];
    const VIDEO_EXTENSIONS = [".mp4"];
    const analytics = await File.aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
        },
      },
      {
        $project: {
          type: {
            $switch: {
              branches: [
                {
                  case: { $in: ["$extension", IMAGE_EXTENSIONS] },
                  then: "Image",
                },
                {
                  case: { $in: ["$extension", PDF_EXTENSIONS] },
                  then: "PDF",
                },
                {
                  case: { $in: ["$extension", TEXT_EXTENSIONS] },
                  then: "Text",
                },
                {
                  case: { $in: ["$extension", VIDEO_EXTENSIONS] },
                  then: "Video",
                },
              ],
              default: "Other",
            },
          },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);
    // console.log("Raw analytics",analytics);
    const result = {
      Image: 0,
      PDF: 0,
      Text: 0,
      Video: 0,
      Other: 0,
    };
    analytics.forEach(({ _id, count }) => {
      result[_id] = count;
    });
    res
      .status(200)
      .json({ message: "Analytics fetched successfully", data: result });
  } catch (error) {
    next(error);
  }
};

export const getrecentFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const recentFiles = await File.find({ userId, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: recentFiles,
    });
  } catch (error) {
    next(error);
  }
};

export const handleStarred = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const isFileExist = await File.findById({
      _id: fileId,
      userId: req.user._id,
    }).lean();
    if (!isFileExist) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found!",
      });
    }
    await File.findByIdAndUpdate(
      {
        _id: fileId,
        userId: req.user._id,
      },
      {
        $set: { isStarred: !isFileExist.isStarred },
      }
    );
    res.status(200).json({
      message: `File ${
        !isFileExist.isStarred ? "starred" : "unstarred"
      } successfully`,
    });
  } catch (error) {
    next(error);
  }
};
export const getStarredFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const starredFiles = await File.find({ userId, isStarred: true }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      data: starredFiles,
      total: starredFiles.length,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFilesCopyLink = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById({
      _id: fileId,
      userId: req.user._id,
    }).lean();
    if (!file) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found!",
      });
    }
    const secretKey = process.env.SECRET_KEY || "secret";
    const shareToken = jwt.sign({ fileId }, secretKey, { expiresIn: "24h" });
    await File.findByIdAndUpdate(
      {
        _id: fileId,
        userId: req.user._id,
      },
      {
        $set: {
          shareToken: shareToken,
        },
      }
    );

    res.status(200).json({
      message: "Link generated successfully",
      link: shareToken,
    });
  } catch (error) {
    next(error);
  }
};

export const getFileDetails = async (req, res) => {
  const { fileId } = req.params;
  try {
    const file = await File.findById({
      _id: fileId,
      userId: req.user._id,
    }).lean();
    if (!file) {
      return res
        .status(401)
        .json({ message: "File not found!", success: true });
    }
    const fileDetails = {
      _id: file._id,
      name: file.name,
      extension: file.extension,
      size: file.size,
      type: getMimeType(file.extension),
      uploadDate: file.createdAt,
      recentView: file.updatedAt,
      isStarred: file.isStarred,
      sharedWith: file.sharedWith,
    };
    res.status(200).json({
      message: "File details fetched successfully!",
      success: true,
      fileDetails,
    });
  } catch (error) {
    next(error);
  }
};
