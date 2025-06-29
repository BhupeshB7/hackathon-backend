import express from "express";

const trashRouter = express.Router();

import { deleteTrashFile, getAllTrashFiles } from "../controllers/trash.conroller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

trashRouter.get("/", authMiddleware, getAllTrashFiles);
trashRouter.delete("/delete/:fileId",authMiddleware,deleteTrashFile)
export default trashRouter;