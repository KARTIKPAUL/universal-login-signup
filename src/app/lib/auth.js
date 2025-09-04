import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import User from "../../../models/User";
import dbConnect from "./mongodb";

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
            needsPasswordSetup: user.needsPasswordSetup || false,
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
            console.log("🔍 Existing Google user found:", {
              email: existingUser.email,
              hasPassword: !!existingUser.password,
              currentNeedsPasswordSetup: existingUser.needsPasswordSetup,
            });

            // CRITICAL FIX: Only update if user actually needs password setup
            // Don't override existing password setup status

            if (existingUser.password && !existingUser.needsPasswordSetup) {
              // User already has password and setup is complete - DO NOTHING
              console.log(
                "✅ User already has password setup complete, skipping update"
              );
              return true;
            }

            if (!existingUser.password && existingUser.needsPasswordSetup) {
              // User needs password setup (first time Google login) - UPDATE ONLY NECESSARY FIELDS
              console.log(
                "⚠️ User needs password setup, updating image and provider info only"
              );
              await User.findByIdAndUpdate(existingUser._id, {
                // DON'T set needsPasswordSetup: true here if it's already true
                // Only update image and provider info
                image: user.image || existingUser.image,
                provider: "google",
                providerId: account.providerAccountId,
                updatedAt: new Date(),
              });
              return true;
            }

            // Edge case: User has password but needsPasswordSetup is still true (shouldn't happen)
            if (existingUser.password && existingUser.needsPasswordSetup) {
              console.log(
                "🔧 Fixing inconsistent state: user has password but needsPasswordSetup is true"
              );
              await User.findByIdAndUpdate(existingUser._id, {
                needsPasswordSetup: false,
                image: user.image || existingUser.image,
                provider: "google",
                providerId: account.providerAccountId,
                updatedAt: new Date(),
              });
              return true;
            }

            return true;
          } else {
            // Create new user with Google login
            console.log("🆕 Creating new Google user");
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              providerId: account.providerAccountId,
              needsPasswordSetup: true, // Only for NEW users
              isEmailVerified: true,
            });
            console.log("✅ New Google user created:", newUser.email);
            return true;
          }
        } catch (error) {
          console.error("❌ Google sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.needsPasswordSetup = user.needsPasswordSetup;
      }

      // Always fetch fresh data from database to ensure accuracy
      if (token.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email });
          if (dbUser) {
            const previousSetupStatus = token.needsPasswordSetup;
            token.needsPasswordSetup = dbUser.needsPasswordSetup || false;

            // Log if status changed
            if (previousSetupStatus !== token.needsPasswordSetup) {
              console.log("📄 JWT - Password setup status changed:", {
                email: token.email,
                from: previousSetupStatus,
                to: token.needsPasswordSetup,
              });
            }
          }
        } catch (error) {
          console.error("❌ JWT callback error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.needsPasswordSetup = token.needsPasswordSetup || false;

        console.log("🎯 Session created:", {
          email: session.user.email,
          needsPasswordSetup: session.user.needsPasswordSetup,
        });
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
  events: {
    async signIn(message) {
      console.log("🔐 Sign in event:", {
        email: message.user.email,
        provider: message.account?.provider,
      });
    },
  },
};
