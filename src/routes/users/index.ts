import { FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";
import bcrypt from "bcrypt";

const userRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  // Centralized error handling middleware
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const offset = parseInt(request.query.offset || "0", 10);
      const limit = parseInt(request.query.limit || "10", 10);

      // Fetch users with projection
      const users = await User.find({ role: { $ne: "admin" } }, "-password")
        .skip(offset)
        .limit(limit)
        .lean();

      reply.send({ users, offset, limit });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = await User.findById(request.params.id, "-password");
        if (!user) {
          return reply.code(404).send({ message: "User not found" });
        }
        reply.send({ user });
      } catch (error) {
        handleError(reply, 500, "Internal Server Error");
      }
    },
  );

  fastify.post<{ Body: any }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const newUser = new User(request.body);
        await newUser.save();
        reply.code(201).send({ user: newUser });
      } catch (error) {
        handleError(reply, 400, "Failed to create user");
      }
    },
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { password, ...update } = request.body;

        // Fetch the existing user
        const existingUser = await User.findById(id);
        if (!existingUser) {
          return reply.code(404).send({ message: "User not found" });
        }

        // Check if the password has been updated
        if (password && password !== existingUser.password) {
          // Hash the new password
          const salt = await bcrypt.genSalt(10);
          update.password = await bcrypt.hash(password, salt);
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(id, update, {
          new: true,
        });
        reply.send({ user: updatedUser });
      } catch (error) {
        handleError(reply, 500, "Failed to update user");
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await User.findByIdAndDelete(request.params.id);
        if (!result) {
          return reply.code(404).send({ message: "User not found" });
        }
        reply.send({ message: "User deleted" });
      } catch (error) {
        handleError(reply, 500, "Failed to delete user");
      }
    },
  );
};

export default userRoutes;
