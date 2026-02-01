/********** EnhancedParser.js — Advanced SMS Parsing (Shafi Almutiry) **********/

/**
 * Extract transaction date from SMS content (not system timestamp)
 */
function parseSmsDate_(text) {
  var now = new Date();
  
  // Pattern 1: Arabic format "بتاريخ 22/01/2026 الساعة 10:30"
  var m1 = text.match(/بتاريخ\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s*(?:الساعة|في)\s*(\d{1,2}):(\d{2})/i);
  if (m1) {
    return new Date(parseInt(m1[3]), parseInt(m1[2]) - 1, parseInt(m1[1]), parseInt(m1[4]), parseInt(m1[5]));
  }
  
  // Pattern 2: "22 يناير 2026 الساعة 10:30"
  var m2 = text.match(/(\d{1,2})\s+(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s+(\d{4})\s+(?:الساعة)?\s*(\d{1,2}):(\d{2})/i);
  if (m2) {
    var arMonths = {
      'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5,
      'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11
    };
    return new Date(parseInt(m2[3]), arMonths[m2[2]], parseInt(m2[1]), parseInt(m2[4]), parseInt(m2[5]));
  }
  
  // Pattern 3: English format "22-Jan-2026 10:30 AM"
  var m3 = text.match(/(\d{1,2})-(\w{3})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (m3) {
    var enMonths = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    var hour = parseInt(m3[4]);
    if (m3[6]) {
      if (m3[6].toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (m3[6].toUpperCase() === 'AM' && hour === 12) hour = 0;
    }
    return new Date(parseInt(m3[3]), enMonths[m3[2]], parseInt(m3[1]), hour, parseInt(m3[5]));
  }
  
  // Pattern 4: ISO format "2026-01-22T10:30:00"
  var m4 = text.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (m4) {
    return new Date(parseInt(m4[1]), parseInt(m4[2]) - 1, parseInt(m4[3]), parseInt(m4[4]), parseInt(m4[5]));
  }
  
  // Pattern 5: Date only "22/01/2026" (assume current time)
  var m5 = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m5) {
    return new Date(parseInt(m5[3]), parseInt(m5[2]) - 1, parseInt(m5[1]), now.getHours(), now.getMinutes());
  }
  
  // Pattern 6: Relative time "منذ 5 دقائق" or "قبل 2 ساعة"
  var m6 = text.match(/(?:منذ|قبل)\s+(\d+)\s+(ثانية|ثواني|دقيقة|دقائق|ساعة|ساعات|يوم|أيام)/i);
  if (m6) {
    var offset = parseInt(m6[1]);
    var unit = m6[2];
    var ms = 0;
    
    if (unit.includes('ثانية')) ms = offset * 1000;
    else if (unit.includes('دقيقة')) ms = offset * 60 * 1000;
    else if (unit.includes('ساعة')) ms = offset * 60 * 60 * 1000;
    else if (unit.includes('يوم')) ms = offset * 24 * 60 * 60 * 1000;
    
    return new Date(now.getTime() - ms);
  }
  
  // Pattern 7: Time only "10:30" (assume today)
  var m7 = text.match(/(?:في|الساعة)\s*(\d{1,2}):(\d{2})/i);
  if (m7) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(m7[1]), parseInt(m7[2]));
  }
  
  // Fallback: Use current time
  return now;
}

/**
 * Extract Available Balance from SMS
 */
function extractBalance_(text) {
  var t = String(text || '').replace(/\s+/g, ' ');
  // Pattern: "Available Balance SAR 123.45" or "الرصيد 123.45"
  var m = t.match(/(?:Available Balance|Balance|الرصيد|رصيد)(?:\s*:)?\s*(?:SAR|ر\.س|ريال)?\s*(\d[\d,\.]*)/i);
  if (m) {
    return Number(m[1].replace(/,/g, ''));
  }
  return null;
}

/**
 * Detect bank name from SMS sender or content
 */
function detectBank_(text, senderInfo) {
  var t = (text + ' ' + (senderInfo || '')).toLowerCase();
  
  // High Priority / Digital Banks
  if (/D360|d360/i.test(t)) return 'D360';
  if (/Tiqmo|تيقمو|tgmo/i.test(t)) return 'Tiqmo';
  if (/stc\s*bank|بنك\s*stc|بنك\s*الاتصالات/i.test(t)) return 'STC Bank';
  if (/saib|البنك\s*السعودي\s*للاستثمار/i.test(t)) return 'SAIB';

  // Saudi Banks
  if (/alrajhi|الراجحي|مصرف الراجحي|al-rajhi/i.test(t)) return 'الراجحي';
  if (/alinma|الإنماء|مصرف الإنماء/i.test(t)) return 'الإنماء';
  if (/alahli|الأهلي|ncb|national commercial/i.test(t)) return 'الأهلي';
  if (/riyadbank|الرياض|riyad bank/i.test(t)) return 'الرياض';
  if (/bsf|البلاد|albilad/i.test(t)) return 'البلاد';
  if (/sab|ساب|saudibritish|السعودي البريطاني/i.test(t)) return 'ساب';
  if (/samba|سامبا/i.test(t)) return 'سامبا';
  if (/anb|العربي الوطني|arab national/i.test(t)) return 'العربي الوطني';
  if (/jazira|الجزيرة|bank aljazira/i.test(t)) return 'الجزيرة';
  if (/sabb|السعودي الهولندي|saudi hollandi/i.test(t)) return 'السعودي الهولندي';
  if (/baj|بنك الاستثمار|investcorp/i.test(t)) return 'الاستثمار';
  if (/albilad|البلاد/i.test(t)) return 'البلاد';
  if (/aaal|الأول|al awwal/i.test(t)) return 'الأول';
  
  // International Banks in Saudi
  if (/citi|سيتي/i.test(t)) return 'سيتي بنك';
  if (/hsbc/i.test(t)) return 'HSBC';
  if (/deutsche|دويتشه/i.test(t)) return 'دويتشه بنك';
  
  // Payment Processors
  if (/stc\s*pay|stcpay/i.test(t)) return 'STC Pay';
  if (/mada|مدى/i.test(t)) return 'مدى';
  if (/apple\s*pay|applepay/i.test(t)) return 'Apple Pay';
  if (/paypal/i.test(t)) return 'PayPal';
  
  return 'غير محدد';
}

/**
 * Identify user's own accounts vs merchant accounts
 */
function identifyAccounts_(text, knownAccounts) {
  var ownAccounts = (knownAccounts || ENV.OWN_ACCOUNTS || '').split(',').map(function(a) {
    return a.trim();
  }).filter(Boolean);
  
  var result = {
    userAccount: '',
    merchantAccount: '',
    userCard: '',
    merchantCard: ''
  };
  
  // Extract all account numbers from text
  var allAccounts = [];
  var accountMatches = text.match(/(?:حساب|account|acc|رقم)\s*[:#]?\s*(\d{4,})/gi);
  if (accountMatches) {
    accountMatches.forEach(function(m) {
      var num = m.match(/(\d{4,})/);
      if (num) allAccounts.push(num[1]);
    });
  }
  
  // Extract all card numbers
  var allCards = [];
  var cardMatches = text.match(/(?:بطاقة|بطاقه|card|كارت)\s*[:#]?\s*(\d{4,})/gi);
  if (cardMatches) {
    cardMatches.forEach(function(m) {
      var num = m.match(/(\d{4,})/);
      if (num) allCards.push(num[1]);
    });
  }
  
  // Identify user's vs merchant's
  allAccounts.forEach(function(acc) {
    if (ownAccounts.indexOf(acc) >= 0 || ownAccounts.indexOf(acc.slice(-4)) >= 0) {
      result.userAccount = acc;
    } else {
      result.merchantAccount = acc;
    }
  });
  
  allCards.forEach(function(card) {
    if (ownAccounts.indexOf(card.slice(-4)) >= 0) {
      result.userCard = card;
    } else {
      result.merchantCard = card;
    }
  });
  
  // If only one account found and it's not in known list, check context
  if (allAccounts.length === 1 && !result.userAccount) {
    var isOutgoing = /خصم|صادر|شراء|سحب|pos/i.test(text);
    var isIncoming = /وارد|إيداع|استلام|راتب/i.test(text);
    
    if (isOutgoing) {
      result.userAccount = allAccounts[0]; // Debit from user account
    } else if (isIncoming) {
      result.merchantAccount = allAccounts[0]; // Credit from merchant
    }
  }
  
  return result;
}

/**
 * Enhanced AI call with context
 */
function callAiHybridEnhanced(text, context) {
  context = context || {};
  var knownAccounts = context.knownAccounts || ENV.OWN_ACCOUNTS || '';
  var smsDate = parseSmsDate_(text);
  var bank = detectBank_(text, context.sender);
  var accounts = identifyAccounts_(text, knownAccounts);
  var extractedBalance = extractBalance_(text);
  
  // Get base AI result
  var ai = classifyWithAI(text);
  
  // Enhance with parsed data
  ai.transactionDate = smsDate;
  ai.bank = bank;
  ai.userAccount = accounts.userAccount || ai.accNum;
  ai.merchantAccount = accounts.merchantAccount;
  ai.userCard = accounts.userCard || ai.cardNum;
  ai.merchantCard = accounts.merchantCard;
  
  if (extractedBalance !== null) {
      ai.currentBalance = extractedBalance;
  }
  
  // Apply classifier with enhanced data
  ai = applyClassifierMap_(text, ai);
  
  return ai;
}

/**
 * Improved SMS prompt for AI with known context
 */
function buildEnhancedPrompt_(text, knownAccounts) {
  var accountList = (knownAccounts || ENV.OWN_ACCOUNTS || '').replace(/,/g, ', ');
  
  return `You are an expert Saudi Arabian banking SMS parser.

KNOWN USER ACCOUNTS: [${accountList}]

CRITICAL RULES:
1. If account matches user's accounts → userAccount
2. Any OTHER account → merchantAccount  
3. Extract ORIGINAL date/time from SMS text (not current time)
4. Detect bank name from sender or keywords
5. وارد/إيداع/استلام = isIncoming:true
6. خصم/صادر/شراء = isIncoming:false
7. Currency: ريال=SAR, دولار=USD, يورو=EUR

BANK DETECTION:
- الراجحي/AlRajhi → "الراجحي"
- الإنماء/Alinma → "الإنماء"
- الأهلي/AlAhli → "الأهلي"
- الرياض/Riyadbank → "الرياض"

SMS TEXT:
"""
${text}
"""

Return ONLY valid JSON:
{
  "merchant": "string",
  "amount": number,
  "currency": "SAR",
  "category": "string", 
  "type": "string",
  "isIncoming": boolean,
  "userAccount": "user's account if found",
  "merchantAccount": "other party's account",
  "cardNum": "card number if found",
  "bank": "detected bank name",
  "transactionDate": "ISO8601 from SMS or null",
  "confidence": 0.0-1.0
}`;
}

/**
 * Test function for date parsing
 */
function TEST_DATE_PARSING() {
  var tests = [
    'بتاريخ 22/01/2026 الساعة 10:30 خصم 500 ريال',
    '15 يناير 2026 الساعة 14:45 تحويل',
    '22-Jan-2026 10:30 AM Purchase at Store',
    'منذ 5 دقائق تم الخصم',
    'في الساعة 10:30 تحويل وارد'
  ];
  
  tests.forEach(function(test) {
    var date = parseSmsDate_(test);
    Logger.log('Input: ' + test);
    Logger.log('Parsed: ' + date.toISOString());
    Logger.log('---');
  });
}

/**
 * Test function for bank detection
 */
function TEST_BANK_DETECTION() {
  var tests = [
    'AlRajhi: تم خصم 500 ريال',
    'الراجحي مصرف: عملية شراء',
    'Alinma Bank: Transfer completed',
    'من: الإنماء بنك',
    'STC Pay: Payment received'
  ];
  
  tests.forEach(function(test) {
    var bank = detectBank_(test);
    Logger.log('Input: ' + test);
    Logger.log('Bank: ' + bank);
    Logger.log('---');
  });
}

/**
 * Test function for account identification
 */
function TEST_ACCOUNT_IDENTIFICATION() {
  // Set test accounts
  PropertiesService.getScriptProperties().setProperty('OWN_ACCOUNTS', '1234,5678,9999');
  
  var tests = [
    'خصم من حساب 1234 إلى حساب 4444',
    'تحويل وارد إلى حساب 5678 من 3333',
    'شراء ببطاقة 9999 لدى متجر'
  ];
  
  tests.forEach(function(test) {
    var result = identifyAccounts_(test);
    Logger.log('Input: ' + test);
    Logger.log('User Account: ' + result.userAccount);
    Logger.log('Merchant Account: ' + result.merchantAccount);
    Logger.log('---');
  });
}
