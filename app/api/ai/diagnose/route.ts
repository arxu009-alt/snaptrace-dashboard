import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, provider, message, stackTrace, url, environment } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing AI API Key. Please configure it in Settings.' },
        { status: 400 }
      );
    }

    const key = String(apiKey).trim();
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

    // 1. Groq Free API Support (Fast & 100% Free)
    if (key.startsWith('gsk_')) {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an expert software engineer and crash diagnostic AI.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        return NextResponse.json({ success: true, analysis: data.choices[0].message.content });
      }
    }

    // 2. OpenAI Provider (sk-...)
    if (key.startsWith('sk-') && !key.startsWith('sk-ant-')) {
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
      if (res.ok && data.choices?.[0]?.message?.content) {
        return NextResponse.json({ success: true, analysis: data.choices[0].message.content });
      }
    }

    // 3. Google Gemini Provider (Handles all AQ. and AIza keys with 2026 models)
    let candidateModels = [
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-8b',
    ];

    // Query Google to discover all active models on this key
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      const listData = await listRes.json();
      if (listData.models && Array.isArray(listData.models)) {
        const activeModels = listData.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''));

        if (activeModels.length > 0) {
          candidateModels = Array.from(new Set([...candidateModels, ...activeModels]));
        }
      }
    } catch (e) {
      // Use standard candidates
    }

    let lastError = '';

    for (const model of candidateModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        const data = await res.json();

        if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return NextResponse.json({
            success: true,
            analysis: data.candidates[0].content.parts[0].text,
          });
        } else if (data.error?.message) {
          lastError = data.error.message;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return NextResponse.json(
      { error: lastError || 'Google Gemini could not process the key. Please verify your key in Google AI Studio.' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}