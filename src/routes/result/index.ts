// Src/routes/results/index.ts

import { type FastifyPluginAsync } from "fastify";
import { QuizResults } from "../../models/QuizResult";

const resultsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get(
    "/:quizId/results",
    /* { preValidation: [fastify.authenticate] }, */
    async (request: any, reply) => {
      try {
        const { quizId } = request.params;
        const userId = request.user.id;

        // Fetch results from the database
        // Ensure you check if the user is allowed to view these results
        const results = await QuizResults.findOne({
          quiz: quizId,
          student: userId,
        });

        if (!results) {
          return await reply.code(404).send({ message: "Results not found" });
        }

        reply.send({ status: "success", data: results });
      } catch (error) {
        reply
          .code(500)
          .send({ status: "error", message: "Failed to fetch quiz results" });
      }
    },
  );
};

export default resultsRoutes;
