import { useSession } from "next-auth/react";

export const currentUser = () => {
  const session = useSession();

  return session?.user;
};

export const currentRole = () => {
  const session = useSession();

  return session?.user?.role;
};
