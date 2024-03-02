import type { FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";
import bcrypt from "bcrypt";

const user: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    const users = await User.find({ role: { $ne: "admin" } })
      .skip(offset)
      .limit(limit);

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
    const { id } = request.params;
    const user = await request.body;

    // Fetch the existing user
    const existingUser = await User.findById(id).exec();
    if (!existingUser) {
      return reply.status(404).send({ message: "User not found" });
    }

    // Check if the new password is different from the old one
    if (user.password !== existingUser.password) {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(id, user, {
      new: true,
    }).exec();
    if (!updatedUser) {
      return reply.status(500).send({ message: "Failed to update user" });
    }

    reply.send({ user: updatedUser });
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
