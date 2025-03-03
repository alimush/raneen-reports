// /pages/api/invoiceDetails.js

import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { sessionId, id } = await request.json();

  console.log(id);

  if (!sessionId || !id) {
    return NextResponse.json(
      { message: "Session ID and Invoice ID are required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      `https://hanab1:50000/b1s/v1/Orders(${id})`, // Updated Endpoint
      {
        headers: {
          Cookie: `B1SESSION=${sessionId}`,
          "Content-Type": "application/json",
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.log(error);
    console.error(
      "Error fetching invoice details:",
      error.response?.data || error.message
    );
    return NextResponse.json(
      {
        message: "Failed to fetch invoice details",
        error: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
