// app/receipt/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

interface ReceiptData {
  registrationNumber: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  paymentMode: string;
  totalAmount: string;
  transactionId: string;
}

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        const registrationNumber = searchParams.get("id");

        if (!registrationNumber) {
          setError("No registration number provided");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/receipt/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationNumber }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch receipt data");
        }

        const data = await response.json();
        setReceiptData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: "text/html" });
    element.href = URL.createObjectURL(blob);
    element.download = `USICON-Receipt-${receiptData?.registrationNumber}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {error || "Failed to load receipt"}
          </p>
          <Button onClick={() => router.push("/badge")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Badge
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .receipt-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 p-4">
        {/* Action Buttons (Hidden when printing) */}
        <div className="max-w-4xl mx-auto mb-6 no-print">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <Button
              variant="outline"
              onClick={() => router.push("/badge")}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Badge
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {/* <Button
                onClick={handleDownload}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download HTML
              </Button> */}
            </div>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden receipt-container">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-96 h-48">
                <Image
                  src="/USICON LOGO.png"
                  alt="USICON 2026"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              The Urological Society of India
            </h1>
            <p className="text-blue-100">23AAATT0147P1ZD</p>
            <p className="text-blue-100 text-sm mt-2">
              104-107, Veda Business Park, Bhanwarkua Square, Indore, Madhya
              Pradesh, 452001
            </p>
          </div>

          {/* Receipt Title */}
          <div className="p-8 text-center border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              PAYMENT RECEIPT
            </h2>
            <p className="text-gray-600 mt-2">
              Date: {format(new Date(), "MMMM dd, yyyy")}
            </p>
          </div>

          {/* Receipt Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - User Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    Registration Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Registration Number
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {receiptData.registrationNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="text-lg font-semibold">
                        {receiptData.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="text-lg">{receiptData.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Mobile Number</p>
                      <p className="text-lg">{receiptData.mobile}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    Address
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">{receiptData.address}</p>
                    <p className="text-gray-700">
                      {receiptData.city}, {receiptData.state} -{" "}
                      {receiptData.pin}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Payment Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    Payment Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-semibold">Registration Fees:</span>
                      <span className="text-xl font-bold text-green-700">
                        ₹{receiptData.totalAmount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Registration Category:
                      </span>
                      <span className="font-semibold">USI MEMBER</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                    Transaction Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Type:</span>
                      <span className="font-semibold">
                        {receiptData.paymentMode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="text-lg font-bold">
                        ₹{receiptData.totalAmount}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Payment Reference Number
                      </p>
                      <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                        {receiptData.transactionId || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conference Info */}
                {/* <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">
                    USICON 2026
                  </h3>
                  <p className="text-blue-700">
                    January 29th - February 1st, 2026
                  </p>
                  <p className="text-blue-700">Indore, Madhya Pradesh</p>
                </div> */}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center border-t">
            <p className="text-gray-600 italic">
              This is a system-generated receipt; it needs no signature.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Receipt ID: {receiptData.registrationNumber} | Generated on:{" "}
              {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
            </p>
          </div>
        </div>

        {/* Print Instructions */}
        {/* <div className="max-w-4xl mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg no-print">
          <p className="text-yellow-800 text-sm">
            💡 <strong>Tip:</strong> Click "Print" to save as PDF. In the print
            dialog, select "Save as PDF" as your printer.
          </p>
        </div> */}
      </div>
    </>
  );
}
