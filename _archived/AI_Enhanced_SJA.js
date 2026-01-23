/**
 * ============================================
 * SJA-V1 | Enhanced AI Parser
 * ============================================
 * 
 * تحسين محرك AI لفهم الرسائل البنكية المختلفة
 * مع دعم جميع البنوك السعودية
 */

// ================================
// استخراج البيانات من أنماط مختلفة
// ================================

function SJA_parseEnhancedSMS(smsText) {
  Logger.log('🔍 تحليل الرسالة المحسّن...');
  
  var result = {
    amount: 0,
    merchant: '',
    category: '',
    type: '',
    currency: 'SAR',
    account: '',
    date: '',
    isIncoming: false,
    confidence: 0
  };
  
  // 1. تحليل النمط الخاص
  var pattern = SJA_analyzeMessage(smsText);
  
  // إذا كان النمط IGNORE، أرجع null
  if (pattern.treatment === 'IGNORE') {
    Logger.log('⏭️ تجاهل الرسالة: ' + pattern.type);
    return null;
  }
  
  result.type = pattern.category || 'مشتريات';
  result.treatment = pattern.treatment;
  
  // 2. استخراج المبلغ
  result.amount = extractAmount_(smsText);
  
  // 3. استخراج التاجر/الجهة
  result.merchant = extractMerchant_(smsText);
  
  // 4. استخراج العملة
  result.currency = extractCurrency_(smsText);
  
  // 5. تحديد الاتجاه (وارد/صادر)
  if (pattern.treatment === 'TRANSFER_IN' || smsText.indexOf('استرجاع') !== -1 || smsText.indexOf('حوالة وارده') !== -1) {
    result.isIncoming = true;
    result.amount = Math.abs(result.amount);
  } else if (pattern.treatment === 'TRANSFER_OUT') {
    result.isIncoming = false;
    result.amount = -Math.abs(result.amount);
  } else {
    // مصروفات عادية
    result.isIncoming = false;
    result.amount = Math.abs(result.amount);
  }
  
  // 6. التصنيف
  result.category = classifyByMerchant_(result.merchant, smsText);
  
  result.confidence = 0.85;
  
  Logger.log('✅ النتيجة: ' + JSON.stringify(result));
  
  return result;
}

// ================================
// استخراج المبلغ (محسّن)
// ================================

function extractAmount_(text) {
  // الأنماط المختلفة للمبلغ:
  // - بـ:8 SAR
  // - Amount: 227.57 USD
  // - مبلغ: SAR 239.00
  // - بـSAR 300
  // - SAR 1,723.57
  
  var patterns = [
    /بـ:?\s*([\d,\.]+)\s*(SAR|USD|KWD|ريال|ر\.س)/i,
    /مبلغ:?\s*([\d,\.]+)\s*(SAR|USD|KWD|ريال|ر\.س)/i,
    /Amount:?\s*([\d,\.]+)\s*(SAR|USD|KWD|ريال|ر\.س)/i,
    /(SAR|USD|KWD)\s*([\d,\.]+)/i,
    /([\d,\.]+)\s*(SAR|USD|KWD|ريال|ر\.س)/i
  ];
  
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) {
      var amount = match[1] || match[2];
      // إزالة الفواصل
      amount = amount.replace(/,/g, '');
      return parseFloat(amount) || 0;
    }
  }
  
  return 0;
}

// ================================
// استخراج التاجر (محسّن)
// ================================

function extractMerchant_(text) {
  // الأنماط:
  // - من:LMSAT KHOZAM
  // - Transaction: Upwork
  // - من ZAWYAT ALSAER
  // - لدى: PANDA RETAIL
  // - At SAUDI ELECTRICITY
  // - لـ3512;محمد المطيري
  
  var patterns = [
    /من:([^\n]+)/i,
    /من\s+([A-Z\s]+)/i,
    /لدى:?\s*([^\n]+)/i,
    /At\s+([^\n]+)/i,
    /Transaction:\s*([^\n]+)/i,
    /لـ\d+;([^\n]+)/i,
    /Website or store\s*:\s*([^\n]+)/i
  ];
  
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match && match[1]) {
      var merchant = match[1].trim();
      // تنظيف
      merchant = merchant.replace(/\s{2,}/g, ' ');
      merchant = merchant.substring(0, 100); // حد أقصى 100 حرف
      return merchant;
    }
  }
  
  return 'غير محدد';
}

// ================================
// استخراج العملة
// ================================

function extractCurrency_(text) {
  if (text.indexOf('USD') !== -1) return 'USD';
  if (text.indexOf('KWD') !== -1) return 'KWD';
  if (text.indexOf('KES') !== -1) return 'KES';
  return 'SAR';
}

// ================================
// التصنيف بناءً على التاجر
// ================================

function classifyByMerchant_(merchant, fullText) {
  var lowerMerchant = merchant.toLowerCase();
  var lowerText = fullText.toLowerCase();
  
  // مطاعم
  if (lowerMerchant.indexOf('starbucks') !== -1 || 
      lowerMerchant.indexOf('mcdonald') !== -1 ||
      lowerMerchant.indexOf('kfc') !== -1 ||
      lowerMerchant.indexOf('pizza') !== -1) {
    return 'مطاعم';
  }
  
  // مواد غذائية
  if (lowerMerchant.indexOf('panda') !== -1 || 
      lowerMerchant.indexOf('carrefour') !== -1 ||
      lowerMerchant.indexOf('tamimi') !== -1 ||
      lowerMerchant.indexOf('danube') !== -1) {
    return 'مواد غذائية';
  }
  
  // فواتير
  if (lowerMerchant.indexOf('electricity') !== -1 || 
      lowerMerchant.indexOf('كهرباء') !== -1 ||
      lowerMerchant.indexOf('jawwy') !== -1 ||
      lowerMerchant.indexOf('stc') !== -1 ||
      lowerMerchant.indexOf('mobily') !== -1) {
    return 'فواتير';
  }
  
  // تقنية
  if (lowerMerchant.indexOf('apple') !== -1 || 
      lowerMerchant.indexOf('amazon') !== -1 ||
      lowerMerchant.indexOf('google') !== -1) {
    return 'تقنية';
  }
  
  // مواصلات
  if (lowerMerchant.indexOf('uber') !== -1 || 
      lowerMerchant.indexOf('careem') !== -1 ||
      lowerMerchant.indexOf('knpc') !== -1) {
    return 'مواصلات';
  }
  
  // أعمال حرة (Upwork)
  if (lowerMerchant.indexOf('upwork') !== -1) {
    return 'دخل - أعمال حرة';
  }
  
  // حوالات خيرية
  if (lowerMerchant.indexOf('لبنات') !== -1 || 
      lowerMerchant.indexOf('خيري') !== -1) {
    return 'تبرعات';
  }
  
  // تحويلات شخصية
  if (lowerText.indexOf('حوالة') !== -1) {
    return 'حوالات';
  }
  
  // محافظ رقمية
  if (lowerMerchant.indexOf('tiqmo') !== -1) {
    return 'محافظ رقمية';
  }
  
  return 'أخرى';
}

// ================================
// دمج مع AI (Groq/Gemini)
// ================================

function SJA_hybridParser(smsText) {
  Logger.log('🤖 بدء Hybrid Parser...');
  
  // 1. محاولة التحليل المحلي أولاً
  var localResult = SJA_parseEnhancedSMS(smsText);
  
  // إذا كان IGNORE، أرجع null
  if (!localResult) {
    return null;
  }
  
  // 2. إذا كان التحليل المحلي ضعيف، استخدم AI
  if (localResult.confidence < 0.7 || !localResult.amount) {
    Logger.log('📡 استدعاء AI للمساعدة...');
    
    // استدعاء Groq/Gemini
    var aiResult = callAiHybridV120(smsText);
    
    if (aiResult && aiResult.amount) {
      // دمج النتائج
      localResult.amount = aiResult.amount || localResult.amount;
      localResult.merchant = aiResult.merchant || localResult.merchant;
      localResult.category = aiResult.category || localResult.category;
      localResult.confidence = 0.95;
    }
  }
  
  Logger.log('✅ Hybrid Result: ' + JSON.stringify(localResult));
  
  return localResult;
}

// ================================
// تحديث Flow لاستخدام Parser المحسّن
// ================================

function executeUniversalFlowSJA(smsText, source, destChatId, userId) {
  var ss = _ss();
  
  try {
    Logger.log('🚀 بدء Flow SJA...');
    
    // 1. كشف الحساب
    var account = null;
    if (typeof SJA_detectAccountFromSMS === 'function') {
      account = SJA_detectAccountFromSMS(smsText);
      
      if (account && account.userId) {
        userId = account.userId;
      }
    }
    
    // 2. تحليل محسّن (Hybrid)
    var ai = SJA_hybridParser(smsText);
    
    // إذا كان null (IGNORE)، توقف
    if (!ai) {
      Logger.log('⏭️ رسالة متجاهلة (OTP, Declined, etc.)');
      return {ok: true, ignored: true, reason: 'IGNORE pattern'};
    }
    
    // 3. إضافة معلومات الحساب
    if (account) {
      ai.account = account.accountId;
      ai.accountType = account.type;
      ai.bankName = account.bankName;
    }
    
    // 4. Fallback إلى USER1
    if (!userId) {
      userId = 'USER1';
    }
    
    // 5. المزامنة
    var sync = syncQuadV1(ai, smsText, source, userId);
    
    // 6. تتبع الحوالات (إذا كانت حوالة)
    if (typeof isTransferTransaction === 'function' && isTransferTransaction(ai.category)) {
      if (typeof recordTransfer === 'function') {
        recordTransfer({
          date: new Date(),
          amount: ai.amount,
          merchant: ai.merchant,
          category: ai.category,
          transactionType: ai.transactionType,
          notes: ai.notes || '',
          transactionId: sync.transactionId || Date.now().toString()
        });
      }
    }
    
    // 7. التقرير
    sendSJAReportV1(ai, sync, source, smsText, destChatId, userId);
    
    return {ok: true, account: account, userId: userId, treatment: ai.treatment};
    
  } catch (err) {
    Logger.log('❌ خطأ في Flow SJA: ' + err);
    return {ok: false, error: err.toString()};
  }
}
