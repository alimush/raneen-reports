// /pages/api/updateInvoice.js

import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { sessionId, id, updatedInvoice } = await request.json();

  // Validate required fields
  if (!sessionId || !id || !updatedInvoice) {
    return NextResponse.json(
      { message: "Session ID, Invoice ID, and Updated Invoice data are required" },
      { status: 400 }
    );
  }

  try {
    // Pass the DocumentLines as received, deletions are handled by their absence
    const payload = {
      Comments: updatedInvoice.Comments,
      DocumentLines: updatedInvoice.DocumentLines,
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const response = await axios.patch(
      `https://hanab1:50000/b1s/v1/Orders(${id})`,
      payload,
      {
        headers: {
          Cookie: `B1SESSION=${sessionId}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json(response.data, { status: 200 });
  } catch (error) {
    console.error("Error updating invoice:", error.response?.data || error.message);
    return NextResponse.json(
      { 
        message: "Failed to update invoice", 
        error: error.response?.data || error.message,
        details: error.response?.data?.error?.message?.value || error.response?.data?.error?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
