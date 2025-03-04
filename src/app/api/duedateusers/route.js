import odbc from 'odbc';

async function fetchData(query, params = []) {
  const connectionString =
    'DRIVER={HDBODBC};SERVERNODE=hanab2:30015;UID=SYSTEM;PWD=B1admin!;CHAR_AS_UTF8=1';

  const connection = await odbc.connect(connectionString);
  const result = await connection.query(query, params);
  await connection.close();
  return result;
}

export async function GET(req) {
  try {
    // Parse query parameters from the URL
    const { searchParams } = new URL(req.url);
    const dueDate = searchParams.get("dueDate"); // This is 'dueDateTo' in frontend
    const groupName = searchParams.get("groupName");
    const u_paytype = searchParams.get("u_paytype");

    // Build dynamic filter conditions and parameter list
    const filters = [];
    const params = [];

    // Filter by due date (Less than or equal to)
    if (dueDate) {
      filters.push(`a."DueDate" <= ?`);
      params.push(dueDate);
    }

    // Filter by group name if provided and not "all"
    if (groupName && groupName.toLowerCase() !== "all") {
      filters.push(`a."GroupName" = ?`);
      params.push(groupName);
    }

    // Filter by U_paytype if provided
    if (u_paytype) {
      filters.push(`a."U_Paytype" = ?`);
      params.push(u_paytype);
    }

    // Ensure only unpaid invoices are fetched
    filters.push(`a."InsTotal" - a."PaidToDate" <> 0`);
    filters.push(`a."Type" = 'SALE'`);

    // Construct WHERE clause dynamically
    const whereClause = filters.length ? "WHERE " + filters.join(" AND ") : "";

    // Main SQL Query
    const sqlQuery = `
      SELECT   a."Type",
               a."GroupName" "الوزارة",
               a."U_LV1" "الدائرة",
               a."CardCode" "رمز الساب",
               a."CardName" "اسم الزبون",
               a."Phone1" "رقم التلفون",
               a."DocNum" "رقم الساب",
               a."Comments" "رقم الفاتورة",
               a."U_Paytype" "طريقة الدفع",
               a."DocDate" "تاريخ الفاتورة",
               a."DueDate" "تاريخ الاستحقاق",
               a."InstlmntID" "رقم القسط",
               a."DocTotal" "مبلغ الفاتورة",
               a."InsTotal" "مبلغ القسط",
               a."PaidToDate" "المبلغ المدفوع",
               a."InsTotal" - a."PaidToDate" "المتبقي"
      FROM (
        SELECT 'SALE' "Type",
               T3."GroupName",
               T2."U_LV1",
               T2."CardCode",
               T2."CardName",
               T2."Phone1",
               T0."DocNum",
               T0."U_Paytype",
               T0."Comments",
               T0."DocDate",
               T1."DueDate",
               T1."InstlmntID",
               T1."Status",
               T0."DocTotal",
               T1."InsTotal",
               T1."PaidToDate",
               T1."InsTotal" - T1."PaidToDate" "Remain"
        FROM "ALUMARAH_LIVE"."OINV" T0
        INNER JOIN "ALUMARAH_LIVE"."INV6" T1 ON T0."DocEntry" = T1."DocEntry"
        INNER JOIN "ALUMARAH_LIVE"."OCRD" T2 ON T0."CardCode" = T2."CardCode"
        INNER JOIN "ALUMARAH_LIVE"."OCRG" T3 ON T2."GroupCode" = T3."GroupCode"
        WHERE T0."CANCELED" = 'N' AND T0."U_Branch" IN (2)
        
        UNION ALL
        
        SELECT 'RETURN',
               T3."GroupName",
               T2."U_LV1",
               T2."CardCode",
               T2."CardName",
               T2."Phone1",
               T0."DocNum",
               T0."U_Paytype",
               T0."Comments",
               T0."DocDate",
               T1."DueDate",
               T1."InstlmntID",
               T1."Status",
               T0."DocTotal" * -1,
               T1."InsTotal" * -1,
               T1."PaidToDate" * -1,
               (T1."InsTotal" - T1."PaidToDate") * -1 "Remain"
        FROM "ALUMARAH_LIVE"."ORIN" T0
        INNER JOIN "ALUMARAH_LIVE"."RIN6" T1 ON T0."DocEntry" = T1."DocEntry"
        INNER JOIN "ALUMARAH_LIVE"."OCRD" T2 ON T0."CardCode" = T2."CardCode"
        INNER JOIN "ALUMARAH_LIVE"."OCRG" T3 ON T2."GroupCode" = T3."GroupCode"
        WHERE T0."CANCELED" = 'N' AND T0."U_Branch" NOT IN (2)
        
        UNION ALL
        
        SELECT 'Incoming',
               T2."GroupName",
               T1."U_LV1",
               T1."CardCode",
               T1."CardName",
               T1."Phone1",
               T0."DocNum",
               '',
               T0."Comments",
               T0."DocDate",
               T0."DocDate" "DueDate",
               '0' "InstlmntID",
               'O' "Status",
               '0' "DocTotal",
               '0' "InsTotal",
               '0' "PaidToDate",
               T0."CashSum" * -1 "Remain"
        FROM "ALUMARAH_LIVE"."ORCT" T0
        INNER JOIN "ALUMARAH_LIVE"."OCRD" T1 ON T1."CardCode" = T0."CardCode"
        INNER JOIN "ALUMARAH_LIVE"."OCRG" T2 ON T1."GroupCode" = T2."GroupCode"
        WHERE T0."Canceled" = 'N'
          AND T0."DocType" = 'C'
          AND T1."U_Branch" NOT IN (2)
          AND T0."DocEntry" NOT IN (
            SELECT T1."SrcObjAbs"
            FROM "ALUMARAH_LIVE"."OITR" T0
            INNER JOIN "ALUMARAH_LIVE"."ITR1" T1 ON T0."ReconNum" = T1."ReconNum"
            WHERE T0."IsCard" = 'C'
              AND T1."ShortName" LIKE 'CUS%%'
              AND T1."SrcObjTyp" = 24
              AND T0."Canceled" = 'N'
          )
      ) AS a
      ${whereClause}
    `;

    const result = await fetchData(sqlQuery, params);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    return new Response('Error fetching data', { status: 500 });
  }
}
