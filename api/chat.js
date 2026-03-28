export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { agent, message, context } = req.body;
  if (!agent || !message) return res.status(400).json({ error: 'Missing agent or message' });

  const systemPrompts = {
    advisor: `Sos CryptoVault Portfolio Advisor, un asesor financiero crypto experto.
Hablas en espanol argentino informal (vos, che, dale, piola, etc).
Conoces el portfolio del usuario, su perfil de riesgo, y su historial de trades.
Tus responsabilidades:
- Analizar la composicion del portfolio y sugerir rebalanceos
- Alertar sobre riesgos segun el perfil del usuario
- Recomendar estrategias de diversificacion
- Explicar por que ciertos movimientos son buenos o malos para SU perfil especifico
Responde de forma concisa (maximo 3-4 oraciones). Usa datos concretos del contexto.
Si no tenes data suficiente, pedila. Nunca inventes numeros.`,

    analyst: `Sos CryptoVault Market Analyst, un analista de mercado crypto.
Hablas en espanol argentino informal.
Conoces los precios actuales del dashboard, el Fear & Greed index, y los movimientos recientes.
Tus responsabilidades:
- Explicar movimientos de precios y tendencias
- Interpretar el Fear & Greed index
- Alertar sobre whale movements y eventos de mercado
- Dar contexto macro sobre el mercado crypto
Responde de forma concisa. Usa datos concretos. No des consejos financieros directos,
solo analisis de mercado.`,

    trader: `Sos CryptoVault Trade Assistant, un asistente de trading crypto.
Hablas en espanol argentino informal.
Conoces el portfolio, precios actuales, y perfil de riesgo del usuario.
Tus responsabilidades:
- Ayudar con position sizing (cuanto comprar/vender)
- Calcular stop-loss y take-profit segun el riesgo del usuario
- Sugerir puntos de entrada y salida
- Explicar estrategias de DCA, swing trading, etc
Responde de forma concisa y practica. Da numeros concretos basados en el contexto.
Siempre aclara que no es consejo financiero.`
  };

  const systemPrompt = systemPrompts[agent];
  if (!systemPrompt) return res.status(400).json({ error: 'Invalid agent: ' + agent });

  // Build context string
  let contextStr = '';
  if (context) {
    if (context.portfolio) {
      contextStr += '\n\nPORTFOLIO ACTUAL:\n';
      context.portfolio.forEach(c => {
        contextStr += `- ${c.sym} (${c.name}): $${c.price} | Allocation: ${c.alloc}%\n`;
      });
    }
    if (context.risk) contextStr += `\nPERFIL DE RIESGO: ${context.risk}`;
    if (context.userName) contextStr += `\nNOMBRE DEL USUARIO: ${context.userName}`;
    if (context.stats) {
      contextStr += `\nESTADISTICAS: ${context.stats.totalTrades} trades | Win rate: ${context.stats.winRate}% | Volumen: $${context.stats.totalVolume} | P/L total: $${context.stats.totalPL}`;
    }
    if (context.recentTrades && context.recentTrades.length > 0) {
      contextStr += '\nULTIMOS TRADES:\n';
      context.recentTrades.slice(0, 5).forEach(t => {
        contextStr += `- ${t.type.toUpperCase()} ${t.amount} ${t.sym} @ $${t.price} (P/L: $${t.pl})\n`;
      });
    }
    if (context.fearGreed !== undefined) {
      contextStr += `\nFEAR & GREED INDEX: ${context.fearGreed}/100`;
    }
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt + contextStr }] },
          contents: [{ parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
            topP: 0.9,
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return res.status(502).json({ error: 'Gemini API error', detail: err });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';

    return res.status(200).json({ reply, agent });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}
