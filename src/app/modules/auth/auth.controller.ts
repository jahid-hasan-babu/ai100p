import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import { Request, Response } from "express";


const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUserFromDB(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User logged in successfully",
    data: result,
  });
});

;


const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.sendOtpMessage(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Otp sent successfully",
    data: result,
  });
});

const verifyOtpMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.verifyOtpMessage(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Otp verified successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AuthServices.changePassword(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: result,
  });
});

export const AuthControllers = {
  loginUser,
  sendOtp,
  verifyOtpMessage,
  changePassword,
};
