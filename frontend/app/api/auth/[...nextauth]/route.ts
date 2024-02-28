import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    /* id: string;
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    role: "admin" | "teacher" | "student";
    profilePicture?: string;
    status: "active" | "inactive";
    emailVerified: boolean; */
  }
}

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          },
        );

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        if (data.token) {
          data.user.token = data.token;
        }

        return data.user;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user?._id;
        token.role = user.role;
        token.username = user.username;
        token.firstname = user.firstname;
        token.lastname = user.lastname;
        token.email = user.email;
        token.status = user.status;
        token.emailVerified = user.emailVerified;
        token.profilePicture = user.profilePicture;
        token.password = user.password;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.username = token.username;
      session.user.firstname = token.firstname;
      session.user.lastname = token.lastname;
      session.user.email = token.email;
      session.user.status = token.status;
      session.user.emailVerified = token.emailVerified;
      session.user.profilePicture = token.profilePicture;
      session.user.password = token.password;
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      const isAllowedToSignIn = user.status === "active";
      if (isAllowedToSignIn) {
        return true;
      } else {
        return false;
      }
    },
  },
});

export { handler as GET, handler as POST };
