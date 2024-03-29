import type { FastifyPluginAsync } from "fastify";
import { Client } from "../../models/Client"; // Use Client model

const client: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>(
    "/",
    {
      preValidation: [fastify.authenticate],
    },
    async (request, reply) => {
      const offset = request.query.offset
        ? parseInt(request.query.offset, 10)
        : 0;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 10;

      // Find all clients
      const clients = await Client.find().skip(offset).limit(limit);

      // Send the response with clients
      reply.send({ clients, offset, limit });
    },
  );

  fastify.get<{
    Body: any;
    Reply: any;
  }>(
    "/:id",
    {
      preValidation: [fastify.authenticate],
    },
    async (request: any, reply) => {
      // Fetching a client by ID
      const client = await Client.findById(request.params.id);
      reply.send({ client });
    },
  );

  fastify.post<{
    Body: any;
    Reply: any;
  }>("/", async (request, reply) => {
    // Creating a new client
    const newClient = new Client(request.body);
    await newClient.save();
    reply.code(201).send({ client: newClient });
  });

  fastify.put<{
    Body: any;
    Reply: any;
  }>(
    "/:id",
    {
      preValidation: [fastify.authenticate],
    },
    async (request: any, reply) => {
      // Updating a client's information
      const update = request.body;
      const updatedClient = await Client.findByIdAndUpdate(
        request.params.id,
        update,
        { new: true },
      ).exec();
      reply.send({ client: updatedClient });
    },
  );

  fastify.delete<{
    Body: any;
    Reply: any;
  }>(
    "/:id",
    {
      preValidation: [fastify.authenticate],
    },
    async (request: any, reply) => {
      // Deleting a client by ID
      await Client.findByIdAndDelete(request.params.id).exec();
      reply.send({ message: "Client deleted" });
    },
  );
};

export default client; // Export the client plugin
