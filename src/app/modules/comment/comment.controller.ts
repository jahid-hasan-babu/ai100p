import httpStatus from "http-status";
import { CommentServices } from "./comment.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";


const createComment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const postId = req.params.id;
  const payload = req.body;
  const result = await CommentServices.createComment(userId, postId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Comment created successfully",
    data: result,
  });
});


export const CommentControllers = {
  createComment,
};
