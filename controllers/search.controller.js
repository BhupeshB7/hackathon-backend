import File from "../models/file.model.js";
import Directory from "../models/directory.model.js";

export const searchFiles = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const files = await File.find({ userId, isDeleted: false })
      .select("_id name extension")
      .lean();
    const directories = await Directory.find({ userId })
      .select("_id name ")
      .lean();
    const filterDirectories = directories.filter(
      (dir) => !dir.name.startsWith("root")
    );
    const combines = [
      ...files.map((file) => ({
        _id: file._id,
        name: file.name,
        extension: file.extension,
        type: "file",
      })),
      ...filterDirectories.map((directory) => ({
        _id: directory._id,
        name: directory.name,
        type: "directory",
      })),
    ];
    return res.status(200).json({ success: true, combines });
  } catch (error) {
    return next(error);
  }
};
