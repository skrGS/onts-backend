import express from "express";

import {
  getAllUsers,
  findUserRegister,
  paymentSuccess,
  me,
  updateUser,
} from "../controllers/users";
import authentication from "./authentication";
import { login, register } from "../controllers/authentication";
import { auth } from "../middlewares";

export default (router: express.Router) => {
  router.get("/users/:registerNumber", findUserRegister);
  router.post("/user/login", login);
  router.post("/user/register", register);
  authentication(router);
  router.get("/users", auth, getAllUsers);
  router.post("/user/payment-success/:id", auth, paymentSuccess);
  router.post("/user/update/:id", auth, updateUser);
  router.get("/user/me", auth, me);

  return router;
};
