import express from "express";
import authentication from "./authentication";
import users from "./users";
import wallet from "./wallet";
import addresses from "./addresses";
import admin from "./admin";
const clientRouter = express.Router();

export const createClientRouter = (): express.Router => {
  authentication(clientRouter);
  users(clientRouter);
  wallet(clientRouter);
  addresses(clientRouter);
  admin(clientRouter);
  return clientRouter;
};
