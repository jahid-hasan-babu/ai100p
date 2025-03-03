import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { fileUploader } from "../../helpers/fileUploader";
import { userId } from './../chat/chat.interface';


const makeReport = async (userId: string, payload: any, files: any) => {
   
  if(payload.postId){
    const post = await prisma.post.findUnique({
      where: {
        id: payload.postId,
      },
    });
    if (!post) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Post not found");
    }
  }

  if(payload.serviceId){
    const service = await prisma.service.findUnique({
      where: {
        id: payload.serviceId,
      },
    });
    if (!service) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Service not found");
    }
  }



    let reportImage = null;
    if (files?.reportImage?.length > 0) {
      const uploadResult = await fileUploader.uploadToDigitalOcean(
        files.reportImage[0]
      );
      reportImage = uploadResult.Location;
    }
  
  let reportVideo = null;
  if (files?.reportVideo?.length > 0) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(
      files.reportVideo[0]
    );
    reportVideo = uploadResult.Location;
  }
  

  const report = await prisma.report.create({
    data: {
      userId: userId,
      reportImage: reportImage,
      reportVideo: reportVideo,
      reason: payload.reason,
      serviceId: payload.serviceId,
      postId: payload.postId
    },
  });
  return report;
};

const getMyReports = async (userId: string) => {
  const result = await prisma.report.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    }
  });
  return result;
};

const getAllReports = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const result = await prisma.report.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    skip,
    select: {
      id: true,
      reason: true,
      reportImage: true,
      reportVideo: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          address: true,
          image: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
      service: {
        select: {
          id: true,
          title: true,
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });
  return {
    meta: {
      total: await prisma.report.count(),
      page,
      limit,
    },
    data: result,
  };
};

const getMyReportAsOwner = async (userId: string) => {
  const result = await prisma.report.findMany({
    where: {
      OR: [
        { post: { user: { id: userId } } },
        { service: { user: { id: userId } } },
      ],
    },
    select: {
      id: true,
      reason: true,
      reportImage: true,
      reportVideo: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          address: true,
          image: true,
        },
      },
      service: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const deleteReport = async (id: string) => {

  const report = await prisma.report.findUnique({
    where: {
      id: id,  
    },
  })

  if (!report) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Report not found");
  }
  const result = await prisma.report.delete({
    where: {
      id: id,
    },
  });
  return ;
};


export const ReportServices = {
  makeReport,
  getMyReports,
  getAllReports,
  getMyReportAsOwner,
  deleteReport,
};
