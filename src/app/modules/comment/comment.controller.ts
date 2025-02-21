import httpStatus from "http-status";
import { CommentServices } from "./comment.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";


const createComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const payload = req.body;
  const result = await CommentServices.createComment(payload, userId, postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Comment created successfully",
    data: result,
  });
});

const getAllComments = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.id;
  const result = await CommentServices.getAllComments(postId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Comments retrieved successfully",
    data: result,
  });
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await CommentServices.updateComment(id, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Comment updated successfully",
    data: result,
  });
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await CommentServices.deleteComment(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Comment deleted successfully",
    data: result,
  });
});

export const CommentControllers = {
  createComment,
  getAllComments,
  updateComment,
  deleteComment,
};
