import express from "express";
import auth from "../../middlewares/auth";
import { CommentControllers } from "./comment.controller";
import parseBodyData from "../../../helpars/parseBodyData";
const router = express.Router();

router.post(
  "/create-comment/:id",
  auth("USER", "SELLER"),
  parseBodyData,
  CommentControllers.createComment
);



export const CommentRouters = router;
