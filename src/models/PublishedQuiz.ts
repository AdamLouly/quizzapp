import mongoose, { Schema, Document } from "mongoose";

interface IPublishedQuiz extends Document {
  quizId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  dueDate: Date;
  timeLimit?: number;
}

const PublishedQuizSchema: Schema = new Schema(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    dueDate: { type: Date, required: true },
    timeLimit: Number,
  },
  { timestamps: true },
);

export const PublishedQuiz = mongoose.model<IPublishedQuiz>(
  "PublishedQuiz",
  PublishedQuizSchema,
);
