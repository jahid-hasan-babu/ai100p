import express from "express";
import auth from "../../middlewares/auth";
import { LikeControllers } from "./follow.controller";
import parseBodyData from "../../../helpers/parseBodyData";
const router = express.Router();

router.post(
  "/:id",
  auth(),

  LikeControllers.follow
);

router.delete(
  "/:id",
  auth(),
  LikeControllers.unFollow
);


router.get("/", auth(), LikeControllers.getMyFollowers);

router.get("/following", auth(), LikeControllers.getMyFollowing);

export const FollowRouters = router;
