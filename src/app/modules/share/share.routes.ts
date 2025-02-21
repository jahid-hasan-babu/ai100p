import express from "express";
import auth from "../../middlewares/auth";
import { ShareControllers } from "./share.controller";

const router = express.Router();

router.post("/:id", auth(), ShareControllers.sharePost);

export const ShareRouters = router;
