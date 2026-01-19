// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { identifier, otp } = await req.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, error: "Identifier and OTP are required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("usicon_reg");

    const isEmail = identifier.includes("@");
    const cleanIdentifier = identifier.trim().toLowerCase();

    let user;

    // First find the user by identifier
    if (isEmail) {
      user = await usersCollection.findOne({
        $or: [{ email: cleanIdentifier }, { "Email ID": cleanIdentifier }],
      });
    } else {
      // For mobile, clean the digits
      const mobileDigits = cleanIdentifier.replace(/\D/g, "");
      user = await usersCollection.findOne({
        $or: [{ mobile: mobileDigits }, { Mobile: mobileDigits }],
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Debug: Log what's in the database
    // console.log("User OTP from DB:", user.otp);
    // console.log("User OTP Expiry from DB:", user.otpExpiry);
    // console.log("Current time:", new Date());
    // console.log("OTP provided:", otp);

    // Check if OTP matches and is not expired
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 401 },
      );
    }

    // Check if OTP is expired
    if (!user.otpExpiry || new Date(user.otpExpiry) < new Date()) {
      return NextResponse.json(
        { success: false, error: "OTP has expired" },
        { status: 401 },
      );
    }

    // Clear OTP after successful verification
    await usersCollection.updateOne(
      { _id: user._id },
      { $unset: { otp: "", otpExpiry: "" } },
    );

    // Extract user data from database
    const userName = user.name || user["Full Name"] || "";
    const userEmail = user.email || user["Email ID"] || "";
    const userMobile = user.mobile || user["Mobile"] || "";
    const registrationNumber =
      user.registration_num || user["Registration Number"] || "";
    const certUrl = user.certUrl || user["cert_url"] || "";

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: userName,
        email: userEmail,
        registrationNumber: registrationNumber,
        mobile: userMobile.toString(),
        certUrl: certUrl,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
