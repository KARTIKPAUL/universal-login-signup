
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "./mongodb";
import User from "../../../models/User";


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          const user = await User.findOne({
            email: credentials.email,
          }).select("+password");

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(
            credentials.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            needsPasswordSetup: user.needsPasswordSetup,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();

          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // User exists - check if they need password setup
            if (!existingUser.password && !existingUser.needsPasswordSetup) {
              await User.findByIdAndUpdate(existingUser._id, {
                needsPasswordSetup: true,
                provider: "google",
                providerId: account.providerAccountId,
                image: user.image,
              });
            }
            return true;
          } else {
            // Create new user with Google login
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              providerId: account.providerAccountId,
              needsPasswordSetup: true,
              isEmailVerified: true,
            });
            return true;
          }
        } catch (error) {
          console.error("Google sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.needsPasswordSetup = user.needsPasswordSetup;
      }

      // Check for password setup status on each request
      if (token.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            token.needsPasswordSetup = dbUser.needsPasswordSetup;
          }
        } catch (error) {
          console.error("JWT callback error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.needsPasswordSetup = token.needsPasswordSetup;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
