import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";

const classRoutes: FastifyPluginAsync = async (fastify, _opts) => {
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
        let query = { client: clientId };
        if (request.user.role === "teacher") {
          query.teacher = request.user._id;
        }

        const classes = await Class.find(query)
          .populate("teacher", "username")
          .populate("students", "username")
          .populate("client", "name")
          .skip(offset)
          .limit(limit)
          .lean();

        const totalCount = await Class.countDocuments(query);

        reply.send({ classes, totalCount, offset, limit });
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
        const { user, body } = request;
        const newClassData = {
          ...body,
          client: user.client,
          createdBy: user._id,
        }; // Include client ID and creator

        const newClass = new Class(newClassData);
        await newClass.save();

        reply.code(201).send(newClass);
      } catch (error) {
        handleError(reply, 400, "Failed to create class");
      }
    },
  );

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const classDoc = await Class.findOne({
          _id: request.params.id,
          client: request.user.client,
        })
          .populate("teacher", "username")
          .populate("students", "username")
          .lean();

        if (!classDoc) {
          return reply.code(404).send({ message: "Class not found" });
        }

        reply.send({ class: classDoc });
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
        const updatedClass = await Class.findOneAndUpdate(
          { _id: request.params.id, client: request.user.client },
          request.body,
          { new: true },
        );

        if (!updatedClass) {
          return reply.code(404).send({ message: "Class not found" });
        }

        reply.send(updatedClass);
      } catch (error) {
        handleError(reply, 500, "Failed to update class");
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await Class.findOneAndDelete({
          _id: request.params.id,
          client: request.user.client,
        });

        if (!result) {
          return reply.code(404).send({ message: "Class not found" });
        }

        reply.code(204).send();
      } catch (error) {
        handleError(reply, 500, "Failed to delete class");
      }
    },
  );
};

export default classRoutes;
