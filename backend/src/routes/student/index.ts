// src/routes/student/index.ts

import { FastifyPluginAsync } from "fastify";

const studentRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Get available quizzes for the student
  fastify.get("/quizzes", async (request, reply) => {
    // ...implementation
  });

  // Submit answers for a quiz
  fastify.post("/quizzes/:quizId/submit", async (request, reply) => {
    // ...implementation
  });
};

export default studentRoutes;
