import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { sessionId, id, comments } = await request.json();

  if (!sessionId || !id || !comments) {
    return NextResponse.json({ message: "Session ID, ID, and comments are required" }, { status: 400 });
  }

  try {
    const response = await axios.patch(
      `https://hanab1:50000/b1s/v1/Quotations(${id})`,
      { Comments: comments },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: `B1SESSION=${sessionId}`,
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json({ message: "Quotation comments updated successfully", data: response.data });
  } catch (error) {
    console.error("Error updating quotation comments:", error.response?.data || error.message);
    return NextResponse.json(
      { message: "Failed to update quotation comments", error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
