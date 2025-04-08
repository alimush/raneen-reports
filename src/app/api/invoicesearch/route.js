import odbc from 'odbc';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const cardCode = searchParams.get('cardCode');

    if (!cardCode) {
      return new Response(JSON.stringify({ error: 'Missing customer code (CardCode)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const connectionString =
      'DRIVER={HDBODBC};SERVERNODE=hanab2:30015;UID=SYSTEM;PWD=B1admin!;CHAR_AS_UTF8=1';

    const connection = await odbc.connect(connectionString);

    const query = `
      SELECT 
        T0."DocNum",
        T0."Comments",
        T0."DocDate",
        T0."CardCode",
        T1."CardName",
        T1."Phone1",
        T1."U_Branch",
        T0."DocTotal",
        T0."PaidToDate"
      FROM "ALUMARAH_LIVE".OINV T0
      INNER JOIN "ALUMARAH_LIVE".OCRD T1 ON T0."CardCode" = T1."CardCode"
      WHERE T0."CANCELED" = 'N'
        AND T0."CardCode" = ?
    `;

    const result = await connection.query(query, [cardCode]);

    await connection.close();

    const cleanedData = result.map(row => ({
      Type: "",
      "رقم التلفون": row.Phone1 || "",
      "رمز الساب": row.CardCode,
      "رقم الساب": row.CardCode,
      "اسم الزبون": row.CardName,
      "الوزارة": "", // غير متوفر
      "الدائرة": "", // غير متوفر
      "رقم الفاتورة": row.DocNum,
      "رقم القسط": row.Comments || "",
      "طريقة الدفع": "", // غير متوفر
      "تاريخ الفاتورة": row.DocDate,
      "تاريخ الاستحقاق": "",
      "مبلغ الفاتورة": row.DocTotal || 0,
      "مبلغ القسط": "",
      "المبلغ المدفوع": row.PaidToDate || 0,
      "المتبقي": (row.DocTotal || 0) - (row.PaidToDate || 0),
    }));

    return new Response(JSON.stringify(cleanedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in /api/invoicebyid:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
