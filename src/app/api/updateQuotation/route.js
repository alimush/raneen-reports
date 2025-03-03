import axios from "axios";
import https from "https";
import { NextResponse } from "next/server";

export async function POST(request) {
  const { sessionId, id, updatedQuotation } = await request.json();
  const agent = new https.Agent({ rejectUnauthorized: false });
  
  try {
    // Structure the payload - key change is using __REMOVE__ for deleted lines
    const payload = {
      Comments: updatedQuotation.Comments,
      DocumentLines: updatedQuotation.DocumentLines.map(line => {
        if (line.LineStatus === 'C') {
          // Mark line for deletion using Service Layer syntax
          return {
            LineNum: line.LineNum,
            __REMOVE__: ""
          };
        }
        
        // Regular line update
        return {
          LineNum: line.LineNum,
          ItemCode: line.ItemCode,
          Quantity: line.Quantity,
          UoMEntry: line.UoMEntry,
          DiscountPercent: line.DiscountPercent || 0
        };
      })
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));

    const response = await axios.patch(
      `https://hanab1:50000/b1s/v1/Quotations(${id})`,
      payload,
      {
        headers: {
          Cookie: `B1SESSION=${sessionId}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        httpsAgent: agent,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error updating quotation:", error.response?.data || error.message);
    return NextResponse.json(
      { 
        message: "Failed to update quotation", 
        error: error.response?.data || error.message,
        details: error.response?.data?.error?.message?.value
      },
      { status: error.response?.status || 500 }
    );
  }
}