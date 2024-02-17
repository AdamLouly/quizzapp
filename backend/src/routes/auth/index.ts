import type { FastifyPluginAsync } from "fastify";
import { IUser, User } from "../../models/User";

const example: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  const registerSchema = {
    body: {
      type: 'object',
      required: ['username', 'email', 'password', 'password_confirm', 'role'],
      properties: {
        username: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        password_confirm: { type: 'string', minLength: 6 },
        role: { type: 'string', enum: ['admin', 'user'] },
      },
      additionalProperties: false
    }
  };
  
  const loginSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
      },
      additionalProperties: false
    }
  };
  
  fastify.post("/register",{ schema: registerSchema,
    handler:async (request, reply) => {
    try {
      const { username, email, password, role } = request.body as IUser;
      if(password !== request?.body?.password_confirm) {
        return reply.code(400).send({ message: "Password and password_confirm must be the same" });
      }
      const user = new User({ username, email, password, role });
      await user.save();
      reply.code(201).send({ message: "User created" });
    } catch (error) {
      reply.code(500).send(error);
    }
  }});

  fastify.post("/login",{ schema: loginSchema,
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

      const token = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email,role: user.role });
      reply.send({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role }});
    } catch (error) {
      reply.code(500).send(error);
    }
  }});
};

export default example;
