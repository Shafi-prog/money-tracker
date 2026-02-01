/********** SJA-V1 | AI.js – Hybrid AI Engine (Shafi Jahz Almutiry) **********/

function classifyWithAI(text) {
  var seed = preParseFallback(text);

  // 1. High Priority: Grok (x.ai) - The "Logic Mind"
  if (ENV.GROK_API_KEY) {
    try {
      var url0 = 'https://api.x.ai/v1/chat/completions';
      
      // Build known accounts list dynamically from user's Accounts sheet
      var myAccountNames = getMyAccountNamesForAI_();
      
      var options0 = {
        method: 'post',
        headers: { 
          'Authorization': 'Bearer ' + ENV.GROK_API_KEY, 
          'Content-Type': 'application/json' 
        },
        payload: JSON.stringify({
          model: 'grok-3-mini-beta',
          messages: [
            { 
              role: 'system', 
              content: 'You are a Saudi Arabian financial SMS parser. Extract transaction details. Return ONLY valid JSON, no markdown.\n' +
                       'CRITICAL RULES:\n' +
                       '1. If merchant/destination matches these user\'s OWN accounts: [' + myAccountNames + '], set category="حوالة داخلية" and type="تحويل داخلي"\n' +
                       '2. Category must be Arabic from: طعام, وقود, بقالة, تسوق, اتصالات, صحة, نقل, فواتير, ترفيه, سكن, تعليم, سحب نقدي, حوالة داخلية, حوالات واردة, حوالات صادرة, راتب, مشتريات عامة, أخرى\n' +
                       '3. NEVER use POS as category - detect actual category from merchant name\n' +
                       '4. For gas stations: category="وقود" (or "نقل" if "وقود" not allowed), restaurants/cafes: "طعام", supermarkets/تموينات: "طعام" (or "تسوق"), utilities/telecom: "فواتير", ATM/صراف: "سحب نقدي"\n' +
                       '5. BANK FORMAT HINTS (Saudi):\n' +
                       '- Tiqmo: text like "tiqmo=" or "MasterCard **#### Apple Pay" or "Online Purchase Amount"\n' +
                       '- STC Bank: "STC Bank=" or "إضافة أموال" or "رصيد غير كافي" with "البطاقة:"\n' +
                       '- SAIB: "SAIB=" and phrases like "شراء انترنت" or "ECOM Hold"\n' +
                       '- Tamara: installment reminders "دفعة قادمة" or "تأكيد دفعة مقسمة"\n' +
                       '- Transfers: "حوالة داخلية/محلية" or "مصرف:" or "إلى/من" account numbers\n' +
                       'If bank is identifiable, include it in notes like "bank:STC Bank".\n' +
                       '6. SAUDI STORE/CATEGORY HINTS:\n' +
                       '- "SAUDI ELECTRICITY" => فواتير\n' +
                       '- "STC/زين/موبايلي" => فواتير\n' +
                       '- "NAFT/محطة/بنزين" => وقود/نقل\n' +
                       '- "Uber/Careem/Jeeny" => نقل\n' +
                       '- "Cinema/NETFLIX/اشتراك" => ترفيه\n' +
                       '- "صيدلية/Pharmacy" => صحة\n' +
                       '- "جامعة/مدرسة/معهد" => تعليم\n' +
                       '- "إيجار/صيانة" => سكن\n' +
                       'Fields: merchant (string), amount (number, positive), currency (SAR), category (Arabic string), type (string), isIncoming (boolean), accNum (last 4 digits), cardNum (last 4 digits), notes (string).'
            },
            { 
              role: 'user', 
              content: 'Parse this Saudi bank SMS: """' + text + '"""' 
            }
          ],
          temperature: 0.1
        }),
        muteHttpExceptions: true
      };
      
      var resp0 = UrlFetchApp.fetch(url0, options0);
      var json0 = JSON.parse(resp0.getContentText());
      
      if (json0.choices && json0.choices[0] && json0.choices[0].message) {
        var content0 = json0.choices[0].message.content;
        // Clean markdown code blocks if present
        content0 = content0.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        var parsed0 = JSON.parse(content0);
        return sanitizeAI(parsed0, seed);
      }
    } catch (e0) {
      Logger.log('Grok AI error: ' + (e0.message || 'Unknown').replace(/Bearer\s+[\w-]+/gi, 'Bearer [HIDDEN]'));
       // Continue to fallbacks
    }
  }

  // 2. Fallback: Groq (Llama)
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

  var incoming = /(وارد|إيداع|استلام|إضافة|deposit|received)/i.test(t);
  var outgoing = /(خصم|شراء|سحب|رسوم|POS|صادر|paid|purchase)/i.test(t);

  // Enhanced Account Detection
  var accMatch = t.match(/حساب(?:\s*رقم)?\s*(\d{3,})/i);
  var cardMatch = t.match(/(?:بطاقة|بطاقه|كارت)\s*(\d{3,})/i);
  
  // Use known accounts if available
  var ownAccounts = (ENV.OWN_ACCOUNTS || '').split(',').map(function(x){return x.trim();}).filter(Boolean);
  var detectedAcc = accMatch ? accMatch[1] : '';
  
  // If multiple accounts found, or specifically "to account", logic can remain simple context-based for fallback
  // The goal is to provide a "seed" to AI.
  
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
    accNum: detectedAcc,
    cardNum: cardMatch ? cardMatch[1] : '',
    ownAccountsHint: ownAccounts // Hint for debugging
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
    
    // Check if Grok API is available; if not, attempt Gemini fallback (if configured)
    if (!ENV.GROK_API_KEY) {
      if (ENV.GEMINI_KEY) {
        try {
          var url2 = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(ENV.GEMINI_KEY);
          var prompt = 'حلل النص المصرفي التالي واستخرج JSON بهذه الحقول بالضبط: {"name":"string","type":"string","number":"string","bank":"string","aliases":"string","isMine":true,"isInternal":false}. النص: """' + smsText + '"""';
          var payload2 = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } };
          var resp2 = UrlFetchApp.fetch(url2, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload2) });
          var data2 = JSON.parse(resp2.getContentText());
          var rawText = (data2.candidates && data2.candidates[0] && data2.candidates[0].content && data2.candidates[0].content.parts && data2.candidates[0].content.parts[0].text) || '{}';
          var m2 = rawText.match(/\{[\s\S]*\}/);
          var parsed2 = m2 ? JSON.parse(m2[0]) : {};
          // sanitize minimal fields
          var accountData = { name: parsed2.name || parsed2.merchant || '', type: parsed2.type || 'بنك', number: parsed2.number || parsed2.cardNum || '', bank: parsed2.bank || '', aliases: parsed2.aliases || '', isMine: parsed2.isMine === true, isInternal: parsed2.isInternal === true };
          return { success: true, account: accountData, rawSMS: smsText, engine: 'gemini-fallback' };
        } catch (e2) { Logger.log('Gemini fallback error: ' + e2); }
      }
      // Heuristic fallback (regex-based) — basic extraction when AI is unavailable
      try {
        var txt = (smsText || '');
        
        // 0. Quick checks for known ignorable messages
        if (/رمز التحقق|OTP|كود|كلمة مرور|verification code/i.test(txt) && txt.match(/\b\d{4,6}\b/)) {
          return { success: false, error: 'OTP/Temp code detected' };
        }

        // Ignore installment/BNPL providers as accounts
        if (/Tamara|تمارا|Tabby|تابي|Spotii|Madfu|مدفوع|تقصيط|تقسيط|دفعة\s*مقسمة|installment|pay\s*in\s*\d+/i.test(txt)) {
          return { success: false, error: 'Installment/BNPL message (not an account)' };
        }

        // 1. Detect Bank/Entity (expanded from SMS analysis)
        var bank = null;
        if (/^Bank:\s*(.+)/i.test(txt)) {
          bank = RegExp.$1.trim();
        } else {
          var bankMap = {
            'Alrajhi': /Alrajhi|الراجحي|AlRajhi|alrajhibak/i,
            'SNB': /SNB|الأهلي|AlAhli|National Commercial Bank/i,
            'STC Bank': /STC Bank|STC|بنك الاتصالات/i,
            'Tiqmo': /Tiqmo|تيقمو/i,
            'Tamara': /Tamara|تمارا/i,
            'SAIB': /SAIB|السعودي للإستثمار|Saudi Investment Bank/i,
            'SAB': /SAB|ساب|Saudi Awwal Bank|الأول/i,
            'Riyad': /Riyad|الرياض|Bank AlRiyad/i,
            'Alinma': /Alinma|الإنماء|Alinma Bank/i,
            'UrPay': /UrPay|يوربي/i,
            'StcPay': /STC Pay|STCPay/i,
            'Tabby': /Tabby|تابي/i,
            'ALBI': /ALBI/i
          };
          for (var k in bankMap) { if (bankMap[k].test(txt)) { bank = k; break; } }
        }
        if (bank === 'ALBI') bank = 'Alrajhi';
        if (bank === 'STC') bank = 'STC Bank';
        
        // 2. Detect Account/Card Number (Last 4)
        // Order matters: specific labels first, then generic patterns
        var num = null;
        var numPatterns = [
           /Account No\.*:?\s*\**(\d{4})/i,         // Account No.: **9682
           /Card No\.*.*?:?\s*\**(\d{4})/i,         // Card No. (last 4 digit): 0305
           /بطاقة\s*.*?:?\s*\**(\d{4})/i,           // بطاقة ... : 0305
           /البطاقة\s*.*?:?\s*\**(\d{4})/i,         // البطاقة: ***3281
           /من\s*(\d{4})/i,                        // من 9767 (standard Arabic SMS)
           /عبر\s*.*?\**(\d{4})/i,                 // عبر MasterCard **0305
           /Card\s*\**(\d{4})/i,                   // Card **0305
           /\*{2,}(\d{4})\b/,                      // **0305
           /X+(\d{4})\b/i,                         // X3474
           /مدى\s*(\d{4})/i,                       // مدى 3474
           /حساب\s*(\d{4})/i,                      // حساب 9767
           /(\d{4})\s*Apple Pay/i,                 // 0305 Apple Pay
           /تنتهي\s*ب\s*(\d{4})/i                  // تنتهي ب 0305
        ];
        
        for (var i = 0; i < numPatterns.length; i++) {
           var m = txt.match(numPatterns[i]);
           if (m) { num = m[1]; break; }
        }

        if (bank === 'Tamara' && !num) {
          return { success: false, error: 'Tamara installment reminder (not an account)' };
        }
        
        // Secondary fallback for just 4 digits near bank name if still null
        if (!num && bank) {
            var nearBank = txt.match(new RegExp(bank + '.*?(\\d{4})', 'i'));
            if (nearBank) num = nearBank[1];
        }

        // 3. Detect Amount
        var amountMatch = txt.match(/([0-9]+(?:[\.,][0-9]{1,2})?)\s*(SAR|ر\.س|ريال|USD|دولار)/i) || 
                          txt.match(/(?:SAR|ر\.س|ريال|USD|دولار)\s*([0-9]+(?:[\.,][0-9]{1,2})?)/i);
        var amount = amountMatch ? Number(String(amountMatch[1] || amountMatch[2] || '0').replace(',','.')) : 0;

        // 4. Infer Type & IsIncoming
        var isIncoming = false;
        var type = 'purchase';
        
        if (/إيداع|وارد|استلام|deposit|incoming|top-?up|received|salary|راتب/i.test(txt)) {
            type = 'income';
            isIncoming = true;
        } else if (/تحويل|transfer/i.test(txt)) {
            type = 'transfer';
            // Transfers can be incoming or outgoing. Assume outgoing unless "to you" context found
            if (/لـك|إليك|received/i.test(txt)) isIncoming = true;
        } else if (/سحب|صراف|atm|withdrawal/i.test(txt)) {
            type = 'withdrawal';
        } else if (/رصيد غير كافي|declined|insufficient funds/i.test(txt)) {
            type = 'decline';
        }

        // 5. Construct Result — prioritize bank + number as unique key
        var finalName = '';
        if (bank && num) {
            finalName = bank + ' - ' + num;
        } else if (bank) {
            finalName = bank + ' Account';
        } else if (num) {
            finalName = 'Account ' + num;
        } else {
            finalName = "Unknown Account";
        }
        
        var acc = { 
          name: finalName, 
          type: (bank === 'StcPay' || bank === 'UrPay') ? 'محفظة' : 'بنك', 
          number: num || '', 
          bank: bank || '', 
          aliases: '', 
          isMine: true,   // Assumption for personal finance
          isInternal: (bank === 'StcPay' || bank === 'UrPay'), 
          heuristics: true, 
          parsedAmount: amount, 
          parsedType: type, 
          isIncoming: !!isIncoming 
        };
        
        return { success: true, account: acc, rawSMS: smsText, engine: 'heuristic-advanced-v2' };

      } catch (e3) { Logger.log('Heuristic fallback failed: ' + e3); }
      return { success: false, error: 'Grok API key not configured' };
    }
    
    var prompt = 'أنت خبير في استخراج معلومات الحسابات البنكية من الرسائل النصية.\n\n' +
      'قم بتحليل هذه الرسالة واستخراج معلومات الحساب البنكي:\n\n' +
      smsText + '\n\n' +
      'أعطني JSON بهذا الشكل بالضبط:\n' +
      '{\n' +
      '  "name": "اسم مختصر للحساب (مثال: الراجحي 9767)",\n' +
      '  "type": "بنك أو بطاقة أو محفظة",\n' +
      '  "number": "آخر 4 أرقام من الحساب أو البطاقة (4 أرقام بالضبط)",\n' +
      '  "bank": "واحد من: Alrajhi, STC Bank, SAIB, Tiqmo",\n' +
      '  "aliases": "أسماء بديلة مفصولة بفاصلة",\n' +
      '  "isMine": true,\n' +
      '  "isInternal": false\n' +
      '}\n\n' +
      'لا تعتبر MasterCard/Visa/Mada بنكاً. تجاهل رسائل التقسيط/BNPL مثل Tamara أو Tabby (لا تُرجع حساب).\n' +
      'إذا كان الحساب محفظة إلكترونية (STC Pay, Urpay, Tiqmo) ضع isInternal: true\n' +
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

      // Normalize
      var bankRaw = String(accountData.bank || '').trim();
      var nameRaw = String(accountData.name || '').trim();
      var aliasesRaw = String(accountData.aliases || '').trim();
      var numRaw = String(accountData.number || '').trim();

      function normBankFromText(text) {
        if (/الراجحي|Alrajhi|ALBI|AlrajhiBank/i.test(text)) return 'Alrajhi';
        if (/STC Bank|\bSTC\b|بنك الاتصالات/i.test(text)) return 'STC Bank';
        if (/SAIB|ساب|Saudi Investment/i.test(text)) return 'SAIB';
        if (/D360|d360/i.test(text)) return 'D360';
        if (/Tiqmo|تيقمو/i.test(text)) return 'Tiqmo';
        if (/Tamara|تمارا/i.test(text)) return 'Tamara';
        return '';
      }

      var bank = normBankFromText(bankRaw) || normBankFromText(nameRaw) || normBankFromText(aliasesRaw) || normBankFromText(smsText);
      if (/MasterCard|Visa|Mada/i.test(bankRaw)) bank = '';

      var num = numRaw.replace(/\s+/g, '').replace(/^\*+/, '');
      if (/^\d{3}$/.test(num)) {
        var leadZero = smsText.match(/\b0\d{3}\b/);
        if (leadZero) num = leadZero[0];
      }
      if (!/\d{4}/.test(num)) {
        var m = smsText.match(/\*{2,}(\d{4})\b|\b(\d{4})\b/);
        if (m) num = m[1] || m[2] || '';
      }

      if (bank === 'Tamara' || /Tamara|تمارا|Tabby|تابي|Spotii|Madfu|مدفوع|تقصيط|تقسيط|دفعة\s*مقسمة|installment|pay\s*in\s*\d+/i.test(smsText)) {
        return { success: false, error: 'Installment/BNPL message (not an account)' };
      }

      if (!bank || !/\d{4}/.test(num)) {
        return { success: false, error: 'Incomplete account data from Grok' };
      }

      accountData.bank = bank;
      accountData.number = num;
      accountData.name = accountData.name || (bank + ' ' + num);
      accountData.isInternal = false;

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

/**
 * ✅ Get user's OWN account names/aliases for AI prompt
 * Returns comma-separated string of account identifiers
 */
function getMyAccountNamesForAI_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Accounts');
    if (!sh || sh.getLastRow() < 2) {
      // Fallback if no accounts sheet
      return 'SAIB, STC Bank, Tiqmo, D360, الراجحي';
    }
    
    var data = sh.getDataRange().getValues();
    var names = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var name = String(row[0] || '').trim();  // Name column
      var number = String(row[2] || '').trim(); // Number column
      var bank = String(row[3] || '').trim();   // Bank column
      var isMine = String(row[6] || '').toUpperCase(); // isMine column
      var aliases = String(row[8] || '');       // Aliases column
      
      // Only include MY accounts
      if (isMine === 'TRUE') {
        if (name) names.push(name);
        if (bank && names.indexOf(bank) === -1) names.push(bank);
        if (number) names.push(number);
        
        // Add aliases
        if (aliases) {
          var aliasList = aliases.split(',');
          for (var a = 0; a < aliasList.length; a++) {
            var alias = aliasList[a].trim();
            if (alias && names.indexOf(alias) === -1) {
              names.push(alias);
            }
          }
        }
      }
    }
    
    return names.length > 0 ? names.join(', ') : 'SAIB, STC Bank, Tiqmo, D360, الراجحي';
  } catch (e) {
    Logger.log('Error getting account names for AI: ' + e);
    return 'SAIB, STC Bank, Tiqmo, D360, الراجحي';
  }
}
