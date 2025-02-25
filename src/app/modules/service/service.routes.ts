import express from "express";
import auth from "../../middlewares/auth";
import { ServiceControllers } from "./service.controller";
import parseBodyData from "../../../helpers/parseBodyData";
import { fileUploader } from "../../helpers/fileUploader";
const router = express.Router();

router.post(
  "/",
  auth(),
  fileUploader.uploadServiceImage,
  parseBodyData,
  ServiceControllers.createService
);

router.get("/", auth(), ServiceControllers.getMyServices);

router.get("/all", auth(), ServiceControllers.getAllServices);

router.put(
  "/:id",
  auth(),
  fileUploader.uploadServiceImage,
  parseBodyData,
  ServiceControllers.updateService
);

router.post("/delete/:id", auth(), ServiceControllers.deleteService);



export const ServiceRouters = router;
