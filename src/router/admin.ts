import express from "express";
import { chartDashboard, dashboard } from "../controllers/admin";

export default (router: express.Router) => {
  router.get("/admin/dashboard", dashboard);
  router.get("/admin/chart-dashboard", chartDashboard);
};
