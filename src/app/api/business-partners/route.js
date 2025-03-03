import odbc from 'odbc';

// Function to fetch data using ODBC with parameterized queries
async function fetchData(query, params = []) {
  const connectionString =
    'DRIVER={HDBODBC};SERVERNODE=hanab1:30015;UID=SYSTEM;PWD=Skytech@123;CHAR_AS_UTF8=1';
  const connection = await odbc.connect(connectionString);
  const result = await connection.query(query, params);
  await connection.close();
  return result;
}

// Next.js Route Handler
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.trim() || ''; // Handle trimming the query and fallback to an empty string
    const searchType = searchParams.get('searchType') || 'name';

    if (!query) {
      return new Response('Query parameter is required', { status: 400 });
    }

    if (type === 'items') {
      let searchCondition = '';

      if (searchType === 'name') {
        searchCondition = `UPPER(T0."ItemName") LIKE UPPER(?)`;
      } else if (searchType === 'barcode') {
        searchCondition = `T3."BcdCode" LIKE ?`;
      } else if (searchType === 'code') {
        searchCondition = `UPPER(T0."ItemCode") LIKE UPPER(?)`;
      } else {
        return new Response('Invalid searchType', { status: 400 });
      }

      const itemMasterQuery = `
       select
T0."ItemCode",  
          T0."ItemName",  
          T0."FrgnName", 
          T0."InvntryUom" AS "UOM", 
          T1."WhsCode", 
          T1."OnHand", 
          T2."Price" AS "SYSTEM_IQD", 
          T2."Price" * 1500 as "IQD", 
(SELECT "Rate" FROM "NBS_LIVE_NEW".ORTT WHERE "Currency" ='IQD' AND "RateDate"='13.01.2025') * T2. "Price" "Price" ,
          T3."BcdCode" ,  
          TO_DECIMAL (T1."OnHand" - T1."IsCommited") as Qty 
        FROM "NBS_LIVE_NEW"."OITM" T0 
        LEFT JOIN "NBS_LIVE_NEW"."OITW" T1 ON T0."ItemCode" = T1."ItemCode" AND T1."WhsCode" != 12 
        LEFT JOIN "NBS_LIVE_NEW"."Price" T2 ON T2."ItemCode" = T0."ItemCode" AND T2."UomName" = T0."InvntryUom" 
        LEFT JOIN "NBS_LIVE_NEW"."OBCD" T3 ON T3."ItemCode" = T0."ItemCode" AND T3."UomEntry" = T0."IUoMEntry" 
        WHERE T1."OnHand" <> 0 
          AND T2."Price" <> 0 
          AND ${searchCondition} 
        LIMIT 50;
      `;

      const params = [`%${query}%`];
      const itemData = await fetchData(itemMasterQuery, params);
      return new Response(JSON.stringify(itemData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else if (type === 'business-partners') {
      // Handle customer search
      const businessPartnerQuery = `
        SELECT T0."CardCode", T0."CardName"
        FROM "NBS_LIVE_NEW"."OCRD" T0
        WHERE T0."CardType" = 'C' AND UPPER(T0."CardName") LIKE UPPER(?)
        LIMIT 50;
      `;
      const params = [`%${query}%`];
      const bpData = await fetchData(businessPartnerQuery, params);
      return new Response(JSON.stringify(bpData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      return new Response('Invalid query type', { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return new Response('Error fetching data', { status: 500 });
  }
}
