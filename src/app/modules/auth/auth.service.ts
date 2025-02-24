import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import { generateToken, otpToken } from "../../utils/generateToken";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/ApiError";
import Twilio from "twilio";
import jwt from "jsonwebtoken";

const sendOtpMessage = async (payload: any) => {
  const client = Twilio(config.twilio.accountSid, config.twilio.authToken);
  const OTP_EXPIRY_TIME = 2 * 60 * 1000; // ✅ 2 minutes in milliseconds (120,000 ms)

  const { phone } = payload;

  if (!phone || !phone.startsWith("+")) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Phone number must be in E.164 format with country code."
    );
  }

  // Generate 6-digit OTP
  const otp = Math.floor(1000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);

  try {
    // Store OTP in database using Prisma
    await prisma.otp.upsert({
      where: { phone },
      update: { otp, expiry },
      create: { phone, otp, expiry },
    });

    // Send OTP via Twilio SMS
    const result = await client.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
      from: config.twilio.twilioPhoneNumber,
      to: phone,
    });

    // Return formatted response
    return {
      body: `Your OTP code is send. It will expire in 2 minutes.`,
      from: result.from,
      to: result.to,
      status: result.status,
      dateCreated: result.dateCreated,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to send OTP."
    );
  }
};

const verifyOtpMessage = async (payload: any) => {
  const { phone, otp } = payload;

  if (!phone || !otp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Phone number and OTP are required"
    );
  }

  const storedOtp = await prisma.otp.findUnique({
    where: { phone },
  });

  if (!storedOtp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "OTP not found. Please request a new one.' "
    );
  }

  if (new Date() > (storedOtp?.expiry! ?? null)) {
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      "OTP has expired. Please request a new one."
    );
  }

  if (storedOtp.otp !== otp) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid OTP. Please check the code and try again."
    );
  }

  if (storedOtp.otp === otp && storedOtp.phone === phone) {
    await prisma.otp.delete({
      where: { phone },
    });
  }
  return { phone };
};

const loginUserFromDB = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
  });

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
  }

  if (payload?.fcmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  return {
    id: userData.id,
    name: userData.name,
    userName: userData.userName,
    profileImage: userData.profileImage,
    ProfileStatus: userData.profileStatus,
    email: userData.email,
    locationLat: userData.locationLat,
    locationLong: userData.locationLong,
    role: userData.role,
    accessToken: accessToken,
  };
};

const forgetPassword = async (payload: any) => {
  const client = Twilio(config.twilio.accountSid, config.twilio.authToken);
  const OTP_EXPIRY_TIME = 2 * 60 * 1000;

  const { phone } = payload;

  if (!phone || !phone.startsWith("+")) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Phone number must be in E.164 format with country code."
    );
  }

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);

  try {
    await prisma.otp.upsert({
      where: { phone },
      update: { otp, expiry },
      create: { phone, otp, expiry },
    });

    const result = await client.messages.create({
      body: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
      from: config.twilio.twilioPhoneNumber,
      to: phone,
    });

    return {
      body: `Your OTP code is send. It will expire in 2 minutes.`,
      from: result.from,
      to: result.to,
      status: result.status,
      dateCreated: result.dateCreated,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to send OTP."
    );
  }
};

const verifyOtp = async (payload: any) => {
  const { phone, otp } = payload;

  if (!phone || !otp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Phone number and OTP are required"
    );
  }

  const storedOtp = await prisma.otp.findUnique({
    where: { phone },
  });

  if (!storedOtp) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "OTP not found. Please request a new one.' "
    );
  }

  if (new Date() > (storedOtp?.expiry! ?? null)) {
    throw new ApiError(
      httpStatus.EXPECTATION_FAILED,
      "OTP has expired. Please request a new one."
    );
  }

  if (storedOtp.otp !== otp) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid OTP. Please check the code and try again."
    );
  }

  const token = otpToken(
    {
      phone: payload.phone,
      otp,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  if (storedOtp.otp === otp && storedOtp.phone === phone) {
    await prisma.otp.delete({
      where: { phone },
    });
  }
  return { phone, token };
};

const changePassword = async (payload: any) => {
  const decodedToken: any = jwt.verify(
    payload.token,
    config.jwt.access_secret as Secret
  );
  const phone = decodedToken.phone;
  console.log(phone);

  if (!phone) {
    throw new Error("Invalid token: Phone number is missing.");
  }

  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      phone,
      status: "ACTIVATE",
    },
  });

  const hashedPassword: string = await bcrypt.hash(
    payload.password,
    parseInt(config.bcrypt_salt_rounds as any)
  );

  await prisma.user.update({
    where: { id: userData.id },
    data: { password: hashedPassword },
  });
};

export const AuthServices = {
  loginUserFromDB,
  sendOtpMessage,
  verifyOtpMessage,
  forgetPassword,
  verifyOtp,
  changePassword,
};
