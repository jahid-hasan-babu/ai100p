import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import { ReviewServices } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body.bodyData;
  const serviceId = req.params.id;
  const files = req.file;
  const result = await ReviewServices.createReview(userId,serviceId, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const id = req.params.id;
  const result = await ReviewServices.deleteReview(userId, id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Review deleted successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await ReviewServices.getMyReviews(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Review retrieved successfully",
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  deleteReview,
  getMyReviews,
};
