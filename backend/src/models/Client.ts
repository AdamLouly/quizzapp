import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, optional: true },
    email: { type: String, optional: true },
    phone: { type: String, optional: true }
  },
  {
    timestamps: true,
  },
);

export const Client = mongoose.model("Client", clientSchema);
