import httpStatus from "http-status";
import { PostServices } from "./post.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import pickValidFields from "../../utils/pickValidFields";

// const getAllUsers = catchAsync(async (req: Request, res: Response) => {
//   const options = pickValidFields(req.query, [
//     "limit",
//     "page",
//     "user",
//     "search",
//   ]);

//   const result = await UserServices.getAllUsersFromDB(options);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: "Users Retrieve successfully",
//     data: result,
//   });
// });

const createPost = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;
  const files = req.files;
  const result = await PostServices.createPost(userId, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post created successfully",
    data: result,
  });
});


export const PostControllers = {
  createPost,
};
