import odbc from 'odbc';

async function fetchData(query) {
  const connectionString =
    'DRIVER={HDBODBC};SERVERNODE=hanab2:30015;UID=SYSTEM;PWD=B1admin!;CHAR_AS_UTF8=1';
  
  const connection = await odbc.connect(connectionString);
  const result = await connection.query(query);
  await connection.close();
  return result;
}

export async function GET(req) {
  try {

    // Main SQL Query
    const sqlQuery = `
    SELECT T0."CardName", T0."CardCode", T1."GroupName" 
FROM "ALUMARAH_LIVE".OCRD T0  
INNER JOIN "ALUMARAH_LIVE".OCRG T1 ON T0."GroupCode" = T1."GroupCode" 
WHERE T0."U_Branch" = 2
AND T0."validFor" = 'Y'
    `;

    const result = await fetchData(sqlQuery);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    return new Response('Error fetching data', { status: 500 });
  }
}
