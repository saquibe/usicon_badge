// app/api/receipt/data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { registrationNumber } = await req.json();

    if (!registrationNumber) {
      return NextResponse.json(
        { error: "Registration number is required" },
        { status: 400 },
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("usicon_reg");

    // Find user by registration number
    const user = await usersCollection.findOne({
      $or: [
        { "Registration Number": registrationNumber },
        { registration_num: registrationNumber },
      ],
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract user data
    const receiptData = {
      registrationNumber: registrationNumber,
      name: user["Full Name"] || user["name"] || "",
      email: user["Email ID"] || user["email"] || "",
      mobile: user["Mobile"] || user["mobile"] || "",
      address: user["Address"] || user["address"] || "",
      city: user["City"] || user["city"] || "",
      state: user["State"] || user["state"] || "",
      pin: user["PIN"] || user["pin"] || "",
      paymentMode: user["Payment Mode"] || user["payment_mode"] || "Offline",
      totalAmount: user["Total Amount"] || user["total_amount"] || "8500",
      transactionId: user["Transaction ID"] || user["transaction_id"] || "",
    };

    return NextResponse.json(receiptData);
  } catch (error: any) {
    console.error("Receipt data error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch receipt data" },
      { status: 500 },
    );
  }
}
