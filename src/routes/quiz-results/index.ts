import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Class } from "../../models/Class";

const quizResultRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Common error handler
  const handleError = (reply, error) => {
    console.error(error);
    reply
      .status(500)
      .send({ error: "Internal Server Error", details: error.message });
  };

  fastify.post<{ Body: typeof QuizResultRequest }>(
    "/",
    {
      preValidation: [fastify.authenticate],
      schema: {
        body: QuizResultRequest,
      },
    },
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

        let score = answers.reduce((acc, selectedAnswer, index) => {
          const correctAnswerIndex =
            publishedQuiz.quizId.questions[index].correct_answer;
          return (
            acc + (selectedAnswer === correctAnswerIndex.toString() ? 1 : 0)
          );
        }, 0);

        const totalQuestions = publishedQuiz.quizId.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        const studentId = request.user._id;
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
      } catch (error) {
        handleError(reply, error);
      }
    },
  );

  fastify.get<{
    Querystring: {
      offset?: string;
      limit?: string;
      studentIds?: string;
      classIds?: string;
    };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      // Fetch classes in which the user is enrolled
      const userClasses = await Class.find({ students: request.user._id });

      // Use class IDs to filter published quizzes
      const publishedQuizzes = await PublishedQuiz.find({
        classId: { $in: userClasses.map((c) => c._id) }, // Filter by user's classes
      })
        .populate("quizId")
        .sort({ dueDate: -1 })
        .lean();

      // Create a map of published quiz IDs to due dates
      const publishedQuizMap = new Map(
        publishedQuizzes.map((pq) => [pq._id.toString(), pq.dueDate]),
      );

      const quizResults = await QuizResult.find({
        studentId: request.user._id,
        publishedQuizId: { $in: publishedQuizzes.map((pq) => pq._id) },
      })
        .populate("quizId")
        .sort({ createdAt: -1 })
        .lean();

      // Attach the due date to each quiz result
      const resultsWithDueDates = quizResults.map((qr) => ({
        ...qr,
        dueDate: publishedQuizMap.get(qr.publishedQuizId.toString()),
      }));

      reply.send({
        quizzes: resultsWithDueDates,
      });
    } catch (error) {
      console.log(error);
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const quiz = await QuizResult.findById(request.params.id)
        .populate("quizId")
        .populate({ path: "publishedQuizId", select: "dueDate _id" })
        .lean();
      if (!quiz) {
        return reply.code(404).send({ message: "Quiz result not found" });
      }
      reply.send({ quiz });
    } catch (error) {
      handleError(reply, error);
    }
  });
};

const QuizResultRequest = {
  type: "object",
  required: ["publishedQuizId", "quizId", "answers"],
  properties: {
    publishedQuizId: { type: "string" },
    quizId: { type: "string" },
    answers: { type: "array", items: { type: "string" } },
  },
  additionalProperties: false,
};

export default quizResultRoutes;
