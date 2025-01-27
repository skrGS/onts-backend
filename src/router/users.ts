import express from "express";

import {
  getAllUsers,
  findUserRegister,
  paymentSuccess,
} from "../controllers/users";
import authentication from "./authentication";
import { register } from "../controllers/authentication";

export default (router: express.Router) => {
  router.get("/users/:registerNumber", findUserRegister);
  authentication(router);
  router.get("/users", getAllUsers);
  router.get("/user-payment-success/:id", paymentSuccess);
  router.post("/register", register);

  return router;
};
