import { FastifyPluginAsync } from "fastify";
import { IUser, User } from "../../models/User";
import { sendEmail } from "../../utils/mailer";
import { randomBytes } from "crypto";
import { promisify } from "util";
import * as bcrypt from "bcrypt";

const example: FastifyPluginAsync = async (
  fastify: any,
  _opts,
): Promise<void> => {
  // Promisify crypto.randomBytes
  const randomBytesAsync = promisify(randomBytes);

  // Schema definitions
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

  // Register route
  fastify.post("/register", {
    schema: registerSchema,
    async handler(request: any, reply: any) {
      try {
        const { firstname, lastname, username, email, password, role } =
          request.body as IUser;

        // Check if passwords match
        if (password !== request.body.confirmPassword) {
          return reply.code(400).send({
            message: "Password and confirm password do not match",
          });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email }).exec();
        if (existingUser) {
          return reply.code(400).send({
            message: "Email already exists",
          });
        }

        // Create new user
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
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  });

  // Login route
  fastify.post("/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        },
        additionalProperties: false,
      },
    },
    async handler(request: any, reply: any) {
      try {
        const { email, password } = request.body as Pick<
          IUser,
          "email" | "password"
        >;
        const user = await User.findOne({ email }).exec();

        // Check if user exists and password is correct
        if (!user || !(await user.comparePassword(password))) {
          return reply.code(401).send({ message: "Invalid email or password" });
        }

        // Check if user account is active
        if (user.status !== "active") {
          return reply
            .code(401)
            .send({ message: "Your account is not active" });
        }

        // Generate JWT token
        const token = fastify.jwt.sign({
          _id: user._id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          client: user.client,
          status: user.status,
          emailVerified: user.emailVerified,
          profilePicture: user.profilePicture,
        });

        reply.send({
          token,
          user: {
            _id: user._id,
            username: user.username,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            client: user.client,
            status: user.status,
            emailVerified: user.emailVerified,
            profilePicture: user.profilePicture,
          },
        });
      } catch (error) {
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  });

  // Forgot password route
  fastify.post("/forgot-password", {
    schema: {
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
        additionalProperties: false,
      },
    },
    async handler(request: any, reply: any) {
      try {
        const { email } = request.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
          return reply.code(404).send({ message: "User not found" });
        }

        // Generate reset token
        const token = (await randomBytesAsync(24)).toString("hex");
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 24 * 1000);
        await user.save();

        // Send reset password email
        const link = `${process.env.CLIENT_URL}/reset-password?token=${token}&id=${user._id}`;
        await sendEmail(
          user.email,
          "Password Reset Request",
          { username: user.username, link },
          "./template/requestResetPassword.handlebars",
        );

        reply.code(200).send({ message: "Password reset email sent" });
      } catch (error) {
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  });

  // Reset password route
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

        // Find user by ID and reset token
        const user = await User.findOne({
          _id: id,
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: new Date(Date.now()) },
        }).exec();

        // Check if user exists and token is valid
        if (!user) {
          return reply.code(400).send({ message: "Invalid or expired token" });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
          return reply.code(400).send({
            message: "Password and confirm password do not match",
          });
        }

        // Reset password and clear reset token
        user.password = password;
        user.resetPasswordToken = "";
        user.resetPasswordExpires = new Date(Date.now());
        await user.save();

        // Send password reset confirmation email
        await sendEmail(
          user.email,
          "Password Reset",
          { username: user.username },
          "./template/requestPassword.handlebars",
        );

        reply.code(200).send({ message: "Password reset successful" });
      } catch (error) {
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  });

  // Update user route
  /* fastify.put("/update", {
    schema: {
      body: {
        type: "object",
        required: ["firstname", "lastname", "username", "password", "oldEmail"],
        properties: {
          firstname: { type: "string", minLength: 1 },
          lastname: { type: "string", minLength: 1 },
          username: { type: "string", minLength: 1 },
          password: { type: "string", minLength: 6 },
          oldEmail: { type: "string", format: "email" },
          newEmail: { type: "string", format: "email" },
        },
        additionalProperties: false,
      },
    },
    async handler(request: any, reply: any) {
      try {
        const { firstname, lastname, username, password, oldEmail, newEmail } =
          request.body as IUser & { oldEmail: string; newEmail?: string };

        // Find user by old email
        const user = await User.findOne({ email: oldEmail }).exec();
        if (!user) {
          return reply.code(404).send({ message: "User not found" });
        }

        // Check if password matches
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
          return reply.code(401).send({ message: "Invalid password" });
        }

        // Update user data
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

        // Update email if new email is provided
        if (newEmail && user.email === oldEmail && oldEmail !== newEmail) {
          // Check if new email is already in use
          const emailExists = await User.findOne({ email: newEmail }).exec();
          if (emailExists) {
            return reply
              .code(409)
              .send({ message: "New email is already in use" });
          }
          updateData.email = newEmail;
        }

        // Perform update
        await User.findOneAndUpdate({ email: oldEmail }, updateData, {
          new: true,
        }).exec();

        reply.code(200).send({ message: "Profile updated successfully" });
      } catch (error) {
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  }); */
  fastify.put("/update", {
    schema: {
      body: {
        type: "object",
        required: ["password", "confirmPassword"],
        properties: {
          password: { type: "string", minLength: 4 },
          confirmPassword: { type: "string", minLength: 4 },
        },
        additionalProperties: false,
      },
    },
    preValidation: [fastify.authenticate],
    async handler(request: any, reply: any) {
      try {
        const { password, confirmPassword } = request.body as any;
        if (password != confirmPassword) {
          return reply
            .code(400)
            .send({ message: "Password and confirm password do not match" });
        }

        // Perform update on the user's password
        const passwordHash = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(request.user._id, {
          password: passwordHash,
        });
        reply.code(200).send({ message: "Profile updated successfully" });
      } catch (error) {
        reply.code(500).send({ message: "Internal Server Error" });
      }
    },
  });
};

export default example;
