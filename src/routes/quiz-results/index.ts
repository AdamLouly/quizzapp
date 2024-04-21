import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Class } from "../../models/Class";

type QuizResultRequest = {
  body: {
    type: "object";
    required: ["publishedQuizId", "quizId", "answers"];
    properties: {
      publishedQuizId: { type: "string" };
      quizId: { type: "string" };
      answers: { type: "array"; items: { type: "string" } };
    };
    additionalProperties: false;
  };
};

const quizResultRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const handleError = (reply, statusCode, message) => {
    console.error(message);
    reply.status(statusCode).send({ error: message });
  };

  fastify.post<{ Body: QuizResultRequest }>(
    "/",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { publishedQuizId, quizId, answers } = request.body;

        const publishedQuiz =
          await PublishedQuiz.findById(publishedQuizId).populate("quizId");

        if (!publishedQuiz) {
          return reply.code(404).send({ error: "Published quiz not found" });
        }

        if (quizId !== publishedQuiz.quizId._id.toString()) {
          return reply.code(400).send({
            error: "Requested quizId does not match the published quiz",
          });
        }

        let score = 0;
        answers.forEach((selectedAnswer, index) => {
          const correctAnswerIndex =
            publishedQuiz.quizId.questions[index].correct_answer;
          if (selectedAnswer === correctAnswerIndex.toString()) {
            score++;
          }
        });

        const totalQuestions = publishedQuiz.quizId.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        const studentId = request?.user?._id;
        const newQuizResult = new QuizResult({
          publishedQuizId,
          quizId,
          answers,
          studentId,
          score,
          percentageScore,
        });
        const savedQuizResult = await newQuizResult.save();

        reply.code(201).send({ quizResult: savedQuizResult });
      } catch (error: any) {
        handleError(reply, 500, `Failed to save quiz result: ${error.message}`);
      }
    },
  );

  fastify.get<{
    Querystring: { offset?: string; limit?: string };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      // Determine the role of the user
      const isTeacher = request.user.role === "teacher";

      if (isTeacher) {
        // Fetch classes the teacher is associated with
        const teacherClasses = await Class.find({ teacher: request.user._id });
        if (teacherClasses.length === 0) {
          // No classes found for this teacher
          return reply.send({
            message: "No classes found for this teacher",
            /*  publishedQuizzes: [], */
            quizzes: [],
          });
        }

        // Use class IDs to filter published quizzes for the teacher's classes
        /* const publishedQuizzes = await PublishedQuiz.find({
          classId: { $in: teacherClasses.map((c) => c._id) },
          dueDate: { $lte: new Date() },
        })
          .populate("quizId", "title content score")
          .sort({ dueDate: -1 })
          .select("_id score createdAt publishedQuizId dueDate")
          .lean(); */

        // Get all students IDs from these classes
        const studentIds = teacherClasses.flatMap((c) => c.students);

        // Fetch quiz results for quizzes published in the teacher's classes by students in these classes
        const quizResults = await QuizResult.find({
          /* 
          publishedQuizId: { $in: publishedQuizzes.map((pq) => pq._id) }, */
          studentId: { $in: studentIds },
        })
          .populate("quizId", "title content score")
          .populate("publishedQuizId", "dueDate _id")
          .populate("studentId", "username")
          .sort({ createdAt: -1 })
          .select("_id score createdAt publishedQuizId")
          .lean();

        reply.send({
          /* publishedQuizzes, */
          quizzes: quizResults,
        });
      } else {
        // Student process: Fetch classes in which the user is enrolled
        const userClasses = await Class.find({ students: request.user._id });

        if (userClasses.length === 0) {
          // No classes found for this student
          return reply.send({
            message: "No classes found for this student",
            publishedQuizzes: [],
            quizzes: [],
          });
        }

        // Use class IDs to filter published quizzes
        /* const publishedQuizzes = await PublishedQuiz.find({
          classId: { $in: userClasses.map((c) => c._id) },
          dueDate: { $lte: new Date() },
        })
          .populate("quizId", "title content score")
          .sort({ dueDate: -1 })
          .select("_id score createdAt publishedQuizId dueDate")
          .lean(); */

        const quizResults = await QuizResult.find({
          studentId: request.user._id,
          /* publishedQuizId: { $in: publishedQuizzes.map((pq) => pq._id) }, */
        })
          .populate("quizId", "title content score")
          .populate("publishedQuizId", "dueDate _id")
          .sort({ createdAt: -1 })
          .select("_id score createdAt publishedQuizId")
          .lean();

        reply.send({
          /* publishedQuizzes, */
          quizzes: quizResults,
        });
      }
    } catch (error) {
      console.log(error);
      reply.status(500).send({ error: "Internal Server Error" });
    }
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const quiz = await QuizResult.findById(request.params.id)

        .populate("quizId")
        .populate({ path: "publishedQuizId", select: "dueDate _id" })
        .lean();
      if (!quiz) {
        return reply.code(404).send({ message: "Quiz result not found" });
      }
      reply.send({ quiz });
    } catch (error) {
      handleError(reply, 500, "Internal Server Error");
    }
  });
};

export default quizResultRoutes;
