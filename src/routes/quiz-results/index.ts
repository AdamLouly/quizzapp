import { FastifyPluginAsync } from "fastify";
import { QuizResult } from "../../models/QuizResult";
import { PublishedQuiz } from "../../models/PublishedQuiz";
import { Class } from "../../models/Class";

const quizResultRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Common error handler
  const handleError = (reply, error) => {
    console.error(error);
    reply
      .status(500)
      .send({ error: "Internal Server Error", details: error.message });
  };

  // Reusable function to fetch filtered quiz results
  async function fetchFilteredQuizResults(
    teacherClasses,
    studentIds,
    limit,
    offset,
  ) {
    const publishedQuizzes = await PublishedQuiz.find({
      classId: { $in: teacherClasses.map((c) => c._id) },
    }).select("_id");

    if (publishedQuizzes.length === 0) return null;

    const quizFilter = {
      publishedQuizId: { $in: publishedQuizzes.map((pq) => pq._id) },
    };
    if (studentIds && studentIds.length > 0) {
      quizFilter.studentId = { $in: studentIds };
    }

    const [quizResults, totalCount] = await Promise.all([
      QuizResult.find(quizFilter)
        .populate({
          path: "quizId",
          select: "title content score",
        })
        .populate({
          path: "publishedQuizId",
          populate: {
            path: "classId",
            select: "name",
          },
          select: "dueDate _id",
        })
        .populate({
          path: "studentId",
          select: "username",
        })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      QuizResult.countDocuments(quizFilter),
    ]);

    return { quizResults, totalCount };
  }

  fastify.post<{ Body: typeof QuizResultRequest }>(
    "/",
    {
      preValidation: [fastify.authenticate],
      schema: {
        body: QuizResultRequest,
      },
    },
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

        let score = answers.reduce((acc, selectedAnswer, index) => {
          const correctAnswerIndex =
            publishedQuiz.quizId.questions[index].correct_answer;
          return (
            acc + (selectedAnswer === correctAnswerIndex.toString() ? 1 : 0)
          );
        }, 0);

        const totalQuestions = publishedQuiz.quizId.questions.length;
        const percentageScore = (score / totalQuestions) * 100;

        const studentId = request.user._id;
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
      } catch (error) {
        handleError(reply, error);
      }
    },
  );

  fastify.get<{
    Querystring: {
      offset?: string;
      limit?: string;
      studentIds?: string;
      classIds?: string;
    };
  }>("/", { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const isTeacher = request.user.role === "teacher";
      const { limit, offset, studentIds, classIds } = request.query;
      const parsedLimit = parseInt(limit) || 10;
      const parsedOffset = parseInt(offset) || 0;
      const parsedStudentIds = studentIds ? studentIds.split(",") : [];
      if (isTeacher) {
        const teacherClassesQuery = { teacher: request.user._id };
        if (classIds && classIds.length > 0) {
          teacherClassesQuery._id = { $in: classIds };
        }
        const teacherClasses = await Class.find(teacherClassesQuery);
        if (teacherClasses.length === 0) {
          return reply.send({
            message: "No classes found for this teacher",
            totalCount: 0,
            quizzes: [],
          });
        }
        if (isTeacher && classIds == "" && studentIds == "") {
          return reply.status(200).send({
            message:
              "You must select at least one class or student to fetch quiz results.",
            totalCount: 0,
            quizzes: [],
          });
        }

        const results = await fetchFilteredQuizResults(
          teacherClasses,
          parsedStudentIds,
          parsedLimit,
          parsedOffset,
        );
        if (!results) {
          return reply.send({
            message: "No quizzes found for these classes",
            totalCount: 0,
            quizzes: [],
          });
        }

        reply.send({
          totalCount: results.totalCount,
          quizzes: results.quizResults,
        });
      } else {
        // For students, filter by enrolled classes and optionally by specific quizzes
        const userClasses = await Class.find({ students: request.user._id });
        if (userClasses.length === 0) {
          return reply.send({
            message: "No classes found for this student",
            publishedQuizzes: [],
            quizzes: [],
          });
        }

        const quizResults = await QuizResult.find({
          studentId: request.user._id,
        })
          .populate("quizId", "title content score")
          .populate("publishedQuizId", "dueDate _id")
          .sort({ createdAt: -1 })
          .select("_id score createdAt publishedQuizId")
          .lean();

        reply.send({
          quizzes: quizResults,
        });
      }
    } catch (error) {
      handleError(reply, error);
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
      handleError(reply, error);
    }
  });
};

const QuizResultRequest = {
  type: "object",
  required: ["publishedQuizId", "quizId", "answers"],
  properties: {
    publishedQuizId: { type: "string" },
    quizId: { type: "string" },
    answers: { type: "array", items: { type: "string" } },
  },
  additionalProperties: false,
};

export default quizResultRoutes;
