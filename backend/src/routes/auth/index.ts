import type { FastifyPluginAsync } from "fastify";
import { IUser, User } from "../../models/User";

const example: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.post("/register", async (request, reply) => {
    try {
      const { username, email, password, role } = request.body as IUser;
      const user = new User({ username, email, password, role });
      await user.save();
      reply.code(201).send({ message: "User created" });
    } catch (error) {
      reply.code(500).send(error);
    }
  });

  fastify.post("/login", async (request, reply) => {
    try {
      const { email, password } = request.body as Pick<
        IUser,
        "email" | "password"
      >;
      const user = await User.findOne({ email }).exec();

      if (!user || !(await user.comparePassword(password))) {
        return reply.code(401).send({ message: "Invalid email or password" });
      }

      const token = fastify.jwt.sign({ id: user.id, role: user.role });
      reply.send({ token });
    } catch (error) {
      reply.code(500).send(error);
    }
  });
};

export default example;
