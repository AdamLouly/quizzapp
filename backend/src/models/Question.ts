import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  text: string;
  choices: string[];
  points: Number;
}

const QuestionSchema = new Schema(
  {
    text: { type: String, required: true },
    choices: [{ text: String, isCorrect: Boolean }],
    points: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
