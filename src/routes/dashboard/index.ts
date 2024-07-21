import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";
import { Quiz } from "../../models/Quiz";
import { QuizResult } from "../../models/QuizResult";
import { User } from "../../models/User";
import mongoose from "mongoose";

const dashboardRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  // Admin dashboard route
  fastify.get(
    "/admin",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const clientId = request.user.client; // Assuming the client's ID is stored in the user object

        // Count the number of students
        const totalStudents = await User.countDocuments({
          client: clientId,
          role: "student",
        });

        // Count the total number of quizzes
        const totalQuizzes = await Quiz.countDocuments({ client: clientId });

        // Count the number of classes
        const totalClasses = await Class.countDocuments({ client: clientId });

        // Count the number of teachers
        const totalTeachers = await User.countDocuments({
          client: clientId,
          role: "teacher",
        });

        // Daily quiz submissions
        const dailySubmissions = await QuizResult.aggregate([
          {
            $lookup: {
              from: "quizzes",
              localField: "quizId",
              foreignField: "_id",
              as: "quiz",
            },
          },
          { $unwind: "$quiz" },
          { $match: { "quiz.client": new mongoose.Types.ObjectId(clientId) } },
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

        // Monthly registrations
        const monthlyRegistrations = await User.aggregate([
          { $match: { client: new mongoose.Types.ObjectId(clientId) } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        reply.send({
          totalStudents,
          totalClasses,
          totalTeachers,
          totalQuizzes,
          dailySubmissions,
          monthlyRegistrations,
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
        const clientId = request.user.client;

        const teacherClasses = await Class.find({
          teacher: teacherId,
          client: clientId,
        }).select("_id students");
        const teacherClassIds = teacherClasses.map((cls) => cls._id);

        const totalStudents = teacherClasses.reduce(
          (acc, cls) => acc + cls.students.length,
          0,
        );
        const quizzesCreatedByTeacher = await Quiz.countDocuments({
          createdBy: teacherId,
          client: clientId,
        });

        // Corrected totalQuizAttempts calculation
        const quizzesCreatedByTeacherIds = await Quiz.find({
          createdBy: teacherId,
          client: clientId,
        }).select("_id");
        const quizIds = quizzesCreatedByTeacherIds.map((quiz) => quiz._id);
        const totalQuizAttempts = await QuizResult.countDocuments({
          quizId: { $in: quizIds },
        });

        const quizzesCompletedByStudents = await QuizResult.countDocuments({
          quizId: { $in: quizIds },
          score: { $gte: 0 },
        });

        // Corrected dailySubmissions aggregation
        const dailySubmissions = await QuizResult.aggregate([
          {
            $match: {
              quizId: { $in: quizIds },
            },
          },
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

        reply.send({
          quizzesCreatedByTeacher,
          totalQuizAttempts,
          totalStudents,
          quizzesCompletedByStudents,
          dailySubmissions,
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
