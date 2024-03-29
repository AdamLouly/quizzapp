import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";

const classRoutes: FastifyPluginAsync = async (fastify, _opts) => {
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
      const classes = await Class.find({}, null, { skip: offset, limit }).lean();
      const totalCount = await Class.countDocuments();
      reply.send({ classes, totalCount, offset, limit });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.post<{ Body: any }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const newClass = new Class(request.body);
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
        const classDoc = await Class.findById(request.params.id)
          .populate("teacher", "_id username") // Only populate necessary fields
          .populate("students", "_id username").lean(); // Only populate necessary fields
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
        const updatedClass = await Class.findByIdAndUpdate(
          request.params.id,
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
        const result = await Class.findByIdAndDelete(request.params.id);
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
