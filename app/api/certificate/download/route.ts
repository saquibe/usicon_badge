import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Check session
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

    // 2️⃣ Load certificate template
    const templatePath = path.join(
      process.cwd(),
      "public/certificates/usicon-certificate-template.pdf",
    );

    const existingPdfBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    // 3️⃣ Font
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const { width, height } = page.getSize();

    // 4️⃣ Position & scaling configuration
    const NAME_START_X = width * 0.36; // 🔥 left aligned start
    const NAME_Y = height / 2 - 25; // 🔽 slightly down

    const MAX_TEXT_WIDTH = width * 0.55;
    let fontSize = 22;

    // 5️⃣ Auto-shrink font for long names
    while (
      font.widthOfTextAtSize(userName, fontSize) > MAX_TEXT_WIDTH &&
      fontSize > 14
    ) {
      fontSize -= 1;
    }

    // 6️⃣ Draw name
    page.drawText(userName, {
      x: NAME_START_X,
      y: NAME_Y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // 7️⃣ Generate PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="USICON-Certificate-${userName}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 },
    );
  }
}
