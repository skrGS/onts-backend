import express from "express";

import { getUsers, deleteUserById, User } from "../db/Users";
import MyError from "../utils/myError";
/**
 * @author tushig
 */
export const getAllUsers = async (
  req: express.Request,
  res: express.Response
) => {
  try {
    const users = await getUsers();
    return res.status(200).json(users).end();
  } catch (error) {
    return res.sendStatus(400);
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
    const user = await User.findOne({ registerNumber: registerNumber });
    if (!user) {
      return res.status(201).json({
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
