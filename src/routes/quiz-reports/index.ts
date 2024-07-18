import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { Class } from "../../models/Class";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Quiz } from "../../models/Quiz";
import { User } from "../../models/User";

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

      // Find the PublishedQuiz entries that match the given quizId and classId
      const publishedQuizIds = quizId
        ? await PublishedQuiz.find(
            { quizId: quizId, classId: classId },
            "_id dueDate",
          ).lean()
        : [];
      const publishedQuizIdArray = publishedQuizIds.map((pq) => pq._id);
      const publishedQuizMap = new Map(
        publishedQuizIds.map((pq) => [pq._id.toString(), pq.dueDate]),
      );

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

      // Add the 'passed' field to quizResults
      const updatedQuizResults = quizResults.map((qr) => ({
        ...qr,
        passed: true,
        dueDate: qr.publishedQuizId.dueDate,
      }));

      // Get unique student IDs who participated in the quiz
      const studentIds = [
        ...new Set(quizResults.map((qr) => qr.studentId._id.toString())),
      ];

      // Retrieve the class to get the total number of students
      const classInfo = await Class.findById(classId).lean();
      const totalStudents = classInfo ? classInfo.students.length : 0;

      // Calculate participation percentage
      const participationPercentage =
        totalStudents > 0
          ? ((studentIds.length / totalStudents) * 100).toFixed(2)
          : "0.00";

      // Identify students who didn't pass the quiz
      const studentsWhoDidNotPass = classInfo.students.filter(
        (studentId) => !studentIds.includes(studentId.toString()),
      );

      // Fetch usernames for students who didn't pass
      const studentInfos = await User.find(
        { _id: { $in: studentsWhoDidNotPass } },
        "_id username",
      ).lean();
      const studentInfoMap = new Map(
        studentInfos.map((info) => [info._id.toString(), info.username]),
      );

      // Create dummy quiz results for students who didn't pass
      const dummyResults = studentsWhoDidNotPass.map((studentId) => ({
        studentId: {
          _id: studentId,
          username: studentInfoMap.get(studentId.toString()) || "unknown", // Fetch the username if available
        },
        publishedQuizId: {
          _id: publishedQuizIdArray[0],
          quizId: quizId,
          classId: classId,
          dueDate:
            publishedQuizMap.get(publishedQuizIdArray[0].toString()) ||
            new Date()
        },
        quizId: quizId,
        passed: false,
        score: 0
      }));

      // Merge dummy results with actual quiz results
      const allQuizResults = [...updatedQuizResults, ...dummyResults];

      reply.send({
        quizResults: allQuizResults,
        participationPercentage,
        totalCount: allQuizResults.length,
        offset,
        limit,
      });
    } catch (error) {
      console.log(error);
      handleError(reply, "Internal Server Error");
    }
  });
};

export default quizReportsRoutes;
