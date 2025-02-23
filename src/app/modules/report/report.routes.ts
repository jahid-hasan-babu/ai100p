import express from "express";
import auth from "../../middlewares/auth";
import { ReportControllers } from "./report.controller";
import parseBodyData from "../../../helpers/parseBodyData";
import { fileUploader } from "../../helpers/fileUploader";
const router = express.Router();


router.post(
  "/create-report",
  auth(),
  fileUploader.uploadReportImage,
  parseBodyData,
  ReportControllers.makeReport
);

router.get("/my-reports", auth(), ReportControllers.getMyReports);

router.get("/all-reports", auth("ADMIN", "SUPERADMIN"), ReportControllers.getAllReports);

router.get("/report-as-owner", auth(), ReportControllers.getMyReportAsOwner);

router.delete("/:id", auth("ADMIN", "SUPERADMIN"), ReportControllers.deleteReport);

export const ReportRouters = router;
