import { FastifyPluginAsync } from "fastify";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Class } from "../../models/Class";
import { QuizResult } from "../../models/QuizResult";

type PublishedQuizRequest = {
  body: {
    type: "object";
    required: ["quizId", "classId", "dueDate"];
    properties: {
      quizId: { type: "string" };
      classId: { type: "string" };
      createdId: { type: "string" };
      dueDate: { type: "string"; format: "date" };
    };
    additionalProperties: false;
  };
};

const handleError = (reply, statusCode, message) => {
  console.error(message);
  reply.status(statusCode).send({ error: message });
};

const publishedQuizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { offset = "0", limit = "10" } = request.query;
      const currentDate = new Date();

      let query = {};
      let totalCount = 0;
      const { role, _id: userId } = request.user;

      if (role === "student") {
        const userClass = await Class.findOne({ students: userId }).lean();
        if (!userClass) {
          return reply.send({ quizzes: [], totalCount: 0, offset, limit });
        }

        const quizResults = await QuizResult.find({
          studentId: userId,
        }).distinct("publishedQuizId");
        query = {
          classId: userClass._id,
          dueDate: { $gte: currentDate },
          _id: { $nin: quizResults },
        };
      } else if (role === "teacher") {
        const userClass = await Class.findOne({ teacher: userId }).lean();
        if (!userClass) {
          return reply.send({ quizzes: [], totalCount: 0, offset, limit });
        }
        query = {
          classId: userClass._id,
          dueDate: { $gte: currentDate },
        };
      }

      totalCount = await PublishedQuiz.countDocuments(query);
      const publishedQuizzes = await PublishedQuiz.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate("quizId")
        .populate("classId")
        .lean();

      reply.send({ quizzes: publishedQuizzes, totalCount, offset, limit });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.post<{ Body: PublishedQuizRequest }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const createdBy = request.user?._id;
        const newQuiz = new PublishedQuiz({ ...request.body, createdBy });
        const publishedQuiz = await newQuiz.save();
        reply.code(201).send({ quiz: publishedQuiz });
      } catch (error) {
        handleError(reply, 500, "Failed to publish quiz: " + error.message);
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const quiz = await PublishedQuiz.findById(request.params.id).populate(
          "quizId",
        );
        if (!quiz) {
          return reply.code(404).send({ message: "Quiz not found" });
        }
        reply.send({ quiz });
      } catch (error) {
        handleError(
          reply,
          500,
          "Error fetching published quiz: " + error.message,
        );
      }
    },
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const quiz = await PublishedQuiz.findByIdAndUpdate(
          request.params.id,
          request.body,
          { new: true },
        );
        reply.send({ quiz });
      } catch (error) {
        handleError(
          reply,
          500,
          "Error updating published quiz: " + error.message,
        );
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await PublishedQuiz.findByIdAndDelete(request.params.id);
        if (!result) {
          return reply.code(404).send({ message: "Quiz not found" });
        }
        reply.code(204).send();
      } catch (error) {
        handleError(
          reply,
          500,
          "Error deleting published quiz: " + error.message,
        );
      }
    },
  );
};

export default publishedQuizRoutes;
