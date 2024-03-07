import mongoose, { Schema, type Document } from "mongoose";

type IQuestion = {
  question: string;
  answers: string[];
  correct_answer: number;
};

type IQuiz = {
  name: string;
  questions: IQuestion[];
  createdBy: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  dueDate: Date;
  timeLimit?: number;
} & Document;

const QuestionSchema: Schema = new Schema({
  question: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correct_answer: { type: Number, required: true, min: 0 },
});

const QuizSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
