import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";

const classRoutes: FastifyPluginAsync = async (fastify, opts) => {
  async function classRoutes(fastify, opts) {
    fastify.post(
      "/:classId/assign-quiz",
      { preValidation: [fastify.authenticate, fastify.authorize(["teacher"])] },
      async (request, reply) => {
        try {
          const { classId } = request.params;
          const { quizId } = request.body;

          const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { $push: { quizzes: quizId } },
            { new: true },
          );

          reply.send({ status: "success", data: updatedClass });
        } catch (error) {
          reply.code(500).send({
            status: "error",
            message: "Failed to assign quiz to class",
          });
        }
      },
    );
  }
};
