/********** SJA-V1 | AI.js – Hybrid AI Engine (Shafi Jahz Almutiry) **********/

function classifyWithAI(text) {
  var seed = preParseFallback(text);

  if (ENV.GROQ_KEY) {
    try {
      var url1 = 'https://api.groq.com/openai/v1/chat/completions';
      var options1 = {
        method: 'post',
        headers: { Authorization: 'Bearer ' + ENV.GROQ_KEY, 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Extract Arabic banking transaction fields. Return strict JSON ONLY.' },
            { role: 'user', content: 'النص: """' + text + '""" المطلوب JSON: {"merchant":"string","amount":"number","currency":"SAR","category":"string","type":"string","isIncoming":"boolean","accNum":"string","cardNum":"string"}' }
          ],
          response_format: { type: 'json_object' },
          temperature: 0
        })
      };
      var resp1 = UrlFetchApp.fetch(url1, options1);
      var content = JSON.parse(resp1.getContentText()).choices[0].message.content;
      var parsed = JSON.parse(content);
      return sanitizeAI(parsed, seed);
    } catch (e1) {
      // ✅ تسجيل الخطأ بدون كشف مفتاح API
      Logger.log('Groq AI error: ' + (e1.message || 'Unknown error').replace(/Bearer\s+[\w-]+/gi, 'Bearer [HIDDEN]'));
    }
  }

  if (ENV.GEMINI_KEY) {
    try {
      var url2 = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(ENV.GEMINI_KEY);
      var prompt = 'حلل النص المصرفي التالي واستخرج JSON بهذه الحقول فقط: {"merchant":"string","amount":"number","currency":"SAR","category":"string","type":"string","isIncoming":"boolean","accNum":"string","cardNum":"string"}.\n' +
        'النص: """' + text + '"""';

      var payload2 = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } };
      var resp2 = UrlFetchApp.fetch(url2, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload2) });

      var data = JSON.parse(resp2.getContentText());
      var rawText = (data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) || '{}';

      var m = rawText.match(/\{[\s\S]*\}/);
      var parsed2 = m ? JSON.parse(m[0]) : {};
      return sanitizeAI(parsed2, seed);
    } catch (e2) {
      // ✅ تسجيل الخطأ بدون كشف مفتاح API
      Logger.log('Gemini AI error: ' + (e2.message || 'Unknown error').replace(/key=[\w-]+/gi, 'key=[HIDDEN]'));
    }
  }

  return seed;
}

// Backward compatibility alias
var callAiHybridV120 = classifyWithAI;

function preParseFallback(text) {
  var t = String(text || '').replace(/\s+/g, ' ');

  var amtMatch = t.match(/(\d[\d,\.]*)\s*(SAR|ريال(?:\s*سعودي)?)/i);
  var amt = amtMatch ? Number(String(amtMatch[1]).replace(/[,]/g, '')) : 0;

  var incoming = /(وارد|إيداع|استلام|إضافة)/i.test(t);
  var outgoing = /(خصم|شراء|سحب|رسوم|POS|صادر)/i.test(t);

  var accMatch = t.match(/حساب(?:\s*رقم)?\s*(\d{3,})/i);
  var cardMatch = t.match(/(?:بطاقة|بطاقه|كارت)\s*(\d{3,})/i);

  var merchMatch = t.match(/من\s+([^\s]+)|إلى\s+([^\s]+)/i);
  var merchant = (merchMatch && (merchMatch[1] || merchMatch[2])) ? (merchMatch[1] || merchMatch[2]) : 'غير محدد';

  var cat = 'أخرى', type = 'حوالة';
  if (/(تحويل|حوالة)/i.test(t)) type = 'حوالة';
  else if (/(شراء|POS|متجر|سداد)/i.test(t)) { type = 'مشتريات'; cat = 'مشتريات عامة'; }

  if (incoming) cat = 'حوالات واردة';
  if (outgoing) cat = 'حوالات صادرة';

  return {
    merchant: merchant,
    amount: amt || 0,
    currency: 'SAR',
    category: cat,
    type: type,
    isIncoming: incoming ? true : (outgoing ? false : (amt >= 0)),
    accNum: accMatch ? accMatch[1] : '',
    cardNum: cardMatch ? cardMatch[1] : ''
  };
}

function sanitizeAI(ai, seed) {
  var safe = {};
  for (var k in seed) safe[k] = seed[k];
  for (var k2 in (ai || {})) safe[k2] = ai[k2];

  safe.amount = Number(safe.amount) || 0;
  safe.isIncoming = !!safe.isIncoming;

  safe.merchant = String(safe.merchant || '').slice(0, 100);
  safe.category = String(safe.category || 'أخرى').slice(0, 100);
  safe.type = String(safe.type || 'حوالة').slice(0, 50);
  safe.accNum = String(safe.accNum || '').slice(0, 32);
  safe.cardNum = String(safe.cardNum || '').slice(0, 32);

  return safe;
}

/** AI Diagnostics */
function callAiProbe_(text) {
  var seed = preParseFallback(text);

  if (ENV.GROQ_KEY) {
    try {
      var url1 = 'https://api.groq.com/openai/v1/chat/completions';
      var options1 = {
        method: 'post',
        headers: { Authorization: 'Bearer ' + ENV.GROQ_KEY, 'Content-Type': 'application/json' },
        payload: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'Extract Arabic banking transaction fields. Return strict JSON ONLY.' },
            { role: 'user', content: 'النص: """' + text + '""" المطلوب JSON: {"merchant":"string","amount":"number","currency":"SAR","category":"string","type":"string","isIncoming":"boolean","accNum":"string","cardNum":"string"}' }
          ],
          response_format: { type: 'json_object' },
          temperature: 0
        })
      };

      var resp1 = UrlFetchApp.fetch(url1, options1);
      var content = JSON.parse(resp1.getContentText()).choices[0].message.content;
      var parsed = JSON.parse(content);

      return { ai: sanitizeAI(parsed, seed), engine: 'groq' };
    } catch (e1) { /* ignore */ }
  }

  if (ENV.GEMINI_KEY) {
    try {
      var url2 = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(ENV.GEMINI_KEY);
      var prompt = 'حلل النص المصرفي التالي واستخرج JSON بهذه الحقول فقط: {"merchant":"string","amount":"number","currency":"SAR","category":"string","type":"string","isIncoming":"boolean","accNum":"string","cardNum":"string"}.\n' +
        'النص: """' + text + '"""';

      var payload2 = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } };
      var resp2 = UrlFetchApp.fetch(url2, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload2) });

      var data = JSON.parse(resp2.getContentText());
      var rawText = (data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) || '{}';

      var m = rawText.match(/\{[\s\S]*\}/);
      var parsed2 = m ? JSON.parse(m[0]) : {};

      return { ai: sanitizeAI(parsed2, seed), engine: 'gemini' };
    } catch (e2) { /* ignore */ }
  }

  return { ai: seed, engine: 'fallback' };
}

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNT EXTRACTION FROM SMS (Merged from AI_AccountExtractor.js)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extract account information from SMS using Grok AI
 */
function extractAccountFromSMS_(smsText) {
  try {
    if (!smsText || smsText.trim().length === 0) {
      return { success: false, error: 'لا يوجد نص للمعالجة' };
    }
    
    // Check if Grok API is available
    if (!ENV.GROK_API_KEY) {
      return { success: false, error: 'Grok API key not configured' };
    }
    
    var prompt = 'أنت خبير في استخراج معلومات الحسابات البنكية من الرسائل النصية.\n\n' +
      'قم بتحليل هذه الرسالة واستخراج معلومات الحساب البنكي:\n\n' +
      smsText + '\n\n' +
      'أعطني JSON بهذا الشكل بالضبط:\n' +
      '{\n' +
      '  "name": "اسم مختصر للحساب (مثال: الراجحي 9767)",\n' +
      '  "type": "بنك أو بطاقة أو محفظة",\n' +
      '  "number": "آخر 4 أرقام من الحساب أو البطاقة",\n' +
      '  "bank": "اسم البنك بالإنجليزية (AlrajhiBank, STC, etc)",\n' +
      '  "aliases": "أسماء بديلة مفصولة بفاصلة (الراجحي,alrajhi,alrajhi bank)",\n' +
      '  "isMine": true,\n' +
      '  "isInternal": false\n' +
      '}\n\n' +
      'إذا كان الحساب محفظة إلكترونية (STC Pay, Urpay, etc) ضع isInternal: true\n' +
      'رد فقط بـ JSON بدون أي نص إضافي.';

    var payload = {
      messages: [{ role: "user", content: prompt }],
      model: "grok-beta",
      temperature: 0.1
    };
    
    var options = {
      method: 'POST',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + ENV.GROK_API_KEY },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch('https://api.x.ai/v1/chat/completions', options);
    var result = JSON.parse(response.getContentText());
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      var aiResponse = result.choices[0].message.content.trim();
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      var accountData = JSON.parse(aiResponse);
      return { success: true, account: accountData, rawSMS: smsText };
    } else {
      return { success: false, error: 'فشل الحصول على رد من Grok AI' };
    }
  } catch (e) {
    Logger.log('Error extracting account from SMS: ' + e);
    return { success: false, error: 'فشل معالجة الرسالة: ' + e.message };
  }
}

/** Public wrapper for account extraction */
function SOV1_UI_extractAccountFromSMS_(smsText) {
  return extractAccountFromSMS_(smsText);
}
