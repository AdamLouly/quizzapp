import mongoose, { Schema, Document } from "mongoose";

interface IClass extends Document {
  name: string;
  teacher: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  quizzes: mongoose.Types.ObjectId[];
}

const ClassSchema: Schema = new Schema({
  name: { type: String, required: true },
  teacher: { type: Schema.Types.ObjectId, ref: "User" },
  students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  quizzes: [{ type: Schema.Types.ObjectId, ref: "Quiz" }],
});

export const Class = mongoose.model<IClass>("Class", ClassSchema);
