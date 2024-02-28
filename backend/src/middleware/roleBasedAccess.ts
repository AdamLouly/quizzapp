export const roleBasedAccess =
  (roles: Array<"admin" | "teacher" | "student">) =>
  async (request: any, reply: any) => {
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({ message: "Forbidden" });
    }
  };
