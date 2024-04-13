import { FastifyPluginAsync } from "fastify";
import { User } from "../../models/User";
import bcrypt from "bcrypt";

const userRoutes: FastifyPluginAsync = async (fastify, _opts) => {
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.get(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const clientId = request.user.client;
        const offset = parseInt(request.query.offset || "0", 10);
        const limit = parseInt(request.query.limit || "10", 10);

        const users = await User.find(
          { client: clientId, role: { $ne: "admin" } },
          "-password",
        )
          .skip(offset)
          .limit(limit)
          .lean();

        const totalCount = await User.countDocuments({
          client: clientId,
          role: { $ne: "admin" },
        });

        reply.send({ users, totalCount, offset, limit });
      } catch (error) {
        handleError(reply, 500, "Internal Server Error");
      }
    },
  );

  fastify.post(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { firstname, lastname, username, email, password, role, client } =
          request.body;
        const newUser = new User({
          firstname,
          lastname,
          username,
          email,
          password,
          role,
          client: request.user.client,
        });
        await newUser.save();
        reply.code(201).send({ user: newUser });
      } catch (error) {
        console.log(error);
        handleError(reply, 400, "Failed to create user");
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = await User.findOne(
          { _id: request.params.id, client: request.user.client },
          "-password",
        );
        if (!user) {
          return reply
            .code(404)
            .send({ message: "User not found or not part of your client" });
        }
        reply.send({ user });
      } catch (error) {
        handleError(reply, 500, "Internal Server Error");
      }
    },
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { password, ...updateData } = request.body;
        if (password) {
          updateData.password = await bcrypt.hash(password, 10);
        }
        const updatedUser = await User.findOneAndUpdate(
          { _id: request.params.id, client: request.user.client },
          updateData,
          { new: true, omitUndefined: true },
        ).select("-password");
        if (!updatedUser) {
          return reply
            .code(404)
            .send({ message: "User not found or not part of your client" });
        }
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
        const result = await User.deleteOne({
          _id: request.params.id,
          client: request.user.client,
        });
        if (result.deletedCount === 0) {
          return reply
            .code(404)
            .send({ message: "User not found or not part of your client" });
        }
        reply.code(204).send();
      } catch (error) {
        handleError(reply, 500, "Failed to delete user");
      }
    },
  );
};

export default userRoutes;
