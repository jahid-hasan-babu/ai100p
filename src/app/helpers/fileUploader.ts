// import multer from "multer";
// import path from "path";
// // import prisma from '../shared/prisma';
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // cb(null, path.join( "/var/www/uploads"));
//     cb(null, path.join(process.cwd(), "uploads"));
//   },
//   filename: async function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

// // upload single image
// const uploadprofileImage = upload.single("profileImage");
// const uploadCertificateImage = upload.single("certificate");

// export const fileUploader = {
//   upload,
//   uploadprofileImage,
//   uploadCertificateImage,
// };

import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

interface UploadResponse {
  Location: string;
  Bucket: string;
  Key: string;
  ETag?: string;
}
interface UploadResponse {
  Location: string;
  Bucket: string;
  Key: string;
  ETag?: string;
}
const upload = multer({ storage: storage });

const uploadMultipleImage = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

const uploadPostImage = upload.single("image");
const uploadFile = upload.single("file");

// Configure DigitalOcean Spaces
export const s3Client = new S3Client({
  region: "nyc3",
  endpoint: process.env.DO_SPACE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY || "",
    secretAccessKey: process.env.DO_SPACE_SECRET_KEY || "",
  },
});

const removeFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
  }
};

const uploadToDigitalOcean = async (
  file: Express.Multer.File
): Promise<UploadResponse> => {
  if (!file) {
    throw new Error("File is required for uploading.");
  }

  try {
    await fs.access(file.path);

    const Key = `test/${Date.now()}_${file.originalname}`;
    const uploadParams = {
      Bucket: process.env.DO_SPACE_BUCKET || "",
      Key,
      Body: await fs.readFile(file.path),
      ACL: "public-read" as ObjectCannedACL,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    await removeFile(file.path);

    // Format the URL to include "https://"
    // const fileURL = `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${Key}`;

    const fileURL = `https://${process.env.DO_SPACE_BUCKET}.nyc3.digitaloceanspaces.com/${Key}`;
    return {
      Location: fileURL,
      Bucket: process.env.DO_SPACE_BUCKET || "",
      Key,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
export const fileUploader = {
  upload,
  uploadMultipleImage,
  uploadToDigitalOcean,
  uploadPostImage,
  uploadFile,
};
