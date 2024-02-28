import mongoose, { Schema, type Document } from "mongoose";

type IClass = {
  name: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  quizzes: mongoose.Types.ObjectId[];
} & Document;

const ClassSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User" },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    client: { type: Schema.Types.ObjectId, ref: "Client" },
  },
  { timestamps: true },
);

export const Class = mongoose.model<IClass>("Class", ClassSchema);
