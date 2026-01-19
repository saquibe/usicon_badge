import axios from "axios";

export async function sendSMS(mobile: string, otp: string) {
  try {
    const apiKey = process.env.SMS_GATEWAY_API_KEY;
    const userId = process.env.SMS_GATEWAY_USER_ID;
    const password = process.env.SMS_GATEWAY_PASSWORD;

    if (!apiKey || !userId || !password) {
      throw new Error("SMS Gateway credentials not configured");
    }

    // Format the mobile number correctly for India
    const formattedMobile = mobile.replace(/^0|^\+91|^91/, ""); // Remove prefixes
    if (!/^\d{10}$/.test(formattedMobile)) {
      throw new Error(
        `Invalid mobile number format: ${mobile}. Expected 10 digits.`,
      );
    }

    // Use the exact message template required by your SMS provider
    const message = `Login OTP for USICON 2026 Registration is ${otp}. Do not share this OTP to anyone for security reasons. - SaaScraft Studio`;

    // Change from axios.get to axios.post
    const response = await axios.post(
      "https://www.smsgatewayhub.com/api/mt/SendSMS", // URL
      null, // POST data (null if sending via params)
      {
        params: {
          // Keep your parameters here
          APIKey: apiKey,
          senderid: "SAASOE", // Verify this Sender ID is registered and active
          channel: "2",
          DCS: "0",
          flashsms: "0",
          number: `91${formattedMobile}`, // Re-add country code
          text: message,
          route: "1",
          // The SMS Gateway Hub API often requires 'User' and 'passwd' parameters for POST
          User: userId,
          passwd: password,
        },
        headers: {
          Accept: "application/json", // Specify expected response format
        },
      },
    );

    console.log("SMS API Response:", response.data); // Log response for debugging

    // Check the response. Success codes vary by provider (sometimes '000' or '200').
    if (response.data.ErrorCode === "000") {
      return response.data;
    } else {
      throw new Error(`SMS Gateway Error: ${response.data.ErrorMessage}`);
    }
  } catch (error: any) {
    console.error("SMS sending error details:", {
      message: error.message,
      response: error.response?.data,
      mobile: mobile,
    });
    throw new Error("Failed to send SMS");
  }
}
