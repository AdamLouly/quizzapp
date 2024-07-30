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

  const validatePagination = (offsetStr, limitStr) => {
    const offset = parseInt(offsetStr || "0", 10);
    const limit = parseInt(limitStr || "10", 10);
    if (
      isNaN(offset) ||
      isNaN(limit) ||
      offset < 0 ||
      limit <= 0 ||
      limit > 100
    ) {
      throw new Error("Invalid pagination parameters");
    }
    return { offset, limit };
  };

  fastify.get<{ Querystring: { offset?: string; limit?: string; classId } }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { offset, limit } = validatePagination(
          request.query.offset,
          request.query.limit,
        );
        const { role, _id: userId, client } = request.user;
        const filter: any =
          role === "teacher" ? { createdBy: userId, client } : { client };

        const [quizzes, totalCount] = await Promise.all([
          Quiz.find(filter)
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean(),
          Quiz.countDocuments(filter),
        ]);

        reply.send({ quizzes, totalCount, offset, limit });
      } catch (error) {
        handleError(reply, 500, error.message);
      }
    },
  );

  fastify.post<{ Body: QuizCreationBody }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      const { title, content } = request.body;
      try {
        // Check for an existing quiz with the same title, createdBy, and client
        const existingQuiz = await Quiz.findOne({
          title,
          createdBy: request.user._id,
          client: request.user.client,
        });

        if (existingQuiz) {
          return reply
            .code(409)
            .send({ error: "Quiz with this title already exists" });
        }
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
          createdBy: request.user._id,
          client: request.user.client,
          questions: sampleQuestions,
        });

        const savedQuiz = await newQuiz.save();
        reply.code(201).send({ quiz: savedQuiz });
      } catch (error) {
        handleError(reply, 500, `Failed to create quiz: ${error.message}`);
      }
    },
  );

  const findQuiz = async (id, clientId) => {
    return Quiz.findOne({ _id: id, client: clientId });
  };

  fastify.get<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const quiz = await findQuiz(request.params.id, request.user.client);
        if (!quiz) {
          return reply.code(404).send({ message: "Quiz not found" });
        }
        reply.send({ quiz });
      } catch (error) {
        handleError(reply, 500, `Error fetching quiz: ${error.message}`);
      }
    },
  );

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const update = { ...request.body, client: request.user.client };
        const quiz = await Quiz.findOneAndUpdate(
          { _id: request.params.id, client: request.user.client },
          update,
          { new: true },
        );

        if (!quiz) {
          return reply
            .code(404)
            .send({ message: "Quiz not found or not authorized" });
        }
        reply.send({ quiz });
      } catch (error) {
        handleError(reply, 500, `Error updating quiz: ${error.message}`);
      }
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const result = await Quiz.findOneAndDelete({
          _id: request.params.id,
          client: request.user.client,
        });

        if (!result) {
          return reply
            .code(404)
            .send({ message: "Quiz not found or not authorized" });
        }

        reply.code(204).send();
      } catch (error) {
        handleError(reply, 500, `Error deleting quiz: ${error.message}`);
      }
    },
  );
};

export default quizRoutes;