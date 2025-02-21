import express from "express";
import auth from "../../middlewares/auth";
import { CommentControllers } from "./comment.controller";
import parseBodyData from "../../../helpers/parseBodyData";
const router = express.Router();

router.post("/:id", auth(), parseBodyData, CommentControllers.createComment);

router.get("/:id", CommentControllers.getAllComments);

router.put("/:id", auth(), CommentControllers.updateComment);

router.delete("/:id", auth(), CommentControllers.deleteComment);



export const CommentRouters = router;
