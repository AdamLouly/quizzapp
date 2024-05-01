import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { Class } from "../../models/Class";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Quiz } from "../../models/Quiz";

const quizReportsRoutes: FastifyPluginAsync = async (fastify, _) => {
  const handleError = (reply, error) => {
    console.error(error);
    reply
      .status(500)
      .send({ error: "Internal Server Error", details: error.message });
  };

  fastify.get<{
    Querystring: {
      classId: string;
    };
  }>(
    "/quizzes",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { classId } = request.query;

        if (!classId) {
          reply.status(400).send({ error: "classId must be provided" });
          return;
        }

        // Fetch the PublishedQuiz objects linked to the given classId to get quizIds
        const publishedQuizzes = await PublishedQuiz.find({ classId })
          .select("quizId")
          .lean();

        // Extract quizIds from publishedQuizzes
        const quizIds = publishedQuizzes.map((pq) => pq.quizId);

        // Fetch quizzes directly using the extracted quizIds
        const quizzes = await Quiz.find({ _id: { $in: quizIds } })
          .populate("createdBy")
          .lean();

        reply.send({ quizzes });
      } catch (error) {
        handleError(reply, error);
      }
    },
  );

  fastify.get<{
    Querystring: {
      offset?: string;
      limit?: string;
      quizId?: string;
      classId?: string;
      client?: string;
    };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { offset = "0", limit = "10", classId, quizId } = request.query;

      // Find the PublishedQuiz entries that match the given quizId
      const publishedQuizIds = quizId
        ? await PublishedQuiz.find({ quizId: quizId }, "_id").lean()
        : [];
      const publishedQuizIdArray = publishedQuizIds.map((pq) => pq._id);

      // Construct a query for QuizResult using the retrieved publishedQuizIds
      const quizResultQuery: any = {
        publishedQuizId: { $in: publishedQuizIdArray },
      };

      // Retrieve quiz results with conditions applied
      const quizResults = await QuizResult.find(quizResultQuery)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate("publishedQuizId")
        .populate("studentId")
        .lean();

      // Get unique student IDs who participated in the quiz
      const studentIds = [
        ...new Set(quizResults.map((qr) => qr.studentId.toString())),
      ];

      // Calculate the total number of students in the class
      const totalStudents = classId
        ? await Class.countDocuments({ _id: classId })
        : 0;

      // Calculate participation percentage
      const participationPercentage =
        totalStudents > 0
          ? ((studentIds.length / totalStudents) * 100).toFixed(2)
          : "0.00";

      reply.send({
        quizResults,
        participationPercentage,
        totalCount: quizResults.length,
        offset,
        limit,
      });
    } catch (error) {
      handleError(reply, error);
    }
  });
};

export default quizReportsRoutes;
