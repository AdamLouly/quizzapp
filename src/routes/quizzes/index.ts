import { FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";
import axios from "axios";

type QuizCreationBody = {
  title: string;
  content: any;
};

const quizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { offset = "0", limit = "10" } = request.query;
      const filter: any = {};
      const { role, _id: userId } = request.user;

      if (role === "teacher") {
        filter.createdBy = userId;
      }

      const quizzes = await Quiz.find(filter)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .lean();
      const totalCount = await Quiz.countDocuments(filter);
      reply.send({ quizzes, totalCount, offset, limit });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });

  fastify.post<{ Body: QuizCreationBody }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      const { title, content } = request.body;

      try {
        const externalApiResponse = await axios.post(
          `${process.env.QUIZ_GENERATION_API_URL}/generate_mcq`,
          { text: content },
          {
            headers: {
              "X-Secret-Key": process.env.QUIZ_GENERATION_API_SECRET_KEY,
            },
          },
        );

        const questionsFromExternalAPI =
          externalApiResponse?.data?.mcq?.questions;

        if (!questionsFromExternalAPI) {
          return reply.code(400).send({ error: "Failed to create quiz" });
        }

        const sampleQuestions = questionsFromExternalAPI.map(
          (question: any) => ({
            question: question.question,
            answers: question.options,
            correct_answer: question.options.indexOf(question.answer),
          }),
        );

        const newQuiz = new Quiz({
          title,
          content,
          createdBy: request.user?._id,
          questions: sampleQuestions,
        });
        const savedQuiz = await newQuiz.save();

        reply.code(201).send({ quiz: savedQuiz });
      } catch (error: any) {
        handleError(reply, 500, `Failed to create quiz: ${error.message}`);
      }
    },
  );

  const findQuizById = async (id) => {
    return await Quiz.findById(id);
  };

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const quiz = await findQuizById(request.params.id);
        if (!quiz) {
          return reply.code(404).send({ message: "Quiz not found" });
        }
        reply.send({ quiz });
      } catch (error) {
        handleError(
          reply,
          500,
          `Error fetching published quiz: ${error.message}`,
        );
      }
    },
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const quiz = await Quiz.findByIdAndUpdate(
          request.params.id,
          request.body,
          { new: true },
        );
        reply.send({ quiz });
      } catch (error) {
        handleError(
          reply,
          500,
          `Error updating published quiz: ${error.message}`,
        );
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await Quiz.findByIdAndDelete(request.params.id);
        if (!result) {
          return await reply.code(404).send({ message: "Quiz not found" });
        }

        reply.code(204).send();
      } catch (error) {
        handleError(
          reply,
          500,
          `Error deleting published quiz: ${error.message}`,
        );
      }
    },
  );
};

export default quizRoutes;
