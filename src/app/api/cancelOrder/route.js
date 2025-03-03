// /pages/api/cancelOrder.js

import axios from 'axios';
import https from 'https';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const agent = new https.Agent({
    rejectUnauthorized: false, // For self-signed or invalid SSL certificates
  });

  try {
    const { sessionId, orderId } = await request.json();

    // Validate input
    if (!sessionId || !orderId) {
      return NextResponse.json(
        { message: 'Missing sessionId or orderId in request body.' },
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

    // **Important**: Adjust the payload and endpoint based on SAP's API requirements
    // Example: To cancel a sale order, you might need to set a specific field or status
    // Below is a generic example; consult SAP's API documentation for exact requirements

    // Example payload to cancel a sale order by setting its status to 'Cancelled'
    const cancellationData = {
      Status: 'CANCELLED', // Adjust based on SAP's API specifications
    };

    // SAP API endpoint to update (cancel) the sale order
    const sapEndpoint = `https://hanab1:50000/b1s/v1/SalesOrders(${orderId})`;

    // Send a PATCH request to update the sale order
    const response = await axios.patch(sapEndpoint, cancellationData, config);

    // Check if the cancellation was successful
    if (response.status === 204 || response.status === 200) {
      return NextResponse.json({ message: 'Sale order cancelled successfully.' });
    } else {
      throw new Error('Unexpected response status from SAP API.');
    }
  } catch (error) {
    console.error('Error cancelling sale order:', error.response?.data || error.message);

    return NextResponse.json(
      { message: 'Failed to cancel sale order.', error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
