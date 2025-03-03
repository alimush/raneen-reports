// app/api/sap/cancelQuotation/route.js

import axios from 'axios';
import https from 'https';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const agent = new https.Agent({
    rejectUnauthorized: false,  // Ignore invalid SSL certificate
  });

  const { sessionId, id } = await request.json();

  if (!sessionId || !id) {
    return NextResponse.json({ message: "Session ID and Quotation ID are required" }, { status: 400 });
  }

  const config = {
    headers: {
      'Cookie': `B1SESSION=${sessionId}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  };

  try {
    const cancelUrl = `https://hanab1:50000/b1s/v1/Quotations(${id})/Cancel`;
    // Send an empty object instead of null
    const response = await axios.post(cancelUrl, {}, config);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error cancelling quotation:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Failed to cancel quotation', error: error.response?.data || error.message }, { status: 500 });
  }
}
