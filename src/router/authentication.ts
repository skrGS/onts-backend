import express from "express";

import {
  createProfile,
  hasPayment,
  paymentQrCheck,
} from "../controllers/authentication";

export default (router: express.Router) => {
  router.post("/auth/profile", createProfile);
  router.get("/callbacks/:id/:numId", hasPayment);
  router.get("/invoice-check/:id/:userId", paymentQrCheck);
};
