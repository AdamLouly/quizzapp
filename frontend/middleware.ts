export { default } from "next-auth/middleware";
/* import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.user.isAdmin,
  },
}); */

export const config = { matcher: ["/dashboard/:path*"] };
