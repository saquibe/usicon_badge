// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Mobile", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.identifier || !credentials?.otp) {
            // console.log("Missing credentials");
            return null;
          }

          // console.log("Authorizing:", credentials.identifier);

          // Direct database verification (simpler approach)
          const { getDatabase } = await import("@/lib/mongodb");
          const db = await getDatabase();
          const usersCollection = db.collection("usicon_reg");

          const isEmail = credentials.identifier.includes("@");
          const cleanIdentifier = credentials.identifier.trim().toLowerCase();

          let query = {};
          if (isEmail) {
            query = {
              $or: [
                { email: cleanIdentifier },
                { "Email ID": cleanIdentifier },
              ],
              otp: credentials.otp,
            };
          } else {
            const mobileDigits = cleanIdentifier.replace(/\D/g, "");
            query = {
              $or: [{ mobile: mobileDigits }, { Mobile: mobileDigits }],
              otp: credentials.otp,
            };
          }

          const user = await usersCollection.findOne(query);

          if (!user) {
            // console.log("No user found or invalid OTP");
            return null;
          }

          // Check if OTP is expired
          if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) {
            // console.log("OTP expired");
            return null;
          }

          // Clear OTP after successful verification
          await usersCollection.updateOne(
            { _id: user._id },
            { $unset: { otp: "", otpExpiry: "" } },
          );

          // Extract user data
          const userName = user.name || user["Full Name"] || "";
          const userEmail = user.email || user["Email ID"] || "";
          const userMobile = user.mobile || user["Mobile"] || "";
          const registrationNumber =
            user.registration_num || user["Registration Number"] || "";

          // console.log("User authorized:", userEmail);

          return {
            id: user._id.toString(),
            name: userName,
            email: userEmail,
            registrationNumber: registrationNumber,
            mobile: userMobile.toString(),
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.registrationNumber = (user as any).registrationNumber;
        token.mobile = (user as any).mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).registrationNumber = token.registrationNumber;
        (session.user as any).mobile = token.mobile;
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
});

export { handler as GET, handler as POST };
