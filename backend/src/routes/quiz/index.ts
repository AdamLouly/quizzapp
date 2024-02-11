// src/routes/quiz/index.ts

import { FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";
import { Question } from "../../models/Question";

const quizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Create a quiz
  fastify.post(
    "/create",
    { preValidation: [fastify.authenticate, fastify.authorize(["teacher"])] },
    async (request, reply) => {
      try {
        const { title, description, expirationTime } = request.body;
        const createdBy = request.user.id; // Assuming request.user is populated by the authentication middleware

        const newQuiz = await Quiz.create({
          title,
          description,
          createdBy,
          expirationTime,
        });

        reply.send({ status: "success", data: newQuiz });
      } catch (error) {
        reply
          .code(500)
          .send({ status: "error", message: "Failed to create quiz" });
      }
    },
  );

  fastify.post(
    "/:quizId/questions",
    { preValidation: [fastify.authenticate, fastify.authorize(["teacher"])] },
    async (request, reply) => {
      try {
        const { quizId } = request.params;
        const { questionText, options, correctAnswer } = request.body;

        const question = await Question.create({
          text: questionText,
          options,
          correctAnswer,
        });

        const updatedQuiz = await Quiz.findByIdAndUpdate(
          quizId,
          { $push: { questions: question._id } },
          { new: true },
        );

        reply.send({ status: "success", data: updatedQuiz });
      } catch (error) {
        reply
          .code(500)
          .send({ status: "error", message: "Failed to add question to quiz" });
      }
    },
  );

  fastify.get(
    "/:quizId",
    { preValidation: [fastify.authenticate, fastify.authorize(["student"])] },
    async (request, reply) => {
      try {
        const { quizId } = request.params;
        const quiz = await Quiz.findById(quizId).populate(
          "questions",
          "-correctAnswer",
        );

        if (!quiz) {
          return reply.code(404).send({ message: "Quiz not found" });
        }

        reply.send({ status: "success", data: quiz });
      } catch (error) {
        reply
          .code(500)
          .send({ status: "error", message: "Failed to fetch quiz questions" });
      }
    },
  );

  fastify.post(
    "/:quizId/submit",
    { preValidation: [fastify.authenticate, fastify.authorize(["student"])] },
    async (request, reply) => {
      try {
        const { quizId } = request.params;
        const { answers } = request.body; // Assuming answers is an array of { questionId, selectedOption }

        const quiz = await Quiz.findById(quizId).populate("questions");
        if (!quiz) {
          return reply.code(404).send({ message: "Quiz not found" });
        }

        let score = 0;
        answers.forEach((answer) => {
          const question = quiz.questions.find(
            (q) => q._id.toString() === answer.questionId,
          );
          if (question && question.correctAnswer === answer.selectedOption) {
            score += 1; // Assuming each question is worth 1 point
          }
        });

        const totalScore = (score / quiz.questions.length) * 100; // Calculate percentage

        // Save results to database (implementation depends on your QuizResults model)

        reply.send({
          status: "success",
          message: `Quiz submitted. Score: ${totalScore}%`,
        });
      } catch (error) {
        reply
          .code(500)
          .send({ status: "error", message: "Failed to submit quiz answers" });
      }
    },
  );
};

export default quizRoutes;
