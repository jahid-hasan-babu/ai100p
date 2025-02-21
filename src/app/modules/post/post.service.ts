import { ProfileStatus, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { stripe } from "../../utils/stripe";
import { generateToken } from "../../utils/generateToken";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { fileUploader } from "../../helpers/fileUploader";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";
import { searchFilter } from "../../utils/searchFilter";





const createPost = async (userId: string, payload: any, files: any) => {

 
  let image = null;
  if (files) {
    const uploadResult = await fileUploader.uploadToDigitalOcean(files);
    image = uploadResult.Location;
  }


  const post = await prisma.post.create({
    data: {
      ...payload,
      userId: userId,
      image: image
    },
  });
  return post;
};

export const PostServices = {
  createPost,
};


