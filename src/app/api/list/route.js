import odbc from 'odbc';

async function fetchData(query, params = []) {
  const connectionString =
    'DRIVER={HDBODBC};SERVERNODE=hanab2:30015;UID=SYSTEM;PWD=B1admin!;CHAR_AS_UTF8=1';
  
  const connection = await odbc.connect(connectionString);
  // Optionally, set schema if needed
  // await connection.query('SET SCHEMA ALUMARAH_LIVE;');

  const result = await connection.query(query, params);
  await connection.close();
  return result;
}

export async function GET(req) {
  try {
    // Query to get unique group names from the OCRG table
    const groupQuery = `
      SELECT DISTINCT "GroupName"
      FROM "ALUMARAH_LIVE"."OCRG"
      ORDER BY "GroupName"
    `;
    // Query to get unique U_paytype values from both OINV and ORIN tables
    const paytypeQuery = `
      SELECT DISTINCT "U_Paytype"
      FROM (
        SELECT "U_Paytype" FROM "ALUMARAH_LIVE"."OINV"
        UNION
        SELECT "U_Paytype" FROM "ALUMARAH_LIVE"."ORIN"
      ) AS sub
      WHERE "U_Paytype" IS NOT NULL AND "U_Paytype" <> ''
      ORDER BY "U_Paytype"
    `;

    const groups = await fetchData(groupQuery);
    const paytypes = await fetchData(paytypeQuery);

    const result = {
      groups,
      paytypes,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching filter data:', err);
    return new Response('Error fetching filter data', { status: 500 });
  }
}
