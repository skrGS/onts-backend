import express from "express";
import { createUser, IUser, User } from "../db/Users";
import { createExpireIn, Request, signIn } from "../middlewares/sign";
import MyError from "../utils/myError";
import Wallet from "../db/Wallet";
import { authentication } from "../helpers";
import crypto from "crypto";
/**
 * @author tushig
 */

export const login = async (req: express.Request, res: express.Response) => {
  const { phone, password } = req.body;
  console.log(phone, password);
  try {
    const user = (await User.findOne({ phone: phone }).select(
      "+authentication.salt +authentication.password"
    )) as IUser;

    if (!user) {
      throw new MyError("Хэрэглэгч олдсонгүй.", 401);
    }

    if (
      !user.authentication ||
      !user.authentication.salt ||
      !user.authentication.password
    ) {
      throw new MyError("Нэвтрэх мэдээлэл алга байна.", 401);
    }

    const expectedHash = authentication(user.authentication.salt, password);
    if (user.authentication.password !== expectedHash) {
      throw new MyError("Нууц үг буруу байна.", 401);
    }

    user.set({
      sessionScope: "AUTHORIZED",
    });
    await user.save();

    signIn(
      res,
      {
        user: user,
        expiresIn: createExpireIn(24 * 30, "hours"),
      },
      "AUTHORIZED"
    );
  } catch (error) {
    if (error instanceof MyError) {
      throw new MyError(error.message, error.statusCode);
    }
    throw new MyError("Серверийн алдаа гарлаа.", 500);
  }
};

function generatePassword(length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
const random = () => crypto.randomBytes(128).toString("base64");
export const register = async (req: express.Request, res: express.Response) => {
  const { phone, password, role = "admin" } = req.body;
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new MyError("Утасны дугаар бүртгэлтэй байна!", 403);
  }
  if (!phone) {
    throw new MyError("Утасны дугаар оруулна уу!", 403);
  }
  if (!password) {
    throw new MyError("Нууц үг оруулна уу!", 403);
  }
  if (!role) {
    throw new MyError("Хэрэглэгчийн эрх оруулна уу!", 403);
  }
  const salt = random();
  const auth = {
    password: authentication(salt, password),
    salt,
  };

  try {
    const newUser = new User({
      phone,
      password,
      role,
      authentication: auth,
      registerNumber: generatePassword(),
    });

    if (!newUser) {
      throw new MyError("Хэрэглэгч хадгалахад алдаа гарлаа!", 403);
    }
    await newUser.save();
    return res.status(200).json(newUser);
  } catch (err) {
    console.log(err);
    throw new MyError("Серверийн алдаа!", 403);
  }
};

export const getToken = async (): Promise<string> => {
  const response = await fetch("https://merchant.qpay.mn/v2/auth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic T05UU19NTjpmajRuMVcxeg=`,
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
    classes,
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
      classes,
      wallet: wallet._id,
    });
    const response = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_code: "ONTS_MN_INVOICE",
        sender_invoice_no: newUser.registerNumber,
        invoice_receiver_code: newUser.registerNumber,
        invoice_description: newUser.registerNumber,
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
    user.wallet = wallet._id as any;

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
      object_id: id,
      offset: {
        page_number: 1,
        page_limit: 100,
      },
    }),
  });
  const data = await response.json();
  const count = data.count;
  if (count === 0) {
    res.status(200).json({
      success: false,
      message: "Төлбөр төлөгдөөгүй байна",
    });
  } else {
    wallet.isPayment = true;
    user.spentAmount += wallet.amount;
    user.wallet = wallet._id as any;
    await Promise.all([user.save(), wallet.save()]);
    res.status(200).json({
      success: true,
      message: "Төлбөр амжилттай төлөгдлөө",
    });
  }
};

export const createInvoice = async (req: Request, res: express.Response) => {
  const wallet = await Wallet.create({});
  const token = await getToken();
  const { registerNumber, amount } = req.body;
  const user = await User.findOne({ registerNumber: registerNumber });
  if (!user) {
    throw new MyError("Хэрэглэгч олдсонгүй", 404);
  }
  try {
    const response = await fetch("https://merchant.qpay.mn/v2/invoice", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        invoice_code: "ONTS_MN_INVOICE",
        sender_invoice_no: user.registerNumber,
        invoice_receiver_code: user?.registerNumber,
        invoice_description: user.registerNumber,
        amount: amount,
        callback_url: `https://onts.boosters.mn/callbacks/${wallet._id}/${user._id}`,
      }),
    });

    const data = await response.json();
    wallet.set({
      qrImage: data.qr_image,
      invoiceId: data.invoice_id,
      amount: amount,
      urls: data.urls,
      user: user._id,
    });
    user.set({
      wallet: wallet._id,
    });
    await wallet.save();
    await user.save();

    res.status(200).json({
      walletId: wallet._id,
      userId: user._id,
    });
  } catch (error) {
    throw new MyError("Серверийн алдаа гарлаа.", 500);
  }
};

export const deleteUser = async (
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new MyError("Хэрэглэгч олдсонгүй", 404);
    }
    res.status(200).json({
      success: true,
      message: "Хэрэглэгч амжилттай устгагдлаа",
    });
  } catch (error) {
    console.log(error);
    throw new MyError("Серверийн алдаа гарлаа.", 500);
  }
};
