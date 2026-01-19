"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download, Share2, Receipt } from "lucide-react";
import { toPng } from "html-to-image";

export default function BadgePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      const qrData = user.registrationNumber;
      generateQRCode(qrData);
    }
  }, [session]);

  const generateQRCode = async (data: string) => {
    try {
      const QRCode = await import("qrcode");
      const url = await QRCode.toDataURL(data, {
        width: 150,
        margin: 0,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error("QR Code generation error:", error);
    }
  };

  // In BadgePage component, update handleDownloadReceipt function
  const handleDownloadReceipt = async () => {
    setReceiptLoading(true);
    try {
      const user = session?.user as any;

      // Open receipt page in new tab
      const receiptUrl = `/receipt?id=${encodeURIComponent(user.registrationNumber)}`;
      window.open(receiptUrl, "_blank");
    } catch (error: any) {
      console.error("Receipt error:", error);
      alert("Failed to open receipt. Please try again.");
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!badgeRef.current) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const width = badgeRef.current.offsetWidth;
      const height = badgeRef.current.offsetHeight;

      const dataUrl = await toPng(badgeRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          margin: "0 auto",
          display: "block",
        },
        cacheBust: true,
        filter: (node) => {
          return !node.classList?.contains("ignore-in-image");
        },
      });

      const link = document.createElement("a");
      link.download = `USICON-2026-Badge-${(session?.user as any).registrationNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download badge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!badgeRef.current) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const width = badgeRef.current.offsetWidth;
      const height = badgeRef.current.offsetHeight;

      const dataUrl = await toPng(badgeRef.current, {
        quality: 0.9,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: width,
        height: height,
        cacheBust: true,
        filter: (node) => {
          return !node.classList?.contains("ignore-in-image");
        },
      });

      if (!dataUrl) return;

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `USICON-2026-Badge-${(session?.user as any).registrationNumber}.png`,
        {
          type: "image/png",
        },
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `USICON 2026 Badge - ${(session?.user as any).name}`,
            text: `My USICON 2026 INDORE Badge - Registration: ${(session?.user as any).registrationNumber}`,
          });
        } catch (err) {
          console.error("Share error:", err);
          handleDownload();
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
      handleDownload();
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-sm w-full">
        {/* Badge Container */}
        <div
          className="mb-6"
          style={{ width: "350px", maxWidth: "100%", margin: "0 auto" }}
        >
          <Card
            ref={badgeRef}
            className="overflow-hidden shadow-xl border border-gray-300 bg-white mx-auto"
            style={{
              width: "100%",
              maxWidth: "350px",
              margin: "0 auto",
            }}
          >
            {/* Badge Header */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-5 text-center relative overflow-hidden">
              <div className="relative">
                <h2 className="text-xl font-bold text-white mb-1">
                  USICON 2026
                </h2>
                <p className="text-sm text-blue-100">INDORE</p>
              </div>
            </div>

            {/* Badge Content */}
            <div className="px-4 py-4 space-y-4">
              {/* Participant Name */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {user.name}
                </h3>
              </div>

              {/* Registration Number */}
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  REGISTRATION NUMBER
                </p>
                <div className="inline-block bg-gradient-to-r from-blue-700 to-blue-900 text-white px-4 py-2 rounded-md">
                  <p className="text-base font-bold tracking-wider">
                    {user.registrationNumber}
                  </p>
                </div>
              </div>

              {/* QR Code Section */}
              {qrCodeUrl && (
                <div className="text-center pt-2">
                  <div className="inline-block p-2 bg-white rounded border border-gray-300">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Scan QR for verification
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 ignore-in-image mt-6">
          {/* Download Badge Button */}
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="h-10 text-sm bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-3 w-3" />
                Badge
              </>
            )}
          </Button>

          {/* Download Receipt Button */}
          <Button
            onClick={handleDownloadReceipt}
            disabled={receiptLoading}
            className="h-10 text-sm bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900"
            size="sm"
          >
            {receiptLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-3 w-3" />
                Receipt
              </>
            )}
          </Button>

          {/* Share Button */}
          <Button
            onClick={handleShare}
            disabled={loading}
            variant="outline"
            className="h-10 text-sm border border-gray-500 hover:bg-blue-50 ignore-in-image"
            size="sm"
          >
            <Share2 className="mr-2 h-3 w-3" />
            Share
          </Button>
        </div>

        {/* Conference Info */}
        {/* <div className="mt-8 text-center text-sm text-gray-600">
          <p className="font-semibold">USICON 2026</p>
          <p className="text-xs">January 29th - February 1st, 2026</p>
          <p className="text-xs">Indore, Madhya Pradesh</p>
        </div> */}

        {/* Return Button */}
        <div className="text-center ignore-in-image mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/login")}
            className="text-xs text-gray-600 hover:text-gray-900"
            size="sm"
          >
            ← Back to Login
          </Button>
        </div>

        {/* Note about receipts */}
        <div className="text-center mt-4 text-xs text-gray-500">
          <p>Click "Receipt" to download your payment receipt in PDF format</p>
        </div>
      </div>
    </div>
  );
}
