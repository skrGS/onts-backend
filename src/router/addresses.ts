import express from "express";
import { getAllAddress } from "../controllers/addresses";

export default (router: express.Router) => {
  router.get("/address", getAllAddress);

  return router;
};
