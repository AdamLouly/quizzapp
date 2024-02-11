import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  text: string;
  options: string[];
  correctAnswer: string;
}

const QuestionSchema: Schema = new Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
});

export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
