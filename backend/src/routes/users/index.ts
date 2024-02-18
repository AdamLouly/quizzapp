import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { User } from "../../models/User";

const user: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    // Query to find users where role is not 'admin'
    const users = await User.find({ role: { $ne: "admin" } })
      .skip(offset)
      .limit(limit);

    // Send the response
    reply.send({ users, offset, limit });
  });

  fastify.get<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    const user = await User.findById(request.params.id);
    reply.send({ user });
  });

  fastify.post<{
    Body: any;
    Reply: any;
  }>("/", async (request, reply) => {
    const user = new User(request.body);
    await user.save();
    reply.code(201).send({ user });
  });

  fastify.put<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    const user = await request.body;
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(request.body.password, salt);
    await User.findByIdAndUpdate(request.params.id, user, { new: true }).exec();
    reply.send({ user });
  });

  fastify.delete<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    await User.findByIdAndDelete(request.params.id).exec();
    reply.send({ message: "User deleted" });
  });
};

export default user;
