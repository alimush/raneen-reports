// app/api/sap/createInvoice/route.js

import axios from 'axios';
import https from 'https';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const agent = new https.Agent({
    rejectUnauthorized: false,  // Ignore invalid SSL certificate
  });

  const { sessionId, invoiceData } = await request.json();
console.log(sessionId, invoiceData)
  const config = {
    headers: {
      'Cookie': `B1SESSION=${sessionId}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  };

  try {
    const response = await axios.post('https://hanab1:50000/b1s/v1/Orders', invoiceData, config);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating A/R Invoice:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Failed to create A/R Invoice', error: error.response?.data || error.message }, { status: 500 });
  }
}
