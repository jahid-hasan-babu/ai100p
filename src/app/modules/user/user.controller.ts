import httpStatus from "http-status";
import { UserServices } from "./user.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";
import pickValidFields from "../../utils/pickValidFields";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body.bodyData;
  const files = req.files;
  const result = await UserServices.registerUserIntoDB(payload, files);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "User registered successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pickValidFields(req.query, [
    "limit",
    "page",
    "user",
    "search",
  ]);

  const result = await UserServices.getAllUsersFromDB(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Users Retrieve successfully",
    data: result,
  });
});

const getAllSellerUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pickValidFields(req.query, [
    "limit",
    "page",
    "user",
    "search",
  ]);
  const result = await UserServices.getAllSellerUsersFromDB(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Users Retrieve successfully",
    data: result,
  });
});

const getAllCustomerUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pickValidFields(req.query, [
    "limit",
    "page",
    "user",
    "search",
  ]);
  const result = await UserServices.getAllCustomerUsersFromDB(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Users Retrieve successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const result = await UserServices.getMyProfileFromDB(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const getUserDetails = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const currentUserID = req.params.id;
  const result = await UserServices.getUserDetailsFromDB(id, currentUserID);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User details retrieved successfully",
    data: result,
  });
});


const getSingleSellerFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await UserServices.getSingleSellerFromDB(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "User details retrieved successfully",
      data: result,
    });
  }
);

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const payload = req.body.bodyData;
  const files = req.files;
  const result = await UserServices.updateMyProfileIntoDB(id, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User profile updated successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { status } = req.body;
  const result = await UserServices.updateUserStatus(id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const result = await UserServices.deleteUser(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User deleted successfully",
    data: result,
  });
});

const notificationPermission = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.user.id;
    const payload = req.body;
    const result = await UserServices.notificationPermission(id, payload);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Notification permission updated successfully",
      data: result,
    });
  }
);

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const payload = req.body;
  const result = await UserServices.changePassword(id, payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password updated successfully",
    data: result,
  });
});

const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserServices.socialLogin(payload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});

export const UserControllers = {
  registerUser,
  getAllUsers,
  getAllSellerUsers,
  getAllCustomerUsers,
  getMyProfile,
  getSingleSellerFromDB,
  getUserDetails,
  updateUserStatus,
  updateMyProfile,
  deleteUser,
  notificationPermission,
  changePassword,
  socialLogin,
};
