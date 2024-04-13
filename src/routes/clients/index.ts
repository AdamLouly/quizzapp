import type { FastifyPluginAsync } from "fastify";
import { Client } from "../../models/Client"; // Use Client model

const client: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  /* fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const offset = parseInt(request.query.offset || "0", 10);
      const limit = parseInt(request.query.limit || "10", 10);

      // Find all clients with pagination
      const clients = await Client.find().skip(offset).limit(limit).lean();

      // Send the response with clients
      reply.send({ clients, offset, limit });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  }); */

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const clients = await Client.findById(request.user.client).lean();

      // Send the response with clients
      reply.send({ clients });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // Fetch a client by ID
        const client = await Client.findById(request.params.id).lean();
        if (!client) {
          return reply.code(404).send({ message: "Client not found" });
        }
        reply.send({ client });
      } catch (error) {
        handleError(reply, 500, "Internal Server Error");
      }
    },
  );

  fastify.post<{ Body: any }>("/", async (request, reply) => {
    try {
      // Creating a new client
      const newClient = new Client(request.body);
      await newClient.save();
      reply.code(201).send({ client: newClient });
    } catch (error) {
      handleError(reply, 500, "Failed to create client");
    }
  });

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // Updating a client's information
        const update = request.body;
        const updatedClient = await Client.findByIdAndUpdate(
          request.params.id,
          update,
          { new: true },
        ).exec();
        if (!updatedClient) {
          return reply.code(404).send({ message: "Client not found" });
        }
        reply.send({ client: updatedClient });
      } catch (error) {
        handleError(reply, 500, "Failed to update client");
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // Deleting a client by ID
        const deletedClient = await Client.findByIdAndDelete(
          request.params.id,
        ).exec();
        if (!deletedClient) {
          return reply.code(404).send({ message: "Client not found" });
        }
        reply.send({ message: "Client deleted" });
      } catch (error) {
        handleError(reply, 500, "Failed to delete client");
      }
    },
  );
};

export default client;
