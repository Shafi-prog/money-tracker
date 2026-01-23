/**
 * AI_AccountExtractor.js - Smart account extraction from SMS
 * Uses Grok AI to extract account info from bank messages
 */

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
    
    var prompt = `أنت خبير في استخراج معلومات الحسابات البنكية من الرسائل النصية.

قم بتحليل هذه الرسالة واستخراج معلومات الحساب البنكي:

${smsText}

أعطني JSON بهذا الشكل بالضبط:
{
  "name": "اسم مختصر للحساب (مثال: الراجحي 9767)",
  "type": "بنك أو بطاقة أو محفظة",
  "number": "آخر 4 أرقام من الحساب أو البطاقة",
  "bank": "اسم البنك بالإنجليزية (AlrajhiBank, STC, etc)",
  "aliases": "أسماء بديلة مفصولة بفاصلة (الراجحي,alrajhi,alrajhi bank)",
  "isMine": true,
  "isInternal": false
}

إذا كان الحساب محفظة إلكترونية (STC Pay, Urpay, etc) ضع isInternal: true
رد فقط بـ JSON بدون أي نص إضافي.`;

    var payload = {
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "grok-beta",
      temperature: 0.1
    };
    
    var options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + ENV.GROK_API_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch('https://api.x.ai/v1/chat/completions', options);
    var result = JSON.parse(response.getContentText());
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      var aiResponse = result.choices[0].message.content.trim();
      
      // Extract JSON from response (remove markdown code blocks if present)
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      var accountData = JSON.parse(aiResponse);
      
      return {
        success: true,
        account: accountData,
        rawSMS: smsText
      };
    } else {
      return {
        success: false,
        error: 'فشل الحصول على رد من Grok AI'
      };
    }
    
  } catch (e) {
    Logger.log('Error extracting account from SMS: ' + e);
    return {
      success: false,
      error: 'فشل معالجة الرسالة: ' + e.message
    };
  }
}

/**
 * Public wrapper for account extraction
 */
function SOV1_UI_extractAccountFromSMS_(smsText) {
  return extractAccountFromSMS_(smsText);
}
