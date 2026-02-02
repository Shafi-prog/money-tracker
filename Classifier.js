/********** SJA-V1 | Classifier.js – Smart Classification (Shafi Jahz Almutiry) **********/

/**
 * Ensure Classifier_Map sheet exists with proper structure
 */
function ensureClassifierMapExists_() {
  try {
    var ss = _ss();
    var sMap = ss.getSheetByName('Classifier_Map');
    
    if (!sMap) {
      Logger.log('Creating Classifier_Map sheet');
      sMap = ss.insertSheet('Classifier_Map');
      sMap.appendRow(['Merchant Pattern', 'Category', 'Type', 'IsIncoming', 'Account', 'Card']);
      sMap.setFrozenRows(1);
      sMap.getRange('A1:F1').setFontWeight('bold').setBackground('#4CAF50').setFontColor('#FFFFFF');
      
      // Add common Saudi merchants as examples
      sMap.appendRow(['AMAZON', 'تسوق', '', '', '', '']);
      sMap.appendRow(['NOON', 'تسوق', '', '', '', '']);
      sMap.appendRow(['UBER', 'نقل', '', '', '', '']);
      sMap.appendRow(['CAREEM', 'نقل', '', '', '', '']);
      sMap.appendRow(['STARBUCKS', 'طعام', '', '', '', '']);
      sMap.appendRow(['STC', 'فواتير', '', '', '', '']);
      sMap.appendRow(['MOBILY', 'فواتير', '', '', '', '']);
      
      Logger.log('Classifier_Map created with 7 example entries');
    }
    
    return sMap;
  } catch (e) {
    Logger.log('Error ensuring Classifier_Map exists: ' + e);
    return null;
  }
}

function applyClassifierMap_(rawText, ai) {
  try {
    // Ensure sheet exists first
    var sMap = ensureClassifierMapExists_();
    if (!sMap) {
      Logger.log('Classifier_Map not available, skipping classification');
      return applySmartRules_(rawText, ai);
    }
    
    var vals = sMap.getDataRange().getValues();
    var t = normalizeMerchantName_(String(rawText || '')).toLowerCase();
    var m = normalizeMerchantName_(String(ai.merchant || '')).toLowerCase();

    for (var i = 1; i < vals.length; i++) {
      var key = String(vals[i][0] || '').toLowerCase();
      if (!key) continue;

      if (t.indexOf(key) >= 0 || m.indexOf(key) >= 0) {
        if (vals[i][1]) ai.category = vals[i][1];
        if (vals[i][2]) ai.type = vals[i][2];
        if (String(vals[i][3] || '') !== '') ai.isIncoming = String(vals[i][3]).toLowerCase() === 'true';
        if (vals[i][4]) ai.accNum = vals[i][4];
        if (vals[i][5]) ai.cardNum = vals[i][5];
        Logger.log('Classifier match found: ' + key + ' → ' + ai.category);
        break;
      }
    }
  } catch (e) { 
    Logger.log('Error in applyClassifierMap_: ' + e);
  }

  return applySmartRules_(rawText, ai);
}

function updateClassifierMapFromLast_(newCat) {
  try {
    var s1 = _sheet('Sheet1');
    var last = s1.getLastRow();
    if (last < 2) return;

    var merchant = String(s1.getRange(last, 10).getValue() || '').toLowerCase();
    var rawText = String(s1.getRange(last, 13).getValue() || '').toLowerCase();
    var key = merchant || (rawText.split(/\s+/)[0] || '');

    if (!key) return;

    var sMap = _sheet('Classifier_Map');
    var vals = sMap.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0] || '').toLowerCase() === key) {
        sMap.getRange(i + 1, 2).setValue(newCat);
        return;
      }
    }

    sMap.appendRow([key, newCat, '', '', '', '']);
  } catch (e) { /* ignore */ }
}

/**
 * Multi-User: تصنيف حسب المستخدم
 * يمكن إضافة عمود userId في Classifier_Map
 */
function applyUserClassifierMap_(rawText, ai, userId) {
  try {
    var sMap = _sheet('Classifier_Map');
    var vals = sMap.getDataRange().getValues();
    var t = normalizeMerchantName_(String(rawText || '')).toLowerCase();
    var m = normalizeMerchantName_(String(ai.merchant || '')).toLowerCase();

    for (var i = 1; i < vals.length; i++) {
      var key = String(vals[i][0] || '').toLowerCase();
      var mapUserId = String(vals[i][6] || ''); // عمود جديد للـ userId
      
      if (!key) continue;
      
      // إذا كان هناك userId محدد، تحقق من التطابق
      if (mapUserId && mapUserId !== userId) continue;

      if (t.indexOf(key) >= 0 || m.indexOf(key) >= 0) {
        if (vals[i][1]) ai.category = vals[i][1];
        if (vals[i][2]) ai.type = vals[i][2];
        if (String(vals[i][3] || '') !== '') ai.isIncoming = String(vals[i][3]).toLowerCase() === 'true';
        if (vals[i][4]) ai.accNum = vals[i][4];
        if (vals[i][5]) ai.cardNum = vals[i][5];
        break;
      }
    }
  } catch (e) { /* ignore */ }

  return applySmartRules_(rawText, ai);
}

/**
 * قواعد ذكية للتصنيف (SAR + كلمات مفتاحية)
 */
function applySmartRules_(rawText, ai) {
  try {
    var text = String(rawText || '');
    var t = normalizeMerchantName_(text).toLowerCase();
    var merchant = normalizeMerchantName_(String(ai.merchant || '')).trim();

    // استخراج تاجر من نص الرسالة إذا كان غير محدد
    if (!merchant || merchant === 'غير محدد') {
      var m1 = text.match(/لدى[:،]?\s*([^\n]+)/i) || text.match(/لـ\d+;([^\n]+)/i) || text.match(/من:\s*([^\n]+)/i);
      if (m1) merchant = String(m1[1] || '').trim();
      if (merchant) ai.merchant = merchant;
    }

    // العملة
    var currency = detectCurrency_(text);
    if (currency) ai.currency = currency;

    // ========== SPECIAL TRANSACTION TYPES ==========
    
    // OTP / Verification Code / رمز مؤقت / رمز التحقق
    if (/رمز مؤقت|رمز التحقق|OTP\s*\)/i.test(text)) {
      ai.category = 'تحقق';
      ai.type = 'رمز تحقق';
      ai.isOTP = true;
      ai.isIncoming = false;
      // Don't include OTPs in spending calculations
      ai.excludeFromStats = true;
      return ai;
    }
    
    // Declined / رفض / رصيد غير كافي
    if (/رصيد غير كافي|Declined|declined|insufficient/i.test(text)) {
      ai.category = 'مرفوضة';
      ai.type = 'رفض';
      ai.status = 'declined';
      return ai;
    }
    
    // Refund / استرداد
    if (/استرداد|استرجاع|Reverse|Refund|refunded/i.test(text)) {
      ai.category = 'استرداد';
      ai.type = 'استرداد';
      ai.isIncoming = true;
      return ai;
    }
    
    // Loan Payment / قسط تمويل
    if (/قسط تمويل|المبلغ المتبقي/i.test(text)) {
      ai.category = 'قسط تمويل';
      ai.type = 'قسط';
      ai.isIncoming = false;
      ai.isLoanPayment = true;
      return ai;
    }
    
    // Tamara / Installments / أقساط
    if (/تمارا|Tamara|دفعة قادمة|مقسمة إلى|تأكيد دفعة/i.test(text)) {
      ai.category = 'أقساط';
      ai.type = ai.type || 'قسط';
      ai.isInstallment = true;
      return ai;
    }
    
    // Housing Support / دعم سكني
    if (/دعم سكني|إيداع دعم/i.test(text)) {
      ai.category = 'دعم حكومي';
      ai.type = 'إيداع';
      ai.isIncoming = true;
      return ai;
    }
    
    // Salary / راتب
    if (/وزارة التعليم|SAUDI ARABIAN MONETARY|راتب/i.test(text)) {
      ai.category = 'راتب';
      ai.type = 'حوالة';
      ai.isIncoming = true;
      return ai;
    }
    
    // Transfer between own accounts / حوالة بين حساباتك
    if (/حوالة بين حساباتك/i.test(text)) {
      ai.category = 'تحويل داخلي';
      ai.type = 'حوالة داخلية';
      ai.isInternal = true;
      return ai;
    }

    // Fuel & Gas Stations / وقود ومحطات
    if (/station|petrol|fuel|gas|oil|محطة|وقود/i.test(text) && !/police/i.test(text)) {
      ai.category = 'وقود'; // Fuel
      return ai;
    }

    // Restaurants & Cafes / مطاعم ومقاهي
    if (/restaurant|cafe|coffee|burger|pizza|shawarma|مطعم|كافيه|قهوة|برجر|شاورما|بيتزا/i.test(text)) {
      ai.category = 'طعام'; // Food
      return ai;
    }

    // Supermarkets / تموينات
    if (/market|grocery|panda|othaim|danube|tamimi|lulu|bakery|super|تموينات|سوبر|بنده|العثيم|الدانوب|التميمي|مخبز/i.test(text)) {
      ai.category = 'تسوق'; // Shopping/Groceries
      return ai;
    }
    
    // Internal Transfer / حوالة داخلية صادرة/واردة
    // FIX: "حوالة داخلية صادرة" usually means "Same Bank Transfer" (e.g. Rajhi to Rajhi)
    // It should be 'Outgoing Transfer' (Expense) unless we confirm the destination is ours.
    if (/حوالة داخلية صادرة/i.test(text)) {
       // Check if destination matches any of our known own accounts
       var isToMe = false;
       var ownAccountsStr = PropertiesService.getScriptProperties().getProperty('OWN_ACCOUNTS') || '';
       var ownAccounts = ownAccountsStr.split(',');
       for (var k=0; k<ownAccounts.length; k++) {
           var acc = String(ownAccounts[k]).trim();
           if (acc.length > 3 && text.indexOf(acc) !== -1) {
               isToMe = true;
               break;
           }
       }
       
       if (isToMe) {
           ai.category = 'تحويل داخلي';
           ai.type = 'حوالة داخية';
           ai.isInternal = true;
       } else {
           ai.category = 'حوالات صادرة'; // Treat as Expense to others
           ai.type = 'حوالة';
           ai.isIncoming = false;
       }
       return ai;
    }

    if (/حوالة داخلية واردة/i.test(text)) {
      ai.category = 'حوالات واردة'; // Assume income unless from self
      ai.type = 'حوالة';
      ai.isIncoming = true;
      return ai;
    }
    
    // Local Transfer / حوالة محلية صادرة/واردة
    if (/حوالة محلية صادرة/i.test(text)) {
      ai.category = 'حوالات صادرة';
      ai.type = 'حوالة';
      ai.isIncoming = false;
      return ai;
    }
    if (/حوالة محلية واردة|حوالة واردة/i.test(text)) {
      ai.category = 'حوالات واردة';
      ai.type = 'حوالة';
      ai.isIncoming = true;
      return ai;
    }
    
    // Outgoing Transfer / حوالة صادرة
    if (/حوالة صادرة/i.test(text)) {
      ai.category = 'حوالات صادرة';
      ai.type = 'حوالة';
      ai.isIncoming = false;
      return ai;
    }
    
    // ATM Withdrawal / سحب صراف
    if (/سحب.*صراف|صراف آلي|ATM/i.test(text)) {
      ai.category = 'سحب نقدي';
      ai.type = 'سحب';
      ai.isIncoming = false;
      return ai;
    }
    
    // Add Money / إضافة أموال (topup)
    if (/إضافة أموال|Add Money|شحن رصيد/i.test(text)) {
      ai.category = 'شحن رصيد';
      ai.type = 'إضافة';
      ai.isIncoming = true;
      return ai;
    }
    
    // ========== MERCHANT-BASED CATEGORIES ==========
    var merchantLower = merchant.toLowerCase();
    
    // Digital Wallets / محافظ (tiqmo فقط)
    if (/tiqmo/i.test(merchantLower + ' ' + t)) {
      ai.category = 'محافظ';
      ai.type = ai.type || 'شحن';
    }
    // Fuel / وقود
    else if (/naft|بنزين|محطة|gas\s*stat/i.test(merchantLower + ' ' + t)) {
      ai.category = 'وقود';
      ai.type = ai.type || 'مشتريات';
    }
    // Transport / نقل
    else if (/hala|uber|careem|نقل|مواصلات/i.test(merchantLower + ' ' + t)) {
      ai.category = 'نقل';
      ai.type = ai.type || 'مشتريات';
    }
    // Food / طعام
    else if (/kudu|halawyat|dunkin|daily\s*fo|tamwinat|tamwenat|taem|pizza|coffee|bakery|مطعم|طعام|food/i.test(merchantLower + ' ' + t)) {
      ai.category = 'طعام';
      ai.type = ai.type || 'مشتريات';
    }
    // Shopping / تسوق
    else if (/amazon|panda|aliexpress|alsaif|amtiaz|dukan|family|تسوق/i.test(merchantLower + ' ' + t)) {
      ai.category = 'تسوق';
      ai.type = ai.type || 'مشتريات';
    }
    // Entertainment / ترفيه
    else if (/movie|cinema|سينما|ترفيه/i.test(merchantLower + ' ' + t)) {
      ai.category = 'ترفيه';
      ai.type = ai.type || 'مشتريات';
    }
    // Travel / سفر
    else if (/united\s*ti|flyadeal|flynas|nusuk|طيران|سفر/i.test(merchantLower + ' ' + t)) {
      ai.category = 'سفر';
      ai.type = ai.type || 'مشتريات';
    }
    // Bills / فواتير
    else if (/saudi electricity|electricity|كهرباء|مياه|فاتورة|سداد/i.test(merchantLower + ' ' + t)) {
      ai.category = 'فواتير';
      ai.type = ai.type || 'سداد';
    }
    // Donations / تبرعات
    else if (/donation|تبرع/i.test(merchantLower + ' ' + t)) {
      ai.category = 'تبرعات';
      ai.type = ai.type || 'شراء';
    }
    // Subscriptions / اشتراكات
    else if (/01\.ai|netflix|spotify|اشتراك/i.test(merchantLower + ' ' + t)) {
      ai.category = 'اشتراكات';
      ai.type = ai.type || 'مشتريات';
    }
    // Income / دخل (Upwork etc)
    else if (/upwork/i.test(merchantLower + ' ' + t)) {
      ai.category = 'دخل';
      ai.type = ai.type || 'مشتريات';
    }
    // Stationery / قرطاسية
    else if (/maktabat|qurtas|library|مكتبة|قرطاسية/i.test(merchantLower + ' ' + t)) {
      ai.category = 'قرطاسية';
      ai.type = ai.type || 'مشتريات';
    }
    // Grocery / بقالة
    else if (/zawyat|zawaya|raeah|azoom|alrwabi|grocery|بقالة/i.test(merchantLower + ' ' + t)) {
      ai.category = 'بقالة';
      ai.type = ai.type || 'مشتريات';
    }

    // ========== FALLBACK RULES ==========
    
    // تصنيف حسب العملة (مشتريات خارجية)
    if (currency && currency !== 'SAR' && (!ai.category || ai.category === 'أخرى')) {
      ai.category = 'مشتريات خارجية';
      ai.type = ai.type || 'مشتريات';
    }

    // Transfer rules
    if (/حوالة.*واردة|واردة.*محلية|داخلية واردة/i.test(t)) {
      ai.category = ai.category || 'حوالات واردة';
      ai.type = ai.type || 'حوالة';
      ai.isIncoming = true;
    } else if (/حوالة.*صادرة|صادرة.*محلية|داخلية صادرة/i.test(t)) {
      ai.category = ai.category || 'حوالات صادرة';
      ai.type = ai.type || 'حوالة';
      ai.isIncoming = false;
    } else if (/تحويل|حوالة/i.test(t)) {
      ai.type = ai.type || 'حوالة';
      if (/وارد|استلام|إيداع/i.test(t)) {
        ai.category = ai.category || 'حوالات واردة';
        ai.isIncoming = true;
      } else if (/صادر|خصم|إلى/i.test(t)) {
        ai.category = ai.category || 'حوالات صادرة';
        ai.isIncoming = false;
      }
    }

    // Generic purchase rules
    if (/pos|mada|مدى|شراء|apple\s*pay|applepay|payment|visa/i.test(t)) {
      ai.category = ai.category || 'مشتريات عامة';
      ai.type = ai.type || 'مشتريات';
    }
    
  } catch (e) { /* ignore */ }

  return ai;
}

function detectCurrency_(text) {
  var t = String(text || '').toUpperCase();
  if (/\bSAR\b|ريال|ر\.س/i.test(t)) return 'SAR';
  if (/\bUSD\b|\$|دولار/i.test(t)) return 'USD';
  if (/\bEUR\b|€|يورو/i.test(t)) return 'EUR';
  if (/\bGBP\b|£|جنيه/i.test(t)) return 'GBP';
  return '';
}

function normalizeMerchantName_(s) {
  return String(s || '')
    .replace(/[\u200f\u200e]/g, '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[^\w\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
