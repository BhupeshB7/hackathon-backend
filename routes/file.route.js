import express from "express";
import {
  deleteFile,
  generateFilesCopyLink,
  getFile,
  getFileAnalytics,
  getFileDetails,
  getFileMetadata,
  getrecentFiles,
  getStarredFiles,
  handleStarred,
  renameFile,
  uploadFile,
} from "../controllers/file.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const fileRouter = express.Router();

fileRouter.get("/public/:fileId/metadata", getFileMetadata);
fileRouter.post("/upload/:parentDirId?", authMiddleware, uploadFile);
fileRouter.get("/recent", authMiddleware, getrecentFiles);
fileRouter.get("/starred", authMiddleware, getStarredFiles);
fileRouter.get("/analytics", authMiddleware, getFileAnalytics);
fileRouter.get("/:fileId", authMiddleware, getFile);
fileRouter.get("/:fileId/metadata", authMiddleware, getFileMetadata);
fileRouter.get("/fileDetails/:fileId", authMiddleware, getFileDetails);
fileRouter.post("/copy-link/:fileId", authMiddleware, generateFilesCopyLink);
fileRouter.patch("/rename/:fileId", authMiddleware, renameFile);
fileRouter.patch("/starred/:fileId", authMiddleware, handleStarred);
fileRouter.delete("/:fileId", authMiddleware, deleteFile);

export default fileRouter;
