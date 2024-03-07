import { type FastifyPluginAsync } from "fastify";
import { PublishedQuiz } from "../../models/PublishedQuiz";

type PublishedQuizRequest = {
  body: {
    type: "object";
    required: ["quizId", "classId", "dueDate"];
    properties: {
      quizId: { type: "string" };
      classId: { type: "string" };
      dueDate: { type: "string"; format: "date" };
      timeLimit: { type: "number" };
    };
    additionalProperties: false;
  };
};

const publishedQuizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post<{ Body: PublishedQuizRequest }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      try {
        const newQuiz = new PublishedQuiz(request.body);
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
};

export default publishedQuizRoutes;
