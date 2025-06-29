import express from "express";
import userRouter from "./user.routes.js";
import directoryRouter from "./directory.routes.js";
import fileRouter from "./file.route.js";
import trashRouter from "./trash.routes.js";
import searchRouter from "./search.routes.js";
const router = express.Router();

router.use("/user", userRouter);
router.use("/directory", directoryRouter);
router.use("/files", fileRouter);
router.use("/trash", trashRouter);
router.use("/search", searchRouter);
export default router;
