// app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { sendEmail } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { generateOTP, generateOTPExpiry } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or mobile number is required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("usicon_reg");

    // Clean the identifier
    const cleanIdentifier = identifier.trim();

    // Check if identifier is email or mobile
    const isEmail = cleanIdentifier.includes("@");
    const isMobile = /^\d{10}$/.test(cleanIdentifier.replace(/\D/g, ""));

    if (!isEmail && !isMobile) {
      return NextResponse.json(
        { error: "Please enter a valid email or 10-digit mobile number" },
        { status: 400 },
      );
    }

    let query = {};
    if (isEmail) {
      query = {
        $or: [
          { email: cleanIdentifier.toLowerCase() },
          { "Email ID": cleanIdentifier.toLowerCase() },
        ],
      };
    } else {
      // For mobile, extract just the digits
      const mobileDigits = cleanIdentifier.replace(/\D/g, "");
      query = {
        $or: [{ mobile: mobileDigits }, { Mobile: mobileDigits }],
      };
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return NextResponse.json(
        {
          error:
            "No registration found with this email/mobile number. Please check your credentials or contact support.",
        },
        { status: 404 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry();

    // console.log("Generated OTP:", otp);
    // console.log("OTP Expiry:", otpExpiry);

    // Store OTP in database
    const updateResult = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          otp: otp,
          otpExpiry: otpExpiry,
        },
      },
    );

    // console.log("Update result:", updateResult);

    // Verify the OTP was stored
    const updatedUser = await usersCollection.findOne({ _id: user._id });
    // console.log("Updated user OTP:", updatedUser?.otp);
    // console.log("Updated user OTP Expiry:", updatedUser?.otpExpiry);

    // Send OTP via email or SMS
    let sentVia = "";
    if (isEmail) {
      try {
        await sendEmail(cleanIdentifier, otp);
        sentVia = "email";
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Fallback to SMS if email fails and we have mobile number
        const userMobile = user.mobile || user.Mobile;
        if (userMobile) {
          try {
            await sendSMS(userMobile.toString(), otp);
            sentVia = "SMS (email fallback)";
          } catch (smsError) {
            console.error("SMS sending also failed:", smsError);
            sentVia = "failed";
          }
        } else {
          sentVia = "failed";
        }
      }
    } else {
      try {
        await sendSMS(cleanIdentifier.replace(/\D/g, ""), otp);
        sentVia = "SMS";
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        // Fallback to email if SMS fails and we have email
        const userEmail = user.email || user["Email ID"];
        if (userEmail) {
          try {
            await sendEmail(userEmail, otp);
            sentVia = "email (SMS fallback)";
          } catch (emailError) {
            console.error("Email sending also failed:", emailError);
            sentVia = "failed";
          }
        } else {
          sentVia = "failed";
        }
      }
    }

    if (sentVia === "failed") {
      // Remove OTP since sending failed
      await usersCollection.updateOne(
        { _id: user._id },
        { $unset: { otp: "", otpExpiry: "" } },
      );

      return NextResponse.json(
        {
          error:
            "Failed to send OTP. Please try again later or contact support.",
        },
        { status: 500 },
      );
    }

    // For security, mask the email/mobile in response
    const maskedIdentifier = isEmail
      ? `${cleanIdentifier.substring(0, 3)}***@${cleanIdentifier.split("@")[1]}`
      : `${cleanIdentifier.substring(0, 4)}******`;

    return NextResponse.json({
      success: true,
      message: `OTP has been sent to your ${sentVia} ${maskedIdentifier}`,
      maskedIdentifier: maskedIdentifier,
      isEmail: isEmail,
    });
  } catch (error: any) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 },
    );
  }
}
