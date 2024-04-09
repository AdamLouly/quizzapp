"use strict";

// Read the .env file.
import * as dotenv from "dotenv";
dotenv.config();

// Require the framework
import Fastify from "fastify";

// Instantiate Fastify with some config
const app = Fastify({
  logger: true,
});

// Register your application as a normal plugin.
app.register(import("../src/app"));

export default async (req, res) => {
  app.ready((err) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }

    app.log.info(
      "All routes loaded! Check your console for the route details.",
    );

    console.log(app.printRoutes());

    app.log.info(
      `Server listening on port ${Number(process.env.PORT ?? 3000)}`,
    );
  });
  app.server.emit("request", req, res);
};
