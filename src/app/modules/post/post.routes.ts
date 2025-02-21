import express from "express";
import auth from "../../middlewares/auth";
import { PostControllers } from "./post.controller";
import { fileUploader } from "../../helpers/fileUploader";
import parseBodyData from "../../../helpers/parseBodyData";
const router = express.Router();

router.post(
  "/",
  fileUploader.uploadPostImage,
  parseBodyData,
  auth("USER", "SELLER"),
  PostControllers.createPost
);

router.get("/", auth(), PostControllers.getAllPosts);

router.get("/:id", PostControllers.getSinglePost);

router.put(
  "/:id",
  fileUploader.uploadPostImage,
  parseBodyData,
  auth("USER", "SELLER"),
  PostControllers.updatePost
);

router.post("/delete/:id", auth("USER", "SELLER"), PostControllers.deletePost);

export const PostRouters = router;
