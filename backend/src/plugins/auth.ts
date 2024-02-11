// src/plugins/auth.ts

import fp from "fastify-plugin";

export default fp(async function (fastify) {
  fastify.register(require("@fastify/jwt"), {
    secret: process.env.JWT_SECRET || "supersecret",
  });

  fastify.decorate(
    "authenticate",
    async (request: any, reply: any): Promise<any> => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  );

  fastify.decorate(
    "authorize",
    (roles: string[]) =>
      async (request: any, reply: any): Promise<any> => {
        if (!roles.includes(request.user.role)) {
          reply.code(403).send({ message: "Forbidden" });
        }
      },
  );
});
