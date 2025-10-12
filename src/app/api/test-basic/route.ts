import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Basic test API endpoint is working',
    timestamp: new Date().toISOString(),
    method: 'GET'
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ 
      message: 'Basic POST test successful',
      timestamp: new Date().toISOString(),
      receivedBody: body,
      method: 'POST'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to parse JSON body',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}