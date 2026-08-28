async function testSnapTrace() {
  const response = await fetch('http://localhost:3000/api/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      const API_KEY = process.env.NEXT_PUBLIC_SNAPTRACE_API_KEY;
      errorMsg: 'Test Crash: NullPointerException in checkout module',
      stackTrace: 'Error at checkout.js:42:15\n at processQueue (async.js:12)'
    }),
  });

  const data = await response.json();
  console.log('Response from SnapTrace API:', data);
}

testSnapTrace();