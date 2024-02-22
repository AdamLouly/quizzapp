// src/routes/students/index.ts

import { FastifyPluginAsync } from "fastify";
import {User} from "../../models/User";





const studentRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Get available quizzes for the students
  fastify.get("/quizzes", async (request, reply) => {
    // ...implementation
  });

  // Submit answers for a quiz
  fastify.post("/quizzes/:quizId/submit", async (request, reply) => {
    // ...implementation
  });

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
        ? parseInt(request.query.offset, 10)
        : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    // Query to find users where role is not 'admin'
    const students = await User.find({ role: "student" }).skip(offset)
        .limit(limit);

    // Send the response
    reply.send({ students, offset, limit });
  });
};

export default studentRoutes;
