import httpStatus from "http-status";
import { ShareServices } from "./share.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";


const sharePost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await ShareServices.createShare(userId, postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post share successfully",
    data: result,
  });
})

const getMyPostShareList = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await ShareServices.getMyPostShareList(userId, postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post share list retrieved successfully",
    data: result,
  });
});

export const ShareControllers = {
  sharePost,
  getMyPostShareList,
};
