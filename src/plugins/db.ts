import fp from "fastify-plugin";
import mongoose from "mongoose";

export default fp(
  async (fastify, opts) => {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose default connection is open");
    });

    mongoose.connection.on("error", (err: any) => {
      console.error("Mongoose default connection error:", err);
      process.exit(1); // Consider a strategy for handling fatal errors
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

    try {
      // Use existing connection if already connected.
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGO_URI || "", {
          serverSelectionTimeoutMS: 5000, // Set timeout for MongoDB connection
        });
      }
      fastify.decorate("mongo", mongoose); // Make mongoose available throughout the Fastify instance.
    } catch (err) {
      console.error("MongoDB connection error:", err);
      throw err; // Rethrow or handle as needed
    }
  },
  {
    name: "mongoose-db-connector",
  },
);
