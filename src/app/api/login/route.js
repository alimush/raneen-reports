import axios from 'axios';
import https from 'https';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const agent = new https.Agent({  
      rejectUnauthorized: false  // Ignore invalid SSL certificate
    });

    const response = await axios.post(
      // 'https://hanab1:50000/b1s/v1/Login',
      'https://192.168.5.51:50000/b1s/v1/Login',
      {
        UserName: 'root',
        Password: 'B2admin!!',
        CompanyDB: 'NBS_LIVE_NEW',
      },
      { httpsAgent: agent }
    );
    return NextResponse.json({ sessionId: response.data.SessionId });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Failed to login to SAP' }, { status: 500 });
  }
}
