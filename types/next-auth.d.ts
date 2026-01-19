// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
    mobile: string;
    certUrl?: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      registrationNumber: string;
      mobile: string;
      certUrl?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    registrationNumber: string;
    mobile: string;
    certUrl?: string;
  }
}
