import { FastifyPluginAsync } from "fastify";
import { Class } from "../../models/Class";

const classRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>(
    "/",
    {
      // preValidation: [fastify.authenticate] // preValidation as part of the route options
    },
    async (request, reply) => {
      const offset = request.query.offset
        ? parseInt(request.query.offset, 10)
        : 0;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 10;
      // Assuming Class is a mongoose model or similar
      const classes = await Class.find().skip(offset).limit(limit);
      const totalCount = await Class.countDocuments();

      reply.send({ classes, totalCount, offset, limit });
    },
  );
  // Create a new class
  fastify.post<{ Body: any }>("/", async (request, reply) => {
    try {
      const newClass = new Class(request.body);
      await newClass.save();
      reply.code(201).send(newClass);
    } catch (error) {
      reply.code(400).send(error);
    }
  });

  // Get a single class by ID
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const classDoc = await Class.findById(request.params.id).populate(
        "teacher students clients",
      );
      if (!classDoc) {
        return reply.code(404).send({ message: "Class not found" });
      }
      reply.send({ class: classDoc });
    } catch (error) {
      reply.code(500).send(error);
    }
  });

  // Update a class
  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    async (request: any, reply) => {
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
        reply.code(500).send(error);
      }
    },
  );

  // Delete a class
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const result = await Class.findByIdAndDelete(request.params.id);
      if (!result) {
        return reply.code(404).send({ message: "Class not found" });
      }
      reply.code(204).send();
    } catch (error) {
      reply.code(500).send(error);
    }
  });
};

export default classRoutes;
