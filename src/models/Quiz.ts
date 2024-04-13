import mongoose, { Schema, type Document } from "mongoose";

type IQuestion = {
  question: string;
  answers: string[];
  correct_answer: number;
};

type IQuiz = {
  title: string;
  content: string;
  questions: IQuestion[];
  createdBy: Schema.Types.ObjectId;
} & Document;

const QuestionSchema: Schema = new Schema({
  question: { type: String, required: true },
  answers: [{ type: String, required: true }],
  correct_answer: { type: Number, required: true, min: 0 },
});

const QuizSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    client: { type: Schema.Types.ObjectId, ref: "Client", index: true },
  },
  { timestamps: true },
);

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
