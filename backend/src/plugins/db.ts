// src/plugins/mongoose.js

import fp from "fastify-plugin";
import mongoose from "mongoose";

export default fp(async (fastify, opts) => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose default connection is open");
    });

    mongoose.connection.on("error", (err:any) => {
      console.log(`Mongoose default connection has occurred \n${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose default connection is disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log(
        "Mongoose default connection is disconnected due to application termination",
      );
      process.exit(0);
    });

    await mongoose.connect(process.env.MONGO_URI);
    fastify.decorate("mongo", mongoose);
  } catch (err) {
    console.error(err);
  }
});
