import mongoose, { Schema, type Document } from "mongoose";

type IQuestion = {
  question: string;
  answers: string[];
  correct_answer: number;
  points: number;
};

type IQuiz = {
  name: string;
  description: string;
  status: string;
  questions: IQuestion[];
  createdBy: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  dueDate: Date;
  timeLimit?: number;
} & Document;

const QuestionSchema: Schema = new Schema({
  question: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correct_answer: { type: Number, required: true, min: 0, max: 3 },
  points: { type: Number, required: true },
});

const QuizSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    status: { type: Boolean, required: true, default: false },
    questions: [QuestionSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      index: true,
    },
    dueDate: Date,
    timeLimit: Number,
  },
  { timestamps: true },
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
