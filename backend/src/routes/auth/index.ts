import type { FastifyPluginAsync } from "fastify";
import { IUser, User } from "../../models/User";

const example: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  const registerSchema = {
    body: {
      type: "object",
      required: [
        "firstname",
        "lastname",
        "username",
        "email",
        "password",
        "confirmPassword",
        "role",
      ],
      properties: {
        firstname: { type: "string", minLength: 1 },
        lastname: { type: "string", minLength: 1 },
        username: { type: "string", minLength: 1 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        confirmPassword: { type: "string", minLength: 6 },
        role: { type: "string", enum: ["student", "teacher"] },
      },
      additionalProperties: false,
    },
  };

  const loginSchema = {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
      },
      additionalProperties: false,
    },
  };

  fastify.post("/register", {
    schema: registerSchema,
    handler: async (request, reply) => {
      try {
        const { firstname, lastname, username, email, password, role } =
          request.body as IUser;
        if (password !== request?.body?.confirmPassword) {
          return reply.code(400).send({
            message: "Validation errors",
            errors: [
              {
                field: "confirmPassword",
                message: "Password and confirm password do not match",
              },
            ],
          });
        }
        const existingUser = await User.findOne({ email: email }).exec();
        if (existingUser) {
          return reply.code(400).send({
            message: "Validation errors",
            errors: [{ field: "email", message: "Email already exists" }],
          });
        }
        const user = new User({
          firstname,
          lastname,
          username,
          email,
          password,
          role,
        });
        await user.save();
        reply.code(201).send({ message: "User created" });
      } catch (error) {
        reply.code(500).send(error);
      }
    },
  });

  fastify.post("/login", {
    schema: loginSchema,
    handler: async (request, reply) => {
      try {
        const { email, password } = request.body as Pick<
          IUser,
          "email" | "password"
        >;
        const user = await User.findOne({ email }).exec();

        if (!user || !(await user.comparePassword(password))) {
          return reply.code(401).send({ message: "Invalid email or password" });
        }

        const token = fastify.jwt.sign({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });
        reply.send({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        reply.code(500).send(error);
      }
    },
  });
};

export default example;
