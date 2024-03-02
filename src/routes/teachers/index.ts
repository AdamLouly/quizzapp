// Src/routes/teachers/index.ts

import { type FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";

const teacherRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    // Query to find users where role is not 'admin'
    const teachers = await User.find({ role: "teacher" })
      .skip(offset)
      .limit(limit);

    // Send the response
    reply.send({ teachers, offset, limit });
  });
};

export default teacherRoutes;
