import { type FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";
import { User } from "../../models/User";
import axios from "axios";

type QuizCreationBody = {
  name: string;
  teacherEmail: any;
};

// Example Question interface (adjust according to your needs)
type Question = {
  question: string;
  answers: string[];
  correct_answer: string;
};

const quizRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", async (request, reply) => {
    const offset = request.query.offset
      ? parseInt(request.query.offset, 10)
      : 0;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;
    const quizzes = await Quiz.find().skip(offset).limit(limit);
    const totalCount = await Quiz.countDocuments();

    reply.send({ quizzes, totalCount, offset, limit });
  });

  fastify.get<{
    Querystring: { offset?: string; limit?: string; email?: string };
  }>("/teacher", async (request, reply) => {
    const { offset = "0", limit = "10", email } = request.query;
    const offsetNum = parseInt(offset, 10);
    const limitNum = parseInt(limit, 10);

    if (!email) {
      reply.code(400).send({ error: "Email is required" });
      return;
    }

    const teacher = await User.findOne({ email }).exec();
    if (!teacher) {
      reply.code(404).send({ error: "Teacher not found" });
      return;
    }

    const filter = { createdBy: teacher._id };
    const quizzes = await Quiz.find(filter)
      .sort({ createdAt: -1 })
      .skip(offsetNum)
      .limit(limitNum);
    const totalCount = await Quiz.countDocuments(filter);

    reply.send({ quizzes, totalCount, offset: offsetNum, limit: limitNum });
  });

  /* fastify.post<{
    Body: QuizCreationBody;
  }>("/", async (request, reply) => {
    const { name, teacherEmail } = request.body;

    const teacher = await User.findOne({ email: teacherEmail }).exec();
    if (!teacher) {
      reply.code(404).send({ error: "Teacher not found" });
      return;
    }

    try {
      // Send the lecture content to the quiz generation endpoint
      const quizQuestionsResponse = await axios.post(
        "https://api.quizgenerator.com/generate",
        {
          content: name,
        },
      );

      // Process the API response to include the correct answer index
      const processedQuestions = quizQuestionsResponse.data.mcq.questions.map(
        (question: any) => {
          const correctAnswerIndex = question.options.indexOf(question.answer);
          return {
            question: question.question,
            options: question.options,
            correctAnswer: correctAnswerIndex, // Set the correct answer as the index
          };
        },
      );

      const quizData = {
        name: name,
        createdBy: teacher._id,
        questions: processedQuestions, // Use the processed questions with correctAnswer as index
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
  }); */
  fastify.post<{
    Body: QuizCreationBody;
  }>("/", async (request, reply) => {
    const { name, teacherEmail } = request.body;

    const teacher = await User.findOne({ email: teacherEmail }).exec();
    if (!teacher) {
      reply.code(404).send({ error: "Teacher not found" });
      return;
    }

    try {
      const sampleQuestions = [
        {
          question:
            "What is the main inspiration behind the design of neural networks?",
          answers: [
            "Digital networks",
            "Quantum networks",
            "Biological neural networks",
            "Social networks",
          ],
          correct_answer: 2,
        },
      ];

      const quizData = {
        name: name,
        createdBy: teacher._id,
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
  });

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
};

export default quizRoutes;
