import express from "express";

import {
  createInvoice,
  createProfile,
  deleteUser,
  hasPayment,
  paymentQrCheck,
} from "../controllers/authentication";
import { auth } from "../middlewares";

export default (router: express.Router) => {
  router.post("/auth/profile", createProfile);
  router.delete("/delete/:id", auth, deleteUser);
  router.post("/create-invoice", createInvoice);
  router.get("/callbacks/:id/:numId", hasPayment);
  router.get("/invoice-check/:id/:userId", paymentQrCheck);
};
