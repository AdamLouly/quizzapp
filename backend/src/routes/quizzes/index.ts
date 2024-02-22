// src/routes/quiz/index.ts

import { FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";

const quizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;
    const quizzes = await Quiz.find().skip(offset).limit(limit);
    const totalCount = await Quiz.countDocuments();

    reply.send({ quizzes, totalCount, offset, limit });
  });
};

export default quizRoutes;
