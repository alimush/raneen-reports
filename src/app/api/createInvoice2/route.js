// /pages/api/sap/createInvoice.js

import axios from 'axios';
import https from 'https';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const agent = new https.Agent({
    rejectUnauthorized: false, // Adjust based on your SSL requirements
  });

  try {
    const { sessionId, quotationData } = await request.json();

    // Validate input
    if (!sessionId || !quotationData) {
      return NextResponse.json(
        { message: 'Missing sessionId or quotationData in request body.' },
        { status: 400 }
      );
    }

    const config = {
      headers: {
        'Cookie': `B1SESSION=${sessionId}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
    };

    // SAP API endpoint to create a new quotation
    const sapEndpoint = `https://hanab1:50000/b1s/v1/Orders`;

    // Send a POST request to create the quotation
    const response = await axios.post(sapEndpoint, quotationData, config);

    // Check if the creation was successful
    if (response.status === 201 || response.status === 200) {
      return NextResponse.json(response.data);
    } else {
      throw new Error('Unexpected response status from SAP API.');
    }
  } catch (error) {
    console.error('Error creating quotation:', error.response?.data || error.message);

    return NextResponse.json(
      { message: 'Failed to create quotation.', error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
