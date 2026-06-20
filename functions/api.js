// functions/api.js
// Cloudflare Pages Function — runs server-side, key never reaches the browser.
// Available at: https://your-project.pages.dev/api

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400, headers: corsHeaders });
    }

    const GOOGLE_API_KEY = env.GOOGLE_API_KEY;

    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Server not configured: missing GOOGLE_API_KEY' }), { status: 500, headers: corsHeaders });
    }

    // Convert chat history to Gemini's format
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: 'You are CodeQuestLog AI, the smart in-site assistant for CodeQuestLog, a gaming website. Be helpful, concise, friendly, and a little playful — fitting for a gaming community.' }]
          },
          contents: geminiMessages
        })
      }
    );

    const data = await geminiRes.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message || 'Gemini API error' }), { status: 500, headers: corsHeaders });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '(No response)';

    return new Response(JSON.stringify({ reply }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error: ' + err.message }), { status: 500, headers: corsHeaders });
  }
}
