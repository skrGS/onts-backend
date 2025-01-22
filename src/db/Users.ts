import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import { config } from "../config";
import MyError from "../utils/myError";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
  lastName: string;
  firstName: string;
  registerNumber: string;
  phone: string;
  emergencyPhone: string;
  city: string;
  district: string;
  school: string;
  classes: string;
  classGroup: string;
  lesson: string;
  teacher: string;
  level: string;
  spentAmount: number;
  authentication: {
    password: string;
    salt: string;
    sessionToken: string;
  };
  wallet: mongoose.Schema.Types.ObjectId | null;

  sessionScope: string;
  createdAt: Date;
  validatePassword: (password: string) => Promise<boolean>;
  getJsonWebToken(): string;
}

const UserSchema = new mongoose.Schema({
  lastName: String,
  firstName: String,
  registerNumber: {
    type: String,
    unique: true,
  },
  invoiceId: String,
  phone: String,
  emergencyPhone: String,
  city: String,
  district: String,
  school: String,
  classes: String,
  classGroup: String,
  lesson: String,
  teacher: String,
  level: String,
  spentAmount: {
    type: Number,
    default: 0,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: false,
  },
  authentication: {
    password: {
      type: String,
      // required: true,
      select: false,
    },
    salt: {
      type: String,
      select: false,
    },
    sessionToken: {
      type: String,
      select: false,
    },
  },
  sessionScope: {
    type: String,
    default: "UNAUTHORIZED",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model("User", UserSchema);

UserSchema.methods.validatePassword = async function (password: string) {
  if (!this.password) throw new MyError("Хүсэлт амжилтгүй", 401);
  const valid = await bcrypt.compare(password, this.password);
  return valid;
};

export const createUser = async (values: Record<string, any>) =>
  new User(values).save().then((user) => user.toObject());
export const findUser = async (username: string) => {
  return User.findOne({ username });
};
export const getUsers = async () => {
  return User.find();
};
export const getUserById = async (id: string) => {
  return User.findById(id).populate("role");
};
export const updateUser = async (id: string, authentication: any) => {
  return User.findByIdAndUpdate(
    id,
    { authentication, sessionScope: "AUTHORIZED" },
    { new: true }
  );
};

export const updatePassword = async (id: string, password: any) => {
  return User.findByIdAndUpdate(
    id,
    { password, sessionScope: "AUTHORIZED" },
    { new: true }
  );
};
export const getUserBySessionToken = async (sessionToken: string) => {
  return User.findOne({ "authentication.sessionToken": sessionToken });
};
export const deleteUserById = async (id: string) => {
  return User.findByIdAndDelete(id);
};
export const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  return password.length >= minLength && hasUppercase;
};

UserSchema.methods.getJsonWebToken = function () {
  return jwt.sign({ id: this._id }, config.jwt.jwtSecret, {
    expiresIn: config.jwt.jwtExpiresIn,
  });
};
