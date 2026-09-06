import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, provider, message, stackTrace, url, environment } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing AI API Key. Please configure it in Settings.' }, { status: 400 });
    }

    const key = apiKey.trim();
    const prompt = `You are an expert crash diagnostic AI engineer for SnapTrace. Analyze this runtime error:

Error Message: ${message || 'Unknown error'}
Environment: ${environment || 'production'}
URL: ${url || 'N/A'}
Stack Trace:
${stackTrace || 'No stack trace provided'}

Provide a structured, developer-friendly diagnosis in 3 clear sections:
1. 💡 Plain English Summary: What broke and why.
2. 🔍 Root Cause Analysis: Exactly which file/line caused it.
3. 🛠️ Proposed Code Patch: Corrected code snippet to fix the issue.`;

    // 1. Google Gemini Provider (Handles all AQ. and AIza keys via server-side HTTPS)
    if (provider === 'gemini' || key.startsWith('AQ') || key.startsWith('AIza') || !key.startsWith('sk-')) {
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
      let outputText = '';
      let lastErr = '';

      for (const model of models) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                },
              }),
            }
          );

          const data = await res.json();

          if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
            outputText = data.candidates[0].content.parts[0].text;
            break;
          } else if (data.error?.message) {
            lastErr = data.error.message;
          }
        } catch (e: any) {
          lastErr = e.message;
        }
      }

      if (!outputText) {
        return NextResponse.json(
          { error: lastErr || 'Google Gemini API key was rejected. Please verify your key at aistudio.google.com.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, analysis: outputText });
    }

    // 2. OpenAI Provider (GPT-4o)
    if (key.startsWith('sk-')) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert software engineer and crash diagnostic AI.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return NextResponse.json(
          { error: data.error?.message || 'OpenAI API key error.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        analysis: data.choices?.[0]?.message?.content || 'No diagnosis generated.',
      });
    }

    return NextResponse.json({ error: 'Unrecognized API key format.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}S