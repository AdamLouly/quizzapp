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

const QuizResultsSchema: Schema = new Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [
    {
      question: { type: Schema.Types.ObjectId, ref: "Question" },
      selectedOption: { type: String },
    },
  ],
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

export const QuizResults = mongoose.model<IQuizResults>(
  "QuizResults",
  QuizResultsSchema,
);
