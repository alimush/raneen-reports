import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { sessionId, id } = await request.json();

  if (!sessionId || !id) {
    return NextResponse.json({ message: "Session ID and ID are required" }, { status: 400 });
  }

  try {
    const response = await axios.post(
      `https://hanab1:50000/b1s/v1/Quotations(${id})/Cancel`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: `B1SESSION=${sessionId}`,
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json({ message: "Quotation canceled successfully", data: response.data });
  } catch (error) {
    console.error("Error canceling quotation:", error.response?.data || error.message);
    return NextResponse.json(
      { message: "Failed to cancel quotation", error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
