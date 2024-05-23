import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";
import { Client } from "../../models/Client";
import { Quiz } from "../../models/Quiz";
import { QuizResult } from "../../models/QuizResult";
import { User } from "../../models/User";

const dashboardRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  // Admin dashboard route
  fastify.get(
    "/admin",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const totalUsers = await User.countDocuments({});
        const userBreakdown = await User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        const userRegistrations = await User.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        const totalQuizzes = await Quiz.countDocuments({});
        const quizzesByTeacher = await Quiz.aggregate([
          { $group: { _id: "$createdBy", count: { $sum: 1 } } },
        ]);

        const totalClasses = await Class.countDocuments({});
        const classesByTeacher = await Class.aggregate([
          { $group: { _id: "$teacher", count: { $sum: 1 } } },
        ]);

        const clientData = await Client.countDocuments({});

        const totalQuizAttempts = await QuizResult.countDocuments({});
        const averageQuizScoresData = await QuizResult.aggregate([
          {
            $group: {
              _id: null,
              averageScore: {
                $avg: { $multiply: [{ $divide: ["$score", 10] }, 100] },
              },
            },
          },
        ]);
        const averageQuizScores =
          averageQuizScoresData.length > 0
            ? averageQuizScoresData[0].averageScore
            : 0;

        reply.send({
          totalUsers,
          userBreakdown,
          userRegistrations,
          totalQuizzes,
          quizzesByTeacher,
          totalClasses,
          classesByTeacher,
          clientData,
          totalQuizAttempts,
          averageQuizScores,
        });
      } catch (error) {
        reply
          .status(500)
          .send({ error: "Failed to fetch admin dashboard statistics" });
      }
    },
  );

  // Teacher dashboard route
  fastify.get(
    "/teacher",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const teacherId = request.user._id;
        const teacherClasses = await Class.find({ teacher: teacherId }).select(
          "_id students",
        );

        const teacherClassIds = teacherClasses.map((cls) => cls._id);
        const totalStudents = teacherClasses.reduce(
          (acc, cls) => acc + cls.students.length,
          0,
        );

        const quizzesCreatedByTeacher = await Quiz.countDocuments({
          createdBy: teacherId,
        });
        const teacherQuizzes = await Quiz.find({ createdBy: teacherId });

        const totalQuizAttempts = await QuizResult.countDocuments({
          quizId: { $in: teacherClassIds },
        });

        const quizzesCompletedByStudents = await QuizResult.countDocuments({
          quizId: { $in: teacherClassIds },
          score: { $gte: 0 }, // Assuming a score >= 0 means the quiz was completed
        });

        const studentPerformance = await QuizResult.aggregate([
          { $match: { quizId: { $in: teacherClassIds } } },
          {
            $group: {
              _id: "$studentId",
              averageScore: {
                $avg: { $multiply: [{ $divide: ["$score", 10] }, 100] },
              },
              totalQuizzes: { $sum: 1 },
            },
          },
        ]);

        reply.send({
          quizzesCreatedByTeacher,
          teacherQuizzes,
          totalQuizAttempts,
          totalStudents,
          quizzesCompletedByStudents,
          studentPerformance,
        });
      } catch (error) {
        console.log(error);
        reply
          .status(500)
          .send({ error: "Failed to fetch teacher dashboard statistics" });
      }
    },
  );
};

export default dashboardRoutes;
