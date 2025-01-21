import mongoose, { Document, Schema } from "mongoose";

interface IWallet extends Document {
  urls?: {
    name: string;
    description: string;
    logo: string;
    link: string;
  }[];
  qrImage?: string;
  invoiceId?: string;
  amount: number;
  createdAt: Date;
  isPayment: boolean;
  user: mongoose.Types.ObjectId;
  description?: string;
}

const WalletSchema: Schema = new Schema<IWallet>({
  urls: [
    {
      name: {
        type: String,
      },
      description: {
        type: String,
      },
      logo: {
        type: String,
      },
      link: {
        type: String,
      },
    },
  ],
  qrImage: { type: String, required: false },
  invoiceId: { type: String, required: false },
  amount: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
  isPayment: {
    type: Boolean,
    default: false,
  },
  description: { type: String, required: false },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);

export default Wallet;
