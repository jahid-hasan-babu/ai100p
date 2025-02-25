import httpStatus from "http-status";
import { FollowServices } from "./follow.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";



const follow = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const sellerId = req.params.id;
  const result = await FollowServices.follow(userId, sellerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,  
    message: "Followed successfully",
    data: result,
  });
});

const unFollow = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const sellerId = req.params.id;
  const result = await FollowServices.unFollow(userId, sellerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Unfollowed successfully",
    data: result,
  });
});

const getMyFollowers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await FollowServices.getMyFollowers(userId, options);

  sendResponse(res, { 
    statusCode: httpStatus.OK,
    message: "Followers retrieved successfully",
    data: result,
  });
});

const getMyFollowing = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await FollowServices.getMyFollowing(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Following retrieved successfully",
    data: result,
  });
});

export const LikeControllers = {
  follow,
  unFollow,
  getMyFollowers,
  getMyFollowing,
};
