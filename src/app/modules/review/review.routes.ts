import express from "express";
import auth from "../../middlewares/auth";
import { ReviewControllers } from "./review.controller";
import { fileUploader } from "../../helpers/fileUploader";
import { parse } from "path";
import parseBodyData from "../../../helpers/parseBodyData";
const router = express.Router();

router.post(
  "/:id",
  auth(),
  fileUploader.uploadReviewFile,
  parseBodyData,
  ReviewControllers.createReview
);

router.delete("/:id", auth("USER", "ADMIN"), ReviewControllers.deleteReview);

router.get(
  "/my-reviews",
  auth("USER", "ADMIN"),
  ReviewControllers.getMyReviews
);

export const ReviewRouters = router;
