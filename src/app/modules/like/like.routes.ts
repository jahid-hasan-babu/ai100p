import express from "express";
import auth from "../../middlewares/auth";
import { LikeControllers } from "./like.controller";
import parseBodyData from "../../../helpars/parseBodyData";
const router = express.Router();

router.post(
  "/create-like/:id",
  auth("USER", "SELLER"),
  parseBodyData,
  LikeControllers.createLike
);

router.delete(
  "/remove-like/:id",
  auth("USER", "SELLER"),
  parseBodyData,
  LikeControllers.removeLike
);

router.get("/getAll-like/:id", parseBodyData, LikeControllers.getAllLikes);

export const LikeRouters = router;
