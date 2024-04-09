import type { FastifyPluginAsync } from "fastify";
import { join } from "path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";

export type AppOptions = {} & Partial<AutoloadPluginOptions>;

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  // Load plugins and routes using fastify-autoload
  fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });
};

export default app;
