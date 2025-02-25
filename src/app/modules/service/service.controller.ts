import httpStatus from "http-status";
import { serviceServices } from "./service.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { Request, Response } from "express";




const createService = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const payload = req.body.bodyData;
  const files = req.files;
  const result = await serviceServices.createService(payload, userId, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Service created successfully",
    data: result,
  });
})

const getMyServices = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = req.query;
  const result = await serviceServices.getMyServices(userId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Services retrieved successfully",
    data: result,
  });
})

const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const options = req.query;
  const userId = req.user.id;
  const result = await serviceServices.getAllServices(options, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Services retrieved successfully",
    data: result,
  });
});

const updateService = catchAsync(async (req: Request, res: Response) => {
  const serviceId = req.params.id;
  const userId = req.user.id;
   const payload = req.body.bodyData;
  const files = req.files;
  const result = await serviceServices.updateService(
    serviceId,
    payload,
    userId,
    files
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Service updated successfully",
    data: result,
  });
});

const deleteService = catchAsync(async (req: Request, res: Response) => {
  const serviceId = req.params.id;
  const userId = req.user.id;
  const result = await serviceServices.deleteService(serviceId, userId);

  sendResponse(res, { 
    statusCode: httpStatus.OK,
    message: "Service deleted successfully",
    data: result,
  });
});

export const ServiceControllers = {
  createService,
  getMyServices,
  getAllServices,
  updateService,
  deleteService,
};
