import mongoose, { Document, Schema } from "mongoose";

interface IAddress extends Document {
  name: string;
  parent: string | null;
  level: number;
  createdAt: Date;
}

const AddressSchema: Schema = new Schema<IAddress>({
  name: { type: String, required: false },
  parent: { type: String, required: false },
  level: { type: Number, required: false },
  createdAt: { type: Date, default: Date.now },
});

const Address = mongoose.model<IAddress>("Address", AddressSchema);

export default Address;
