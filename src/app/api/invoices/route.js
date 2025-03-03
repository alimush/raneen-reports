import { NextResponse } from 'next/server';
import odbc from 'odbc';

export async function POST(request) {
  try {
    const connectionString = process.env.ODBC_CONNECTION_STRING || 'DRIVER={HDBODBC};SERVERNODE=hanab1:30015;UID=SYSTEM;PWD=Skytech@123';
    const connection = await odbc.connect(connectionString);

    // Read data from the POST body if needed for filtering
    const body = await request.json();
    // You can add filtering based on body parameters like startDate, endDate, etc.

    const query = `
      SELECT
        T1."DocEntry",
        T1."DocNum",
        T1."CardCode",
        T1."CardName",
        T1."DocDate",
        T1."DocCur",
        T1."DocTotal",
        T1."DocStatus"
      FROM "NBS_LIVE_NEW"."ORDR" T1
      INNER JOIN "NBS_LIVE_NEW"."RDR1" T2
         ON T1."DocEntry" = T2."DocEntry"
      WHERE T1."CANCELED" = 'N'
        AND T1."DocStatus" = 'O'
      ORDER BY T1."DocDate" DESC
      LIMIT 1000
    `;

    const result = await connection.query(query);
    await connection.close();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('ODBC Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}
