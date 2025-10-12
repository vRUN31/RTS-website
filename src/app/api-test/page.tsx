"use client";
import { useState } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any>({});
  
  async function testEndpoint(name: string, url: string, method = 'GET', body?: any) {
    try {
      const options: any = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const text = await response.text();
      
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { rawResponse: text.substring(0, 500) };
      }
      
      setResults(prev => ({
        ...prev,
        [name]: {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          result
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [name]: {
          error: error.message
        }
      }));
    }
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => testEndpoint('basic-get', '/api/test-basic')}>
          Test /api/test-basic (GET)
        </button>
        <button onClick={() => testEndpoint('basic-post', '/api/test-basic', 'POST', { test: 'data' })}>
          Test /api/test-basic (POST)
        </button>
        <br/><br/>
        <button onClick={() => testEndpoint('test', '/api/test')}>
          Test /api/test
        </button>
        <button onClick={() => testEndpoint('approve-get', '/api/bookings/approve')}>
          Test /api/bookings/approve (GET)
        </button>
        <button onClick={() => testEndpoint('reject-get', '/api/bookings/reject')}>
          Test /api/bookings/reject (GET)
        </button>
        <button onClick={() => testEndpoint('approve-post', '/api/bookings/approve', 'POST', { bookingId: 'test', truckId: 'test' })}>
          Test /api/bookings/approve (POST)
        </button>
        <button onClick={() => testEndpoint('reject-post', '/api/bookings/reject', 'POST', { bookingId: 'test' })}>
          Test /api/bookings/reject (POST)
        </button>
      </div>
      
      <pre style={{ background: '#f5f5f5', padding: '15px', overflow: 'auto' }}>
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );
}