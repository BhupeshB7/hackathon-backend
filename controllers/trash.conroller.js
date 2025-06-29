import imagekit from "../config/imagekit.js";
import File from "../models/file.model.js";
import Trash from "../models/trash.model.js";
export const deleteTrashFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    console.log("delete file ", fileId);
    const file = await Trash.findOne({
      _id: fileId,
      userId: req.user._id,
    }).select("imageKitFileId extension name parentDirId");
    if (!file) {
      return res.status(404).json({
        error: "File not found",
        message: "File not found in Trash!",
      });
    }
    const fileDetails = await File.findOne({
      _id: fileId,
      userId: req.user._id,
    });
    try {
      await imagekit.deleteFile(fileDetails.imageKitFileId);
    } catch (err) {
      console.error("ImageKit deletion failed", err?.message || err);
      return res
        .status(500)
        .json({ error: "Could not delete file from ImageKit" });
    }
    await Trash.deleteOne({ _id: fileId });
    res
      .status(200)
      .json({ message: "File deleted successfully from Trash and ImageKit" });
  } catch (error) {
    next(error);
  }
};
export const getAllTrashFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sortBy = req.query.sortBy || "recent";
    const sortQuery = sortBy === "name" ? { name: 1 } : { createdAt: -1 };
    const trashFiles = await Trash.find({ userId })
      .collation({ locale: "en", strength: 1 })
      .sort(sortQuery);
    res.status(200).json({
      success: true,
      total: trashFiles.length,
      data: trashFiles,
    });
  } catch (error) {
    next(error);
  }
};
