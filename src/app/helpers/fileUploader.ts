import multer from "multer";
import path from "path";
// import prisma from '../shared/prisma';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, path.join( "/var/www/uploads"));
    cb(null, path.join(process.cwd(), "uploads"));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// upload single image
const uploadprofileImage = upload.single("profileImage");
const uploadCertificateImage = upload.single("certificate");

export const fileUploader = {
  upload,
  uploadprofileImage,
  uploadCertificateImage,
};
