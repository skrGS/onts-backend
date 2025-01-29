import express from "express";

import { getUsers, deleteUserById, User } from "../db/Users";
import MyError from "../utils/myError";
import Wallet from "../db/Wallet";
import { Request } from "../middlewares/sign";
/**
 * @author tushig
 */

export const me = async (req: Request, res: express.Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(201);
    }
    return res.status(200).json(user).end();
  } catch (error) {
    return res.sendStatus(401);
  }
};

export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  const { city, isPayment } = req.query;
  try {
    const filters: { [key: string]: any } = {};
    if (city) {
      filters.city = city;
    }
    if (isPayment) {
      filters.isPayment = isPayment;
    }
    const users = await getUsers(filters);
    return res.status(200).json(users).end();
  } catch (error) {
    return res.sendStatus(400);
  }
};

export const paymentSuccess = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new MyError("Хэрэглэгч олдсонгүй", 404);
  }
  if (!user.level) {
    throw new MyError("Хэрэглэгчийн мэдээлэл дутуу байна!", 404);
  }
  if (user.wallet) {
    const wallet = await Wallet.findByIdAndUpdate(
      user.wallet,
      { isPayment: true },
      { new: true }
    );
    if (!wallet) {
      throw new MyError("Амжилтгүй хөгжүүлэгчид хандана уу!", 404);
    }
    if (wallet.amount === 0) {
      const amount =
        user.level === "Бага(3-5-р анги)"
          ? 20000
          : user.level === "Дунд(6-9-р анги)"
          ? 25000
          : 30000;
      wallet.amount = amount;
      wallet.save();
    }
    return res.status(200).json(user);
  } else {
    const amount =
      user.level === "Бага(3-5-р анги)"
        ? 20000
        : user.level === "Дунд(6-9-р анги)"
        ? 25000
        : 30000;
    await Wallet.create({
      isPayment: true,
      amount,
      user: user._id,
    });
    return res.status(200).json(user);
  }
};

export const deleteUser = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { id } = req.params;
    const user = await deleteUserById(id);
    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(400);
  }
};

export const getUser = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      throw new MyError("Хэрэглэгч олдсонгүй", 404);
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.sendStatus(400);
  }
};

export const findUserRegister = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const { registerNumber } = req.params;
    const user = await User.findOne({
      registerNumber: registerNumber,
    }).populate("wallet");
    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Хэрэглэгч олдсонгүй",
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.log(err);
    throw new MyError("Серверийн алдаа гарлаа.", 500);
  }
};
