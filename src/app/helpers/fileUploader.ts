import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { Readable } from "stream";
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ObjectCannedACL,
} from "@aws-sdk/client-s3";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Define different upload types
const uploadMultipleImage = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

const uploadReportImage = upload.fields([
  { name: "reportVideo", maxCount: 1 },
  { name: "reportImage", maxCount: 1 },
]);

const uploadServiceImage = upload.array("serviceImage", 5);
const uploadPostImage = upload.single("image");
const uploadFile = upload.single("file");
const uploadReviewFile = upload.single("reviewFile");

// Configure DigitalOcean Spaces (S3-compatible)
export const s3Client = new S3Client({
  region: "nyc3",
  endpoint: process.env.DO_SPACE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY || "",
    secretAccessKey: process.env.DO_SPACE_SECRET_KEY || "",
  },
});

// Function to remove a file from local storage
const removeFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file: ${filePath}`, error);
  }
};

// **Multipart Upload to DigitalOcean Spaces**
const uploadToDigitalOcean = async (
  file: Express.Multer.File
): Promise<{ Location: string; Bucket: string; Key: string }> => {
  if (!file) {
    throw new Error("File is required for uploading.");
  }

  const Bucket = process.env.DO_SPACE_BUCKET || "";
  const Key = `test/${Date.now()}_${file.originalname}`;

  try {
    const fileBuffer = await fs.readFile(file.path);
    const fileSize = fileBuffer.length;
    const numParts = Math.ceil(fileSize / CHUNK_SIZE);

    // Step 1: Initiate Multipart Upload
    const createMultipartUpload = new CreateMultipartUploadCommand({
      Bucket,
      Key,
      ACL: "public-read" as ObjectCannedACL,
    });
    const { UploadId } = await s3Client.send(createMultipartUpload);

    if (!UploadId) {
      throw new Error("Failed to initiate multipart upload.");
    }

    // Step 2: Upload Parts
    const uploadPromises = [];
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = fileBuffer.slice(start, end);

      uploadPromises.push(
        (async () => {
          const uploadPart = new UploadPartCommand({
            Bucket,
            Key,
            UploadId,
            PartNumber: partNumber,
            Body: Readable.from(chunk),
            ContentLength: chunk.length, // ✅ Fix: Ensure ContentLength is set
          });
          const { ETag } = await s3Client.send(uploadPart);
          return { PartNumber: partNumber, ETag };
        })()
      );
    }

    const uploadedParts = await Promise.all(uploadPromises);

    // Step 3: Complete Multipart Upload
    const completeMultipartUpload = new CompleteMultipartUploadCommand({
      Bucket,
      Key,
      UploadId,
      MultipartUpload: {
        Parts: uploadedParts,
      },
    });

    await s3Client.send(completeMultipartUpload);

    // Remove local file after successful upload
    await removeFile(file.path);

    return {
      Location: `https://${Bucket}.nyc3.digitaloceanspaces.com/${Key}`,
      Bucket,
      Key,
    };
  } catch (error) {
    console.error("Error in multipart upload:", error);

    // Abort multipart upload in case of failure
    // if (error.UploadId ) {
    //   await abortMultipartUpload(Bucket, Key, error.UploadId);
    // }

    throw error;
  }
};

// **Abort Multipart Upload (Optional)**
const abortMultipartUpload = async (
  Bucket: string,
  Key: string,
  UploadId: string
) => {
  try {
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket,
      Key,
      UploadId,
    });
    await s3Client.send(abortCommand);
    console.log(`Multipart upload aborted: ${Key}`);
  } catch (error) {
    console.error("Error aborting multipart upload:", error);
  }
};

// Export file uploader methods
export const fileUploader = {
  upload,
  uploadMultipleImage,
  uploadToDigitalOcean,
  uploadPostImage,
  uploadFile,
  uploadReportImage,
  abortMultipartUpload,
  uploadServiceImage,
  uploadReviewFile,
};
