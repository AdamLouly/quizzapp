import mongoose, { Schema, Document } from "mongoose";

export interface IQuiz extends Document {
  title: string;
  description: string;
  questions: String[];
  createdBy: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  dueDate: Date;
  timeLimit?: number; // Optional time limit in minutes
}

const QuizSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    dueDate: Date,
    timeLimit: Number,
  },
  { timestamps: true },
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
