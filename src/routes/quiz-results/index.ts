import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { PublishedQuiz } from "../../models/PublishedQuiz";

type QuizResultRequest = {
  body: {
    type: "object";
    required: ["publishedQuizId", "quizId", "answers"];
    properties: {
      publishedQuizId: { type: "string" };
      quizId: { type: "string" };
      answers: { type: "array"; items: { type: "string" } };
    };
    additionalProperties: false;
  };
};

const quizResultRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.post<{ Body: QuizResultRequest }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { publishedQuizId, quizId, answers } = request.body;

        const publishedQuiz =
          await PublishedQuiz.findById(publishedQuizId).populate("quizId");

        if (!publishedQuiz) {
          return reply.code(404).send({ error: "Published quiz not found" });
        }

        if (quizId !== publishedQuiz.quizId._id.toString()) {
          return reply.code(400).send({
            error: "Requested quizId does not match the published quiz",
          });
        }

        let score = 0;
        answers.forEach((selectedAnswer, index) => {
          const correctAnswerIndex =
            publishedQuiz.quizId.questions[index].correct_answer;
          if (selectedAnswer === correctAnswerIndex.toString()) {
            score++;
          }
        });

        const totalQuestions = publishedQuiz.quizId.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        const studentId = request?.user?._id;
        const newQuizResult = new QuizResult({
          publishedQuizId,
          quizId,
          answers,
          studentId,
          score,
          percentageScore,
        });
        const savedQuizResult = await newQuizResult.save();

        reply.code(201).send({ quizResult: savedQuizResult });
      } catch (error: any) {
        handleError(reply, 500, `Failed to save quiz result: ${error.message}`);
      }
    },
  );

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const currentDate = new Date();

      const publishedQuizzes = await PublishedQuiz.find({
        dueDate: { $lt: currentDate },
      })
        .populate("quizId")
        .lean();

      const quizResults = await QuizResult.find({
        studentId: request.user._id,
        publishedQuizId: { $in: publishedQuizzes.map((pq) => pq._id) },
      })
        .populate("quizId")
        .lean();

      const filteredPublishedQuizzes = publishedQuizzes.filter(
        (publishedQuiz) =>
          !quizResults.some((quizResult) =>
            quizResult.publishedQuizId.equals(publishedQuiz._id),
          ),
      );

      reply.send({
        quizzes: quizResults,
        publishedQuizzes: filteredPublishedQuizzes,
      });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const quiz = await QuizResult.findById(request.params.id)
        .populate("quizId")
        .lean();
      if (!quiz) {
        return reply.code(404).send({ message: "Quiz result not found" });
      }
      reply.send({ quiz });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });
};

export default quizResultRoutes;
