import express from "express";
import auth from "../../middlewares/auth";
import { ServiceControllers } from "./service.controller";
import parseBodyData from "../../../helpers/parseBodyData";
import { fileUploader } from "../../helpers/fileUploader";
const router = express.Router();

router.post(
  "/",
  auth("SELLER", "ADMIN"),
  fileUploader.uploadServiceImage,
  parseBodyData,
  ServiceControllers.createService
);

router.get("/", auth(), ServiceControllers.getMyServices);

router.get("/all", auth(), ServiceControllers.getAllServices);

router.get("/popular-artist", ServiceControllers.getPopularArtist);

router.get("/popular-services", ServiceControllers.getPopularServices);

router.get("/:serviceId", auth(), ServiceControllers.getSingleService);

router.put(
  "/:id",
  auth("SELLER", "ADMIN"),
  fileUploader.uploadServiceImage,
  parseBodyData,
  ServiceControllers.updateService
);

router.post(
  "/delete/:id",
  auth("SELLER", "ADMIN"),
  ServiceControllers.deleteService
);



export const ServiceRouters = router;
