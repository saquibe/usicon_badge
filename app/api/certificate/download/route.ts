import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // we’ll add this
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userName = session.user.name;

    if (!userName) {
      return NextResponse.json(
        { error: "User name not found" },
        { status: 400 },
      );
    }

    // Load certificate template
    const templatePath = path.join(
      process.cwd(),
      "public/certificates/usicon-certificate-template.pdf",
    );

    const existingPdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const { width, height } = firstPage.getSize();

    // 👉 Adjust these coordinates to match your template
    firstPage.drawText(userName, {
      x: width / 2 - font.widthOfTextAtSize(userName, 32) / 2,
      y: height / 2 - 25,
      size: 22,
      font,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="USICON-Certificate-${userName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 },
    );
  }
}
