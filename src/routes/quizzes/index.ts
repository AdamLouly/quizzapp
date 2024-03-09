import { type FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";
import axios from "axios";

type QuizCreationBody = {
  title: string;
  content: any;
};

const quizRoutes: FastifyPluginAsync = async (fastify, opts) => {
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

      if (request?.user?.role === "teacher") {
        filter.createdBy = request?.user._id;
      }

      quizzes = await Quiz.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);
      const totalCount = await Quiz.countDocuments(filter);
      reply.send({ quizzes, totalCount, offset, limit });
    },
  );

  fastify.post<{ Body: QuizCreationBody }>(
    "/",
    {
      onRequest: [fastify.authenticate],
    },
    async (request: any, reply) => {
      const { title, content } = request.body;

      try {
        const externalApiResponse = await axios.post(
          process.env.QUIZ_GENERATION_API_URL + "/generate_mcq",
          {
            text: content,
          },
          {
            headers: {
              "X-Secret-Key": process.env.QUIZ_GENERATION_API_SECRET_KEY,
            },
          },
        );

        const quizDataFromExternalAPI = externalApiResponse.data.mcq;
        const questionsFromExternalAPI = quizDataFromExternalAPI.questions;

        if (!questionsFromExternalAPI)
          return reply.code(400).send({ error: "Failed to create quiz" });
        const sampleQuestions = questionsFromExternalAPI.map(
          (question: any) => ({
            question: question.question,
            answers: question.options,
            correct_answer: question.options.indexOf(question.answer),
          }),
        );

        const quizData = {
          title,
          content,
          createdBy: request?.user?._id,
          questions: sampleQuestions,
        };

        const newQuiz = new Quiz(quizData);
        const savedQuiz = await newQuiz.save();

        reply.code(201).send({ quiz: savedQuiz });
      } catch (error: any) {
        console.error(error);
        reply
          .code(500)
          .send({ error: "Failed to create quiz", details: error.message });
      }
    },
  );

  fastify.get<{
    Body: any;
    Reply: any;
  }>("/:id", async (request: any, reply) => {
    const quiz = await Quiz.findById(request.params.id);
    reply.send({ quiz });
  });

  fastify.put<{ Body: any; Reply: any }>(
    "/:id",
    async (request: any, reply: any) => {
      const quiz = await Quiz.findByIdAndUpdate(
        request.params.id,
        request.body,
      );
      reply.send({ quiz });
    },
  );

  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const result = await Quiz.findByIdAndDelete(request.params.id);
      if (!result) {
        return await reply.code(404).send({ message: "Quiz not found" });
      }

      reply.code(204).send();
    } catch (error) {
      reply.code(500).send(error);
    }
  });
};

export default quizRoutes;
