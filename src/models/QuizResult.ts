import mongoose, { Schema, Document } from "mongoose";

interface IQuizResult extends Document {
  publishedQuizId: Schema.Types.ObjectId;
  quizId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  answers: number[];
  score: number;
}

const QuizResultSchema: Schema = new Schema(
  {
    publishedQuizId: {
      type: Schema.Types.ObjectId,
      ref: "PublishedQuiz",
      required: true,
      index: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: [{ type: Number }],
    score: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const QuizResult = mongoose.model<IQuizResult>(
  "QuizResult",
  QuizResultSchema,
);
