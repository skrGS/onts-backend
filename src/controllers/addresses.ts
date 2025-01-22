import express from "express";

import Address from "../db/Address";
/**
 * @author tushig
 */
export const getAllAddress = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const address = await Address.find();
    return res.status(200).json(address).end();
  } catch (error) {
    return res.sendStatus(400);
  }
};
