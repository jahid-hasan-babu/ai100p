import httpStatus from "http-status";
import { LikeServices } from "./like.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";



const createLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await LikeServices.createLike(userId, postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Like created successfully",
    data: result,
  });
});

const getAllLikes = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const result = await LikeServices.getAllLikeWithUser(postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Likes retrieved successfully",
    data: result,
  });
});

const removeLike = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await LikeServices.removeLike(userId, postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Like removed successfully",
    data: result,
  });
});

export const LikeControllers = {
  createLike,
  getAllLikes,
  removeLike,
};
