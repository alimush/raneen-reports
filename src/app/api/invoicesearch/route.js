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
    SELECT T0."Comments", T0."DocNum", T1."CardName" 
FROM "ALUMARAH_LIVE".OINV T0  
INNER JOIN "ALUMARAH_LIVE".OCRD T1 ON T0."CardCode" = T1."CardCode" 
WHERE T0."CANCELED" = 'N'
AND T1."U_Branch" = 2
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
