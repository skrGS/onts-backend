import express from "express";
import { getWallet } from "../controllers/wallet";
export default (router: express.Router) => {
  router.get("/wallet/:id", getWallet);
};
