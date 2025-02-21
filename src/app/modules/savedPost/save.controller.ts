import httpStatus from "http-status";
import { SavedServices } from "./save.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";



const savedPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await SavedServices.savedPost(userId, postId); 

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post saved successfully",
    data: result,
  })
}) 

const getMySavedPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await SavedServices.getMySavedPost(userId, options);

  sendResponse(res, { 
    statusCode: httpStatus.OK,
    message: "Saved posts retrieved successfully",
    data: result,
  })
})

const unSavedPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const result = await SavedServices.removeSavedPost(userId, postId);   

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post unsaved successfully",
    data: result,
  })
})


export const SavedControllers = {
  savedPost,
  getMySavedPost,
  unSavedPost,
};
