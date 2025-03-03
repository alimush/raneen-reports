import { NextResponse } from 'next/server';
import odbc from 'odbc';

// Function to fetch UOMs for a specific item using ODBC
async function fetchUOMs(itemCode) {
  const connectionString = 'DRIVER={HDBODBC};SERVERNODE=hanab1:30015;UID=SYSTEM;PWD=Skytech@123';
  const connection = await odbc.connect(connectionString);

  const query = `
  SELECT 
    T5."UomEntry" AS "UoMEntry",
    T5."UomName" AS "UOM",
    (
        SELECT "Rate" 
        FROM "NBS_LIVE_NEW"."ORTT" 
        WHERE "Currency" = 'IQD' 
          AND "RateDate" = '13.01.2025'
    ) * T2."Price" AS "Price"
FROM 
    "NBS_LIVE_NEW"."OITM" T0
INNER JOIN 
    "NBS_LIVE_NEW"."UGP1" T4 
    ON T0."UgpEntry" = T4."UgpEntry"
INNER JOIN 
    "NBS_LIVE_NEW"."OUOM" T5 
    ON T4."UomEntry" = T5."UomEntry"
LEFT JOIN 
    "NBS_LIVE_NEW"."Price" T2 
    ON T2."ItemCode" = T0."ItemCode" 
    AND T2."UomName" = T5."UomName"
WHERE 
    T0."ItemCode" = ?;

  `;

  try {
    const result = await connection.query(query, [itemCode]); // Use the item code in the query
    await connection.close();
    return result;
  } catch (err) {
    console.error('Error fetching UOMs:', err);
    throw new Error('Error fetching UOMs');
  }
}

// Route handler function
export async function GET(request, { params }) {
  const itemCode = params.itemCode; // Get the itemCode from the URL parameters

  if (!itemCode) {
    return NextResponse.json({ error: 'Item code is required' }, { status: 400 });
  }

  try {
    const uoms = await fetchUOMs(itemCode);
    return NextResponse.json(uoms, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch UOMs' }, { status: 500 });
  }
}
