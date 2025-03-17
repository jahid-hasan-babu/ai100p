import httpStatus from "http-status";
import { PostServices } from "./post.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import pickValidFields from "../../utils/pickValidFields";


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
  const userId = req.user.id;

  const result = await PostServices.getAllPosts(options as any, userId);

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

const getPopularPosts = catchAsync(async (req: Request, res: Response) => {
  const options = req.query;
  const result = await PostServices.getPopularPosts(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Posts retrieved successfully",
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

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await PostServices.deletePost(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Post deleted successfully",
    data: result,
  });
});

export const PostControllers = {
  createPost,
  getAllPosts,
  getSinglePost,
  getPopularPosts,
  updatePost,
  deletePost,
};
