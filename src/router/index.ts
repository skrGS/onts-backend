import express from "express";
import authentication from "./authentication";
import users from "./users";
import wallet from "./wallet";
const clientRouter = express.Router();

export const createClientRouter = (): express.Router => {
  authentication(clientRouter);
  users(clientRouter);
  wallet(clientRouter);
  return clientRouter;
};
