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
const uploadProductImage = upload.single("productImage");

// // upload multiple image
// const uploadmultipeImage = upload.fields([
//   { name: "profileImage", maxCount: 1 },
//   { name: "idCardFront", maxCount: 1 },
//   { name: "idCardBack", maxCount: 1 },
//   { name: "licenseFront", maxCount: 1 },
//   { name: "licenseBack", maxCount: 1 },
//   { name: "kjoreseddelFront", maxCount: 1 },
//   { name: "kjoreseddelBack", maxCount: 1 },
//   { name: "image", maxCount: 1 },
//   { name: "taxiMeter", maxCount: 1 },
//   { name: "roofLight", maxCount: 1 },
//   { name: "insurance", maxCount: 1 },
// ]);

export const fileUploader = {
  upload,
  uploadprofileImage,
  uploadProductImage,
};
