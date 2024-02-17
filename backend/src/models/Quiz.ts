import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  title: string;
  description: string;
  questions: String[];
  createdBy: mongoose.Types.ObjectId;
  expirationTime: Date;
}

const QuizSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  expirationTime: { type: Date, required: true },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
});

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
