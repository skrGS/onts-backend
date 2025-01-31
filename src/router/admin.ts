import express from "express";
import { chartDashboard, dashboard, downloadUsers } from "../controllers/admin";

export default (router: express.Router) => {
  router.get("/admin/dashboard", dashboard);
  router.get("/admin/chart-dashboard", chartDashboard);
  router.get("/admin/convert-excel", downloadUsers);
};
