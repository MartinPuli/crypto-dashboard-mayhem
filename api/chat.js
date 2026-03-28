// =========================================================
//  CryptoVault Agent Framework
//  Orchestrator → Routes to specialized agents
//  Each agent uses a different Gemini model by cost/complexity
// =========================================================

const MODELS = {
  orchestrator: 'gemini-2.5-flash-lite',    // Cheapest - just classifies intent
  advisor:      'gemini-2.5-flash',         // Smart - portfolio analysis needs reasoning
  analyst:      'gemini-2.0-flash',         // Mid - market commentary
  trader:       'gemini-2.5-flash',         // Smart - needs math for position sizing
  guard:        'gemini-2.5-flash-lite',    // Cheap - simple wallet check responses
};

const AGENT_PROMPTS = {
  orchestrator: `Sos el orquestador de CryptoVault AI. Tu UNICO trabajo es clasificar el mensaje del usuario en una de estas categorias. Responde SOLO con el JSON, nada mas.

Categorias:
- "guard" → El usuario NO tiene wallet configurada (onboarded=false o no tiene trades ni nombre). Debe configurar su perfil primero.
- "advisor" → Preguntas sobre portfolio, rebalanceo, diversificacion, riesgo, allocation, "como esta mi portfolio", "deberia vender", "conviene comprar mas"
- "analyst" → Preguntas sobre mercado, precios, tendencias, Fear & Greed, noticias, whales, "que onda el mercado", "por que bajo BTC", "como viene ETH"
- "trader" → Preguntas sobre trades especificos, position sizing, stop-loss, take-profit, DCA, "cuanto compro", "a que precio vendo", "donde pongo el stop"
- "general" → Saludos, preguntas sobre la app, o cosas que no encajan en las otras categorias

Responde EXACTAMENTE con este formato JSON:
{"agent":"<categoria>","reason":"<1 linea explicando por que>"}`,

  guard: `Sos el asistente de bienvenida de CryptoVault. El usuario todavia no tiene su wallet/perfil configurado.
Hablas en espanol argentino informal (vos, che, dale, piola).
Tu trabajo es:
- Explicarle que necesita completar el onboarding primero (hacer click en su avatar o recargar la pagina)
- Decirle que configure su nombre, perfil de riesgo, y coins favoritas
- Ser amigable y motivarlo a arrancar
- NO des consejos financieros ni de trading hasta que tenga el perfil armado
Responde en 2-3 oraciones max.`,

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
Hablas en espanol argentino informal (vos, che, dale, piola).
Conoces los precios actuales del dashboard, el Fear & Greed index, y los movimientos recientes.
Tus responsabilidades:
- Explicar movimientos de precios y tendencias
- Interpretar el Fear & Greed index
- Alertar sobre whale movements y eventos de mercado
- Dar contexto macro sobre el mercado crypto
Responde de forma concisa (3-4 oraciones). Usa datos concretos. No des consejos financieros directos, solo analisis.`,

  trader: `Sos CryptoVault Trade Assistant, un asistente de trading crypto.
Hablas en espanol argentino informal (vos, che, dale, piola).
Conoces el portfolio, precios actuales, y perfil de riesgo del usuario.
Tus responsabilidades:
- Ayudar con position sizing (cuanto comprar/vender)
- Calcular stop-loss y take-profit segun el riesgo del usuario
- Sugerir puntos de entrada y salida
- Explicar estrategias de DCA, swing trading, etc
Responde de forma concisa y practica. Da numeros concretos basados en el contexto.
Siempre aclara que no es consejo financiero.`,
};

function buildContextStr(context) {
  if (!context) return '';
  let s = '';
  if (context.portfolio) {
    s += '\n\nPORTFOLIO ACTUAL:\n';
    context.portfolio.forEach(c => {
      s += `- ${c.sym} (${c.name || c.sym}): $${c.price} | Allocation: ${c.alloc}%\n`;
    });
  }
  if (context.risk) s += `\nPERFIL DE RIESGO: ${context.risk}`;
  if (context.userName) s += `\nNOMBRE DEL USUARIO: ${context.userName}`;
  if (context.onboarded !== undefined) s += `\nONBOARDED: ${context.onboarded}`;
  if (context.stats) {
    s += `\nESTADISTICAS: ${context.stats.totalTrades} trades | Win rate: ${context.stats.winRate}% | Volumen: $${context.stats.totalVolume} | P/L total: $${context.stats.totalPL}`;
  }
  if (context.recentTrades && context.recentTrades.length > 0) {
    s += '\nULTIMOS TRADES:\n';
    context.recentTrades.slice(0, 5).forEach(t => {
      s += `- ${t.type.toUpperCase()} ${t.amount} ${t.sym} @ $${t.price} (P/L: $${t.pl})\n`;
    });
  }
  if (context.fearGreed !== undefined) s += `\nFEAR & GREED INDEX: ${context.fearGreed}/100`;
  return s;
}

async function callGemini(model, systemPrompt, userMessage, key, config = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens ?? 300,
        topP: config.topP ?? 0.9,
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('Gemini ' + model + ' error: ' + err);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function userHasWallet(context) {
  if (!context) return false;
  if (context.onboarded === false) return false;
  if (!context.userName && (!context.stats || context.stats.totalTrades === 0)) return false;
  return true;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const contextStr = buildContextStr(context);
  const hasWallet = userHasWallet(context);

  try {
    // ── Step 1: Orchestrator classifies intent (cheapest model) ──
    const orchestratorContext = `ESTADO DEL USUARIO: ${hasWallet ? 'tiene wallet configurada' : 'NO tiene wallet configurada (onboarded=false)'}`;
    const classification = await callGemini(
      MODELS.orchestrator,
      AGENT_PROMPTS.orchestrator + '\n' + orchestratorContext,
      message,
      GEMINI_KEY,
      { temperature: 0.1, maxTokens: 80 }
    );

    // Parse orchestrator response
    let routeTo = 'general';
    let reason = '';
    try {
      const cleaned = classification.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      routeTo = parsed.agent || 'general';
      reason = parsed.reason || '';
    } catch(e) {
      // Fallback: try to extract agent name from text
      if (classification.includes('"advisor"')) routeTo = 'advisor';
      else if (classification.includes('"analyst"')) routeTo = 'analyst';
      else if (classification.includes('"trader"')) routeTo = 'trader';
      else if (classification.includes('"guard"')) routeTo = 'guard';
    }

    // ── Step 2: Guard check - no wallet = no agents ──
    if (!hasWallet && routeTo !== 'general') {
      routeTo = 'guard';
    }

    // ── Step 3: Route to specialized agent (each with its own model) ──
    let reply;
    const model = MODELS[routeTo] || MODELS.analyst;
    const prompt = AGENT_PROMPTS[routeTo] || AGENT_PROMPTS.analyst;

    if (routeTo === 'general') {
      // Simple general response with cheapest model
      reply = await callGemini(
        MODELS.orchestrator,
        `Sos CryptoVault AI Assistant. Hablas en espanol argentino informal. Responde brevemente (1-2 oraciones). Si el usuario saluda, saludalo y decile que puede preguntarte sobre su portfolio, mercado, o trades.`,
        message,
        GEMINI_KEY,
        { temperature: 0.8, maxTokens: 100 }
      );
    } else {
      reply = await callGemini(model, prompt + contextStr, message, GEMINI_KEY);
    }

    return res.status(200).json({
      reply: reply || 'No pude procesar tu mensaje.',
      agent: routeTo,
      reason,
      model: model,
    });

  } catch (err) {
    console.error('Agent error:', err.message);
    return res.status(500).json({ error: 'Agent error', detail: err.message });
  }
}
