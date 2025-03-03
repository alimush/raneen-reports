import { NextResponse } from 'next/server';
import odbc from 'odbc';

export async function POST(request) {
  try {
    const connectionString = 'DRIVER={HDBODBC};SERVERNODE=hanab1:30015;UID=SYSTEM;PWD=Skytech@123';
    const connection = await odbc.connect(connectionString);

    // Example: maybe read data from the POST body
    const body = await request.json();
    // You could do filtering based on "body.startDate" or "body.endDate", etc.

    const query = `
      SELECT
        T1."DocEntry",
        T1."DocNum",
        T1."CardCode",
        T1."CardName",
        T1."DocDate",
        T1."DocCur",
        T1."DocTotal"
      FROM "NBS_LIVE_NEW"."OQUT" T1
      INNER JOIN "NBS_LIVE_NEW"."QUT1" T2
         ON T1."DocEntry" = T2."DocEntry"
      WHERE T1."CANCELED" = 'N'
        AND T1."DocStatus" = 'O'
      -- Possibly add a filter based on body params here
    `;

    const result = await connection.query(query);
    await connection.close();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('ODBC Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotations', details: error.message },
      { status: 500 }
    );
  }
}
