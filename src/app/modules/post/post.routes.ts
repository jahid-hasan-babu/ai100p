import express from "express";
import auth from "../../middlewares/auth";
import { PostControllers } from "./post.controller";
import { fileUploader } from "../../helpers/fileUploader";
import parseBodyData from "../../../helpars/parseBodyData";
const router = express.Router();

router.post(
  "/",
  fileUploader.uploadPostImage,
  parseBodyData,
  auth("USER", "SELLER"),
  PostControllers.createPost
);

export const PostRouters = router;
