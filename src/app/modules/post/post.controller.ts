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
  const payload = req.body.bodyData;
  const files = req.file;
  const result = await PostServices.createPost(userId, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post created successfully",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const options = pickValidFields(req.query, [
    "limit",
    "page",
    "user",
    "search",
  ]);

  const result = await PostServices.getAllPosts(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Posts Retrieve successfully",
    data: result,
  });
});

const getSinglePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await PostServices.getSinglePost(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post Retrieve successfully",
    data: result,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body.bodyData;
  const files = req.file;
  const result = await PostServices.updatePost(id, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post updated successfully",
    data: result,
  });
});

export const PostControllers = {
  createPost,
  getAllPosts,
  getSinglePost,
  updatePost,
};
