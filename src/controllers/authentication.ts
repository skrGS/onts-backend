import express from "express";
import { createUser, User } from "../db/Users";
import { Request } from "../middlewares/sign";
import MyError from "../utils/myError";
import Wallet from "../db/Wallet";
/**
 * @author tushig
 */

export const getToken = async (): Promise<string> => {
  const response = await fetch("https://merchant.qpay.mn/v2/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic U0FOVEFfTU46Z3F2SWlKSnI=`,
      "Content-Type": "application/json",
    },
  });
  const data = await response.json();
  return data.access_token;
};

export const createProfile = async (req: Request, res: express.Response) => {
  const {
    amount,
    lastName,
    firstName,
    registerNumber,
    phone,
    emergencyPhone,
    city,
    district,
    school,
    classGroup,
    lesson,
    teacher,
    level,
  } = req.body;
  const wallet = await Wallet.create({});
  const token = await getToken();
  try {
    const newUser = await createUser({
      lastName,
      firstName,
      registerNumber,
      phone,
      emergencyPhone,
      city,
      district,
      school,
      classGroup,
      lesson,
      teacher,
      level,
    });
    const response = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_code: "SANTA_MN_INVOICE",
        sender_invoice_no: "12345678",
        invoice_receiver_code: newUser.registerNumber,
        invoice_description: `Хэрэглэгчийн мэдээлэл бүртгэл: ${newUser.phone}`,
        amount: amount,
        callback_url: `https://onts.boosters.mn/callbacks/${wallet._id}/${newUser._id}`,
      }),
    });

    const data = await response.json();
    wallet.set({
      qrImage: data.qr_image,
      invoiceId: data.invoice_id,
      amount: amount,
      urls: data.urls,
      user: newUser._id,
    });
    await wallet.save();

    res.status(200).json({
      walletId: wallet._id,
      userId: newUser._id,
    });
  } catch (error) {
    throw new MyError("Серверийн алдаа гарлаа.", 500);
  }
};

export const hasPayment = async (req: Request, res: express.Response) => {
  console.log("object", req.params.id, req.params.numId);
  try {
    const wallet = await Wallet.findById(req.params.id);
    const user = await User.findById(req.params.numId);

    if (!wallet || !user) {
      throw new MyError("Хэрэглэгч олдсонгүй", 404);
    }

    if (wallet.isPayment) {
      return res.status(200).json({
        success: true,
      });
    }

    wallet.isPayment = true;

    user.spentAmount += wallet.amount;

    await Promise.all([user.save(), wallet.save()]);

    return res.status(200).json({
      message: "Төлбөр амжилттай төлөгдлөө",
      success: true,
    });
  } catch (error) {
    throw new MyError("Алдаа гарлаа!", 500);
  }
};

export const paymentQrCheck = async (req: Request, res: express.Response) => {
  const { id, userId } = req.params;
  const user = await User.findById(userId);
  const wallet = await Wallet.findOne({ invoiceId: id });
  if (!wallet) {
    throw new MyError("Төлбөр олдсонгүй", 404);
  }
  if (!user) {
    throw new MyError("Хэрэглэгч олдсонгүй", 404);
  }
  const token = await getToken();
  const response = await fetch("https://merchant.qpay.mn/v2/payment/check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_type: "INVOICE",
      invoice_id: id,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });
  const data = await response.json();
  const count = data.count;
  console.log(data);
  if (count === 0) {
    res.status(200).json({
      success: false,
      message: "Төлбөр төлөгдөөгүй байна",
    });
  } else {
    wallet.isPayment = true;
    user.spentAmount += wallet.amount;
    await Promise.all([user.save(), wallet.save()]);
    res.status(200).json({
      success: true,
      message: "Төлбөр амжилттай төлөгдлөө",
    });
  }
};
