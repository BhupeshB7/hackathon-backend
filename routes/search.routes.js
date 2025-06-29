import express from "express";
import { searchFiles } from "../controllers/search.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const searchRouter = express.Router();

searchRouter.get("/", authMiddleware, searchFiles);

export default searchRouter;
