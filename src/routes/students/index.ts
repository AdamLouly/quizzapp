import { FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";

const studentRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    try {
      const students = await User.find({ role: "student" })
        .skip(offset)
        .limit(limit);
      const totalCount = await User.countDocuments({ role: "student" });
      reply.send({ students, offset, limit, totalCount });
    } catch (error) {
      console.error("Error fetching students:", error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });
};

export default studentRoutes;
