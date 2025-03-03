import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { sessionId, id } = await request.json();
console.log(id)
  if (!sessionId || !id) {
    return NextResponse.json({ message: "Session ID and ID are required" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://hanab1:50000/b1s/v1/Quotations(${id})`, {
      headers: {
        "Cookie": `B1SESSION=${sessionId}`,
        "Content-Type": "application/json",
      },
      httpsAgent: agent,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error)
    console.error("Error fetching quotation details:", error.response?.data || error.message);
    return NextResponse.json({ message: "Failed to fetch quotation details", error: error.response?.data || error.message }, { status: 500 });
  }
}
