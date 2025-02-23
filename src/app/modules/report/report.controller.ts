import httpStatus from "http-status";
import { ReportServices } from "./report.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";

const makeReport = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body.bodyData;
  const files = req.files;
  const result = await ReportServices.makeReport(userId, payload, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Report created successfully",
    data: result,
  });
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await ReportServices.getMyReports(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Reports retrieved successfully",
    data: result,
  });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const options = req.query;
  const result = await ReportServices.getAllReports(options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Reports retrieved successfully",
    data: result,
  });
});

const getMyReportAsOwner = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await ReportServices.getMyReportAsOwner(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Reports retrieved successfully",
    data: result,
  });
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReportServices.deleteReport(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Report deleted successfully",
    data: result,
  });
});



export const ReportControllers = {
  makeReport,
  getMyReports,
  getAllReports,
  getMyReportAsOwner,
  deleteReport,
};
