import type { FastifyPluginAsync } from "fastify";
import { type IUser, User } from "../../models/User";
import { sendEmail } from "../../utils/mailer";
import { randomBytes } from "crypto";
import { promisify } from "util";
import * as bcrypt from "bcrypt";

const example: FastifyPluginAsync = async (
  fastify: any,
  _opts,
): Promise<void> => {
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

  const updateUserSchema = {
    body: {
      type: "object",
      required: ["firstname", "lastname", "username", "email", "password"],
      properties: {
        firstname: { type: "string", minLength: 1 },
        lastname: { type: "string", minLength: 1 },
        username: { type: "string", minLength: 1 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        newEmail: { type: "string", format: "email" },
        oldEmail: { type: "string", format: "email" },
      },
      additionalProperties: false,
    },
  };

  fastify.post("/register", {
    schema: registerSchema,
    async handler(request: any, reply: any) {
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

        const existingUser = await User.findOne({ email }).exec();
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
    async handler(request: any, reply: any) {
      try {
        const { email, password } = request.body as Pick<
          IUser,
          "email" | "password"
        >;
        const user = await User.findOne({ email }).exec();

        if (!user || !(await user.comparePassword(password))) {
          return await reply
            .code(401)
            .send({ message: "Invalid email or password" });
        }

        if (user.status != "active") {
          return await reply
            .code(401)
            .send({ message: "Your account is not active" });
        }

        const token = fastify.jwt.sign({
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          password: user.password,
          profilePicture: user.profilePicture,
        });
        reply.send({
          token,
          user: {
            id: user.id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            password: user.password,
            profilePicture: user.profilePicture,
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
    async handler(request: any, reply: any) {
      try {
        const { email } = request.body;
        const user = await User.findOne({ email });
        if (!user) {
          return await reply
            .code(404)
            .send({ message: "Verify your credentials" });
        }

        const token = (await randomBytesAsync(24)).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 24 * 1000);

        await user.save();

        const link = `${process.env.CLIENT_URL}/reset-password?token=${token}&id=${user._id}`;

        await sendEmail(
          user.email,
          "Password Reset Request",
          { username: user.username, link },
          "./template/requestResetPassword.handlebars",
        );

        return await reply.code(200).send({
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
    async handler(request: any, reply: any) {
      try {
        const { password, confirmPassword, token, id } = request.body;
        const user = await User.findOne({
          _id: id,
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date(Date.now()) },
        }).exec();

        if (!user) {
          return await reply
            .code(400)
            .send({ message: "Invalid or expired token" });
        }

        if (password !== confirmPassword) {
          return await reply.code(400).send({
            message: "Password and confirm password do not match",
          });
        }

        user.password = password;
        user.resetPasswordToken = "";
        user.resetPasswordExpires = new Date(Date.now());
        await user.save();

        await sendEmail(
          user.email,
          "Password reset",
          { username: user.username },
          "./template/requestPassword.handlebars",
        );

        return await reply
          .code(200)
          .send({ message: "Password reset successful" });
      } catch (error: any) {
        reply.internalServerError(error);
      }
    },
  });

  fastify.put("/update", {
    // PreValidation: [fastify.authenticate],
    schema: updateUserSchema,
    async handler(request: any, reply: any) {
      try {
        const { firstname, lastname, username, password, oldEmail, newEmail } =
          request.body as IUser & { oldEmail: string; newEmail?: string };
        const user = await User.findOne({ email: oldEmail }).exec();
        if (!user) {
          return await reply.code(404).send({ message: "User not found" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return await reply.code(401).send({ message: "Invalid password" });
        }

        const updateData: {
          firstname?: string;
          lastname?: string;
          username?: string;
          email?: string;
        } = {
          firstname,
          lastname,
          username,
        };

        if (newEmail && user.email === oldEmail && oldEmail !== newEmail) {
          const emailExists = await User.findOne({ email: newEmail }).exec();
          if (emailExists) {
            return await reply
              .code(409)
              .send({ message: "New email is already in use" });
          }

          updateData.email = newEmail;
        }

        await User.findOneAndUpdate({ email: oldEmail }, updateData, {
          new: true,
        }).exec();

        reply.code(200).send({ message: "Profile updated successfully" });
      } catch (error) {
        console.error(error);
        reply.code(500).send({ message: "Internal server error" });
      }
    },
  });
};

export default example;
