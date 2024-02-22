import type { FastifyPluginAsync } from "fastify";
import { IUser, User } from "../../models/User";
import { sendEmail } from "../../utils/mailer";
import { randomBytes } from "crypto";
import { promisify } from "util";

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

  const ForgotPasswordSchema = {
    body: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email" },
      },
      additionalProperties: false,
    },
  };

  fastify.post("/register", {
    schema: registerSchema,
    handler: async (request: any, reply: any) => {
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

  fastify.decorate("authenticate", async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: "Authentication failed" });
    }
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

  const randomBytesAsync = promisify(randomBytes);

  fastify.post("/forgot-password", {
    schema: ForgotPasswordSchema,
    handler: async (request: any, reply) => {
      try {
        const { email } = request.body;
        const user = await User.findOne({ email });
        if (!user) {
          return reply.code(404).send({ message: "Verify your credentials" });
        }

        // Generate reset password token and set expiration
        const token = (await randomBytesAsync(24)).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 24 * 1000);

        await user.save();

        const link = `${process.env.CLIENT_URL}/reset-password?token=${token}&id=${user._id}`;

        // Assume sendEmail returns a promise
        await sendEmail(
          user.email,
          "Password Reset Request",
          { username: user.username, link: link },
          "./template/requestResetPassword.handlebars",
        );

        return reply.code(200).send({
          message:
            "If the email is associated with an account, a reset password link has been sent.",
        });
      } catch (error: any) {
        reply.internalServerError(error);
      }
    },
  });
  fastify.post("/reset-password", {
    schema: {
      body: {
        type: "object",
        required: ["password", "confirmPassword", "token", "id"],
        properties: {
          password: { type: "string", minLength: 6 },
          confirmPassword: { type: "string", minLength: 6 },
          token: { type: "string" },
          id: { type: "string" },
        },
        additionalProperties: false,
      },
    },
    handler: async (request:any, reply) => {
      try {
        const { password, confirmPassword, token, id } = request.body;
        const user = await User.findOne({
          _id: id,
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date(Date.now()) },
        }).exec();

        if (!user) {
          return reply.code(400).send({ message: "Invalid or expired token" });
        }

        if (password !== confirmPassword) {
          return reply.code(400).send({
            message: "Password and confirm password do not match",
          });
        }

        user.password = password;
        user.resetPasswordToken = "";
        user.resetPasswordExpires = new Date(Date.now());
        await user.save();

        // Assuming sendEmail is defined elsewhere
        await sendEmail(
          user.email,
          "Password reset",
          { username: user.username },
          "./template/requestPassword.handlebars",
        );

        return reply.code(200).send({ message: "Password reset successful" });
      } catch (error:any) {
        reply.internalServerError(error);
      }
    },
  });
};

export default example;
