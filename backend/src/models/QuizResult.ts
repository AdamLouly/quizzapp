import mongoose, { Schema, Document } from "mongoose";

interface IQuizResults extends Document {
  quiz: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: {
    question: mongoose.Types.ObjectId;
    selectedOption: string;
  }[];
  score: number;
}

const QuizResultSchema = new Schema(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [{ questionId: Schema.Types.ObjectId, answer: String }],
    score: Number,
    completedAt: Date,
  },
  { timestamps: true },
);

export const QuizResults = mongoose.model<IQuizResults>(
  "QuizResults",
  QuizResultSchema,
);
