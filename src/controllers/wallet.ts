import express from "express";
import Wallet from "../db/Wallet";
import { Request } from "../middlewares/sign";
/**
 * @author tushig
 */
export const getWallet = async (req: Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const wallet = await Wallet.findById(id);

    return res.status(200).json(wallet).end();
  } catch (error) {
    return res.sendStatus(400);
  }
};
