import axios from "axios";

export async function sendEmail(email: string, otp: string) {
  try {
    const apiKey = process.env.ZEPTOMAIL_API_KEY;
    const fromEmail =
      process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@registrationteam.in";
    const fromName =
      process.env.ZEPTOMAIL_FROM_NAME || "USICON 2026 Registration Team";

    if (!apiKey) {
      throw new Error("ZeptoMail API key not configured");
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>USICON 2026 INDORE</h1>
            <p>Verification Code</p>
          </div>
          <div class="content">
            <p>Dear Participant,</p>
            <p>Your One-Time Password (OTP) for accessing your USICON 2026 INDORE badge is:</p>
            <div class="otp-box">
              <div class="otp">${otp}</div>
            </div>
            <p><strong>This OTP is valid for 10 minutes.</strong></p>
            <p>Please do not share this OTP with anyone for security reasons.</p>
            <p>If you did not request this OTP, please ignore this email.</p>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2026 USICON INDORE. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await axios.post(
      "https://api.zeptomail.in/v1.1/email",
      {
        from: {
          address: fromEmail,
          name: fromName,
        },
        to: [
          {
            email_address: {
              address: email,
            },
          },
        ],
        subject: "Your OTP for AOICON 2026 KOLKATA",
        htmlbody: htmlContent,
      },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Failed to send email");
  }
}
