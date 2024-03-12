import { type FastifyPluginAsync } from "fastify";
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
  fastify.post<{ Body: QuizResultRequest }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      try {
        const {
          publishedQuizId,
          quizId: requestedQuizId,
          answers,
        } = request.body;

        // Retrieve the published quiz data from the database
        const publishedQuiz: any =
          await PublishedQuiz.findById(publishedQuizId).populate("quizId");

        if (!publishedQuiz) {
          return reply.code(404).send({ error: "Published quiz not found" });
        }

        // Ensure the requested quizId matches the one from the retrieved publishedQuiz
        if (requestedQuizId !== publishedQuiz.quizId._id.toString()) {
          return reply.code(400).send({
            error: "Requested quizId does not match the published quiz",
          });
        }

        // Calculate the score and percentage score
        let score = 0;
        answers.forEach((selectedAnswer: string, index: number) => {
          const correctAnswerIndex =
            publishedQuiz.quizId.questions[index].correct_answer;
          if (selectedAnswer === correctAnswerIndex.toString()) {
            score++;
          }
        });
        const totalQuestions = publishedQuiz.quizId.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        // Save the quiz result
        const studentId = request?.user?._id;
        const newQuizResult = new QuizResult({
          publishedQuizId,
          quizId: requestedQuizId,
          answers,
          studentId,
          score,
          percentageScore,
        });
        const savedQuizResult = await newQuizResult.save();

        reply.code(201).send({ quizResult: savedQuizResult });
      } catch (error: any) {
        console.error(error);
        reply.code(500).send({
          error: "Failed to save quiz result",
          details: error.message,
        });
      }
    },
  );

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const offset = request.query.offset
        ? parseInt(request.query.offset, 10)
        : 0;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 10;

      try {
        const currentDate = new Date();

        // Fetch published quizzes with due dates less than the current date
        const publishedQuizzes = await PublishedQuiz.find({
          dueDate: { $lt: currentDate },
        }).select("_id");

        // Extract IDs of the published quizzes
        const publishedQuizIds = publishedQuizzes.map((pq: any) => pq._id);

        // Construct the filter to find quiz results based on student and published quiz IDs
        const filter = {
          studentId: request.user._id,
          publishedQuizId: { $in: publishedQuizIds },
        };

        // Fetch quiz results based on the constructed filter
        const quizResults = await QuizResult.find(filter)
          .populate("publishedQuizId")
          .populate("quizId")
          .populate("studentId")
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit);

        // Count total quiz results
        const totalCount = await QuizResult.countDocuments(filter);

        // Send the response
        reply.send({ quizzes: quizResults, totalCount, offset, limit });
      } catch (error) {
        console.error("Error fetching published quizzes:", error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  );
};

export default quizResultRoutes;
