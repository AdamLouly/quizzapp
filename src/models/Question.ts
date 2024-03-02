/* Import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  question: string;
  answers: string[];
  correct_answer: number;
  points: number;
}

// Define Question schema
const QuestionSchema: Schema = new Schema(
  {
    question: { type: String, required: true },
    answers: { type: [String], required: true, minItems: 2, maxItems: 4 }, // Example: at least 2 answers required
    correct_answer: { type: Number, required: true, min: 0, max: 3 }, // Index of the correct answer in the answers array
    points: { type: Number, required: true },
  },
  { timestamps: true },
);

// Create Question model
export const Question = mongoose.model<IQuestion>("Question", QuestionSchema);
 */
