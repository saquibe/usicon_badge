"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Phone, Shield } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      console.log("Send OTP response:", data);

      if (response.ok) {
        setSuccess(data.message);
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Verifying OTP for:", identifier);

      const result = await signIn("credentials", {
        identifier,
        otp,
        redirect: false,
        callbackUrl: "/badge",
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        console.error("SignIn error:", result.error);

        // Check specific error types
        if (result.error.includes("CredentialsSignin")) {
          setError("Invalid OTP. Please try again.");
        } else if (result.error.includes("401")) {
          setError("Invalid credentials. Please check your OTP.");
        } else {
          setError("Authentication failed. Please try again.");
        }
      } else if (result?.ok) {
        console.log("Login successful, redirecting...");
        router.push("/badge");
      } else {
        setError("Unexpected error occurred.");
      }
    } catch (err: any) {
      console.error("SignIn exception:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("identifier");
    setOtp("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-full flex justify-center mb-4 mt-[-40px]">
            <Image
              src="/USICON LOGO.png"
              alt="USICON 2026 Indore"
              width={420}
              height={140}
              priority
              className="
                w-full
                max-w-[280px]
                sm:max-w-[340px]
                md:max-w-[420px]
                h-auto
                object-contain
              "
            />
          </div>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 pb-2 pt-4">
            <CardTitle className="text-xl text-center text-gray-600">
              {step === "identifier"
                ? "Enter your registered email or mobile number"
                : "Enter the OTP sent to your email/mobile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === "identifier" ? (
              <form onSubmit={handleSendOTP} className="space-y-8">
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Email or Mobile Number"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                    />
                    {identifier.includes("@") ? (
                      <Mail className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    ) : (
                      <Phone className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                  disabled={loading || !identifier}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="h-12 text-center text-2xl tracking-widest font-semibold"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    OTP is valid for 10 minutes
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={handleSendOTP}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-6">
          Need help? Contact the registration team
        </p>
      </div>
    </div>
  );
}
