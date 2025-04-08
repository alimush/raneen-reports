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
    const { searchParams } = new URL(req.url);
    const cardCode = searchParams.get("cardCode");
    
    const sqlQuery = `
     SELECT 
    T2."CardCode" "رمز الزبون", 
    T2."CardName" "اسم الزبون", 
    T3."GroupName" "الوزارة", 
    T2."U_LV1" "الدائرة" , 
    T0."U_Paytype" "الدفع", 
    T0."DocNum" "رقم الساب", 
    T0."DocDate" "تاريخ الفاتورة", 
    T0."Comments" "رقم الفاتورة", 
    T1."DueDate" "تاريخ القسط", 
    T1."InstlmntID" "القسط", 
    T1."InsTotal" "مبلغ القسط", 
    T1."PaidToDate" "مبلغ الدفع", 
    T1."InsTotal" - T1."PaidToDate" "المتبقي"
FROM 
    "ALUMARAH_LIVE".OINV T0
    INNER JOIN "ALUMARAH_LIVE".INV6 T1 ON T0."DocEntry" = T1."DocEntry"
    INNER JOIN "ALUMARAH_LIVE".OCRD T2 ON T0."CardCode" = T2."CardCode"
    INNER JOIN "ALUMARAH_LIVE".OCRG T3 ON T2."GroupCode" = T3."GroupCode"
WHERE 
    T0."CANCELED" = 'N' AND T0."Comments" = '4562-124000-16'
    AND T2."U_Branch" = 2 -- not in (2,3) = Baghdad, 2 = Diwaniya, 3 = Kut
ORDER BY 
    T2."CardCode", 
    T0."DocNum", 
    T1."InstlmntID";
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
