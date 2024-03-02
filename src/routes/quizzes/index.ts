import { type FastifyPluginAsync } from "fastify";
import { Quiz } from "../../models/Quiz";
import { User } from "../../models/User";

type QuizCreationBody = {
  title: string;
  description: string;
  questions: Question[]; // Define `Question` based on your quiz structure
  createdBy: string; // Assuming this is the teacher's ID
  class: any;
  due_date: any;
  duration: any;
  createdByEmail: any;
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
    const quizzes = await Quiz.find(filter).skip(offsetNum).limit(limitNum);
    const totalCount = await Quiz.countDocuments(filter);

    reply.send({ quizzes, totalCount, offset: offsetNum, limit: limitNum });
  });

  fastify.post<{
    Body: QuizCreationBody;
  }>("/create", async (request, reply) => {
    console.log(request.body); // Log to see if classId is coming through

    const {
      title,
      description,
      questions = [], // Defaults to an empty array if not provided
      createdByEmail,
      class: classId, // Map `class` from the request to `classId`
      due_date,
      duration,
    } = request.body;

    // Find the teacher by email instead of ID
    const teacher = await User.findOne({ email: createdByEmail }).exec();
    if (!teacher) {
      reply.code(404).send({ error: "Teacher not found" });
      return;
    }

    // Convert due_date from string to Date if necessary
    const dueDate = new Date(due_date);

    try {
      const quizData: any = {
        name: title, // Assuming your schema expects a `name` field instead of `title`
        description,
        questions,
        createdBy: teacher._id, // Assuming you've resolved the teacher lookup by email
        due_date: dueDate,
        duration,
      };

      if (classId) {
        quizData.classId = classId;
      }

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
};

export default quizRoutes;
