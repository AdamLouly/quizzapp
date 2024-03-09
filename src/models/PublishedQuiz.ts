import mongoose, { Schema, Document } from "mongoose";

interface IPublishedQuiz extends Document {
  quizId: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  dueDate: Date;
  createdBy: Schema.Types.ObjectId;
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const PublishedQuiz = mongoose.model<IPublishedQuiz>(
  "PublishedQuiz",
  PublishedQuizSchema,
);
