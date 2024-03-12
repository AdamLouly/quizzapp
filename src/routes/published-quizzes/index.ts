import { type FastifyPluginAsync } from "fastify";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Class } from "../../models/Class";
import { User } from "../../models/User";

type PublishedQuizRequest = {
  body: {
    type: "object";
    required: ["quizId", "classId", "dueDate"];
    properties: {
      quizId: { type: "string" };
      classId: { type: "string" };
      createdId: { type: "string" };
      dueDate: { type: "string"; format: "date" };
    };
    additionalProperties: false;
  };
};

const publishedQuizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const offset = request.query.offset
        ? parseInt(request.query.offset, 10)
        : 0;
      const limit = request.query.limit
        ? parseInt(request.query.limit, 10)
        : 10;

      let quizzes;
      const filter: any = {};

      if (request?.user?.role === "student") {
        const user = await User.findById(request.user._id);
        const classes = await Class.find({ students: user._id });
        const classIds = classes.map((cls) => cls._id);
        filter.classId = { $in: classIds };
      } else if (request?.user?.role === "teacher") {
        filter.createdBy = request.user._id;
      }

      try {
        quizzes = await PublishedQuiz.find(filter)
          .populate("quizId")
          .populate("classId")
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit);

        const totalCount = await PublishedQuiz.countDocuments(filter);

        reply.send({ quizzes, totalCount, offset, limit });
      } catch (error) {
        console.error("Error fetching published quizzes:", error);
        reply.status(500).send({ error: "Internal Server Error" });
      }
    },
  );

  fastify.post<{ Body: PublishedQuizRequest }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      try {
        const createdBy = request?.user?._id;

        const newQuiz = new PublishedQuiz({ ...request.body, createdBy });
        const publishedQuiz = await newQuiz.save();

        reply.code(201).send({ quiz: publishedQuiz });
      } catch (error: any) {
        console.error(error);
        reply
          .code(500)
          .send({ error: "Failed to publish quiz", details: error.message });
      }
    },
  );

  fastify.get<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    const quiz = await PublishedQuiz.findById(request.params.id).populate(
      "quizId",
    );
    reply.send({ quiz });
  });

  fastify.put<{ Body: any; Reply: any }>(
    "/:id",
    async (request: any, reply: any) => {
      const quiz = await PublishedQuiz.findByIdAndUpdate(
        request.params.id,
        request.body,
      );
      reply.send({ quiz });
    },
  );

  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const result = await PublishedQuiz.findByIdAndDelete(request.params.id);
      if (!result) {
        return await reply.code(404).send({ message: "Quiz not found" });
      }

      reply.code(204).send();
    } catch (error) {
      reply.code(500).send(error);
    }
  });
};

export default publishedQuizRoutes;
