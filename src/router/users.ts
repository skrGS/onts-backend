import express from "express";

import { getAllUsers, getUser, findUserRegister } from "../controllers/users";
import authentication from "./authentication";

export default (router: express.Router) => {
  router.get("/users/:registerNumber", findUserRegister);
  authentication(router);
  router.get("/users", getAllUsers);

  return router;
};
