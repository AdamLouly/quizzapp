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

        // Fetch published quizzes
        const publishedQuizzes = await PublishedQuiz.find({
          dueDate: { $lt: currentDate },
        }).populate("quizId");

        // Fetch quiz results
        const filter = {
          studentId: request.user._id,
          publishedQuizId: { $in: publishedQuizzes.map((pq: any) => pq._id) },
        };
        const quizResults = await QuizResult.find(filter);

        // Populate quizId field in the quizResults array
        await QuizResult.populate(quizResults, { path: "quizId" });

        // Filter out expired published quizzes that are already present in quiz results
        const filteredPublishedQuizzes = publishedQuizzes.filter(
          (publishedQuiz) => {
            return !quizResults.some((quizResult:any) => {
              return quizResult.publishedQuizId.equals(publishedQuiz._id);
            });
          },
        );

        const totalQuizResultsCount = await QuizResult.countDocuments(filter);
        const totalPublishedQuizzesCount = filteredPublishedQuizzes.length;

        reply.send({
          quizzes: quizResults,
          publishedQuizzes: filteredPublishedQuizzes,
          totalQuizResultsCount,
          totalPublishedQuizzesCount,
          offset,
          limit,
        });
      } catch (error) {
        console.error("Error fetching published quizzes:", error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  );

  fastify.get<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    const quiz = await QuizResult.findById(request.params.id).populate(
      "quizId",
    );
    reply.send({ quiz });
  });
};

export default quizResultRoutes;
