
/********** Flow.gs — Sovereign Financial System **********
 * - processTransaction: المعالجة الأساسية (يُستدعى من Queue Worker)
 * - saveTransaction: كتابة Sheet1 + تحديث Budgets + (اختياري) Debt_Ledger + Dashboard(raw)
 *
 * ✅ تعديل مهم: saveTransaction الآن يحدّث "الرصيد" في Debt_Ledger (عمود E)
 *   - الصف 2: =D2-C2
 *   - الصف 3+: =E(الصف السابق)+D(الصف)-C(الصف)
 ****************************************************/

/** هل العملية تحويل داخلي؟ */
function isInternalTransfer_(data) {
  var cat = String((data && data.category) ? data.category : '');
  var typ = String((data && data.type) ? data.type : '');
  return (cat.indexOf('حوالة داخلية') !== -1) || (typ.indexOf('تحويل داخلي') !== -1);
}

/** ✅ Smart merchant categorization - NOT using POS as category */
function categorizeMerchant_(merchant) {
  var m = String(merchant || '').toLowerCase();
  
  // Gas stations / محطات الوقود
  if (/station|محطة|بنزين|fuel|gas|petrol|نفط|المحطة|statio/i.test(m)) return 'وقود';
  
  // Restaurants / مطاعم
  if (/restaurant|مطعم|كافيه|cafe|coffee|قهوة|ستاربكس|starbucks|ماكدونالد|mcdonald|برجر|burger|بيتزا|pizza|كنتاكي|kfc|شاورما/i.test(m)) return 'طعام';
  
  // Grocery / بقالة
  if (/بقالة|سوبرماركت|supermarket|grocery|تموينات|بندة|danube|تميمي|العثيم|هايبر|carrefour|كارفور|لولو|lulu/i.test(m)) return 'بقالة';
  
  // Shopping / تسوق
  if (/مول|mall|زارا|zara|h&m|سنتر|center|متجر|store|shop/i.test(m)) return 'تسوق';
  
  // Telecom / اتصالات
  if (/stc|موبايلي|mobily|زين|zain|اتصالات|telecom/i.test(m)) return 'اتصالات';
  
  // Health / صحة
  if (/صيدلية|pharmacy|مستشفى|hospital|عيادة|clinic|طبي|medical/i.test(m)) return 'صحة';
  
  // Transport / نقل
  if (/uber|كريم|careem|تاكسي|taxi|نقل|transport/i.test(m)) return 'نقل';
  
  // Default
  return 'مشتريات عامة';
}

/** Parser احتياطي سريع إذا لم يوجد AI/Templates */
function parseBasicSMS_(text) {
  var t = String(text || '').replace(/\s+/g, ' ').trim();

  // 0) Manual Command Support (Amount | Merchant | Category | Notes)
  // Format: "OptionalType: 100 | Merchant | Category | Notes"
  if (t.indexOf('|') !== -1) {
    var parts = t.replace(/^(أضف:|Add:)/i, '').split('|').map(function(s) { return s.trim(); });
    // Expected: [Amount, Merchant, Category, Notes?]
    if (parts.length >= 2) {
      var rawAmt = parseFloat(parts[0]);
      var type = 'مصروفات';
      var isIncoming = false;
      
      // Heuristic: negative amount = expense, positive = income? 
      // Or explicit type prefix.
      // Frontend sends "أضف: 100" or "أضف: -100".
      // Let's rely on sign.
      if (rawAmt < 0) {
        type = 'مشتريات';
        isIncoming = false;
      } else {
        type = 'إيداع';
        isIncoming = true;
      }
      
      var manualCat = parts[2] || 'أخرى';
      
      return {
        merchant: parts[1] || 'يدوي',
        amount: Math.abs(rawAmt),
        currency: 'SAR',
        category: manualCat,
        type: type,
        isIncoming: isIncoming,
        accNum: '',
        cardNum: '',
        notes: parts[3] || '', // Capture Notes
        manual: true
      };
    }
  }

  // أنماط متعددة لاستخراج المبلغ
  var amtMatch = t.match(/بـ\s*SAR\s*(\d[\d,\.]*)/i) ||
                 t.match(/(?:مبلغ[:،]?\s*)?(?:SAR\s*)?(\d[\d,\.]*)\s*(?:SAR|ريال|ر\.?س)/i) ||
                 t.match(/SAR\s*(\d[\d,\.]*)/i) ||
                 t.match(/(\d[\d,\.]*)\s*(?:SAR|ريال|ر\.?س)/i) ||
                 t.match(/بمبلغ\s*(\d[\d,\.]*)/i);
  var amt = amtMatch ? Number(String(amtMatch[1]).replace(/,/g, '')) : 0;

  var incoming = /(وارد|إيداع|استلام|راتب|إلى حسابك)/i.test(t);
  var outgoing = /(خصم|شراء|سحب|رسوم|POS|صادر|مدى)/i.test(t);

  var cardMatch = t.match(/\*\*(\d{3,6})/);
  var cardNum = cardMatch ? cardMatch[1] : '';
  
  // استخراج رقم الحساب
  var accMatch = t.match(/من\s*(\d{4})/i) || t.match(/حساب\s*(\d{4})/i);
  var accNum = accMatch ? accMatch[1] : '';

  // أنماط متعددة لاستخراج اسم التاجر/المستلم
  var merchMatch = t.match(/لـ\d+;([^ن\n]+)/i) ||  // حوالة داخلية: لـ6180;محمد
                   t.match(/لدى[:،]?\s*(.+?)(?:\s*$|\s+عبر|\s+في)/i) ||
                   t.match(/من\s+(.+?)(?:\s+عبر|\s+في|\s+بـ|$)/i) ||
                   t.match(/إلى\s+(.+?)(?:\s+عبر|\s+في|$)/i);
  var merchant = merchMatch ? merchMatch[1].trim() : 'غير محدد';

  // تحديد النوع والتصنيف
  var cat = 'أخرى', type = 'مشتريات';
  
  // ✅ Check if merchant/destination matches MY OWN ACCOUNTS (not generic banks)
  var merchantLower = String(merchant || '').toLowerCase();
  var textLower = String(t || '').toLowerCase();
  var isInternalTransfer = false;
  
  // Get my accounts dynamically from the Accounts sheet
  var myAccountMatch = classifyAccountFromText_(merchant + ' ' + t);
  if (myAccountMatch && myAccountMatch.hit && myAccountMatch.hit.isMine === 'TRUE') {
    // The destination matches one of MY accounts - this is an internal transfer
    isInternalTransfer = true;
    Logger.log('🔄 Internal transfer detected - destination matches my account: ' + (myAccountMatch.hit.name || myAccountMatch.hit.number));
  }
  
  // حوالة داخلية (also check explicit Arabic text)
  if (isInternalTransfer || /حوالة داخلية/i.test(t)) {
    type = 'تحويل داخلي';
    cat = 'حوالة داخلية';
    if (/صادر/i.test(t)) { outgoing = true; }
    if (/وارد/i.test(t)) { incoming = true; }
  } else if (/(شراء|POS|Apple\s*Pay|مدى)/i.test(t)) {
    type = 'مشتريات';
    // ✅ Don't use POS as category - use smart categorization instead
    cat = categorizeMerchant_(merchant);
  } else if (incoming) {
    type = 'حوالة';
    cat = 'حوالات واردة';
  } else if (outgoing) {
    type = 'حوالة';
    cat = 'حوالات صادرة';
  }

  return {
    merchant: merchant,
    amount: amt || 0,
    currency: 'SAR',
    category: cat,
    type: type,
    isIncoming: incoming ? true : (outgoing ? false : false),
    accNum: accNum,
    cardNum: cardNum
  };
}

function processTransaction(smsText, source, destChatId) {
  try {
    smsText = String(smsText || '');
    source = String(source || 'غير معروف');

    logIngressEvent_('INFO', 'processTransaction', { smsText: smsText.slice(0,100), source: source }, 'start');

    // 1) Templates (إن وجدت)
    var ai = null;
    try {
      if (typeof parseByTemplates_ === 'function') {
        var tpl = parseByTemplates_(smsText);
        if (tpl && tpl.ok && tpl.extracted) {
          ai = {
            merchant: tpl.extracted.merchant || 'غير محدد',
            amount: Number(tpl.extracted.amount) || 0,
            currency: 'SAR',
            category: 'مشتريات عامة',
            type: 'مشتريات',
            isIncoming: false,
            accNum: '',
            cardNum: tpl.extracted.cardLast || ''
          };
        }
      }
    } catch (eTpl) {
      Logger.log('Template parsing error: ' + eTpl.message);
    }

    // 2) AI (إن وجد) وإلا fallback
    if (!ai) {
      if (typeof classifyWithAI === 'function') ai = classifyWithAI(smsText);
      else ai = parseBasicSMS_(smsText);
    }

    // 3) Apply classifier map and smart rules (conditional on settings)
    try {
      var settings = getSettings();
      var autoApplyEnabled = settings && settings.settings && settings.settings.auto_apply_rules === true;
      
      if (autoApplyEnabled) {
        Logger.log('Auto-apply rules enabled - applying classifiers');
        if (typeof applyClassifierMap_ === 'function') {
          ai = applyClassifierMap_(smsText, ai);
        }
        if (typeof applySmartRules_ === 'function') {
          ai = applySmartRules_(smsText, ai);
        }
      } else {
        Logger.log('Auto-apply rules disabled - skipping classifiers');
      }
    } catch (eC) {
      Logger.log('Error in classifier application: ' + eC);
    }

    // 4) Accounts (إن وجد) لتحديد التحويل الداخلي
    try {
      // ✅ NEW: Use DataLinkage for account enrichment
      if (typeof enrichTransactionWithAccountInfo_ === 'function') {
        ai.raw = smsText; // Needed for extraction
        ai = enrichTransactionWithAccountInfo_(ai);
      } else if (typeof classifyAccountFromText_ === 'function' && typeof SOV1_extractFingerprintParts_ === 'function') {
        var parts = SOV1_extractFingerprintParts_(smsText);
        var acc = classifyAccountFromText_(smsText, parts.cardLast);
        if (acc && acc.hit) {
          ai.accNum = String(acc.hit.org || '') + (acc.hit.num ? (' ' + acc.hit.num) : '');
          
          // Legacy check on Source account (sometimes source is internal if purely moving funds)
          if (acc.isInternal) { ai.category = 'حوالة داخلية'; ai.type = 'تحويل داخلي'; }
        }
        
        // ✅ NEW: Explicit Destination Check (to catch "Transfer to Tiqmo" etc.)
        // If the merchant text matches one of my accounts, it's an internal transfer.
        if (ai.merchant && ai.merchant !== 'غير محدد') {
          var destAcc = classifyAccountFromText_(ai.merchant, null);
          if (destAcc && destAcc.hit) {
            if (destAcc.hit.isMine || destAcc.isInternal) {
              ai.category = 'حوالة داخلية'; 
              ai.type = 'تحويل داخلي';
              // Normalize Merchant Name
              ai.merchant = destAcc.hit.name;
            }
          }
        }
      }
      
      // ✅ Extract card/account numbers from SMS
      if (!ai.accNum && typeof extractAccountFromText_ === 'function') {
        ai.accNum = extractAccountFromText_(smsText) || '';
      }
      if (!ai.cardNum && typeof extractCardFromText_ === 'function') {
        ai.cardNum = extractCardFromText_(smsText) || '';
      }
    } catch (eA) {
      Logger.log('Account extraction error: ' + eA);
    }

    // 4.5) Enforce category alignment to known categories
    try {
      ai.category = alignCategoryToKnown_(ai.category, ai.type);
    } catch (eCat) {
      Logger.log('Category alignment error: ' + eCat);
    }

    // 5) sync - ✅ استخدام نظام UUID الجديد إذا متاح
    var sync;
    // FIXED: Force use of saveTransaction for reliable balance updates
    /* if (typeof insertTransaction_ === 'function') {
      sync = insertTransaction_(ai, source, smsText);
    } else { */
      // Pass the extracted current balance to saveTransaction
      if (ai.currentBalance !== undefined && ai.currentBalance !== null) {
          if (!ai.extra) ai.extra = {};
          ai.extra.currentBalance = ai.currentBalance;
          Logger.log('Passing authoritative balance to saveTransaction: ' + ai.currentBalance);
      }
      sync = saveTransaction(ai, smsText, source);
    /* } */

    // 6) send report
    try {
      if (typeof sendTransactionReport === 'function') {
        // تمرير UUID للتقرير
        ai.uuid = sync.uuid || null;
        sendTransactionReport(ai, sync, source, smsText, destChatId);
      }
    } catch (eS) {}
    
    return sync;

  } catch (err) {
    logIngressEvent_('ERROR', 'processTransaction', { error: String(err), source: source }, smsText);
    return null;
  }
}

function alignCategoryToKnown_(category, type) {
  var raw = String(category || '').trim();
  if (!raw) raw = 'أخرى';

  // Keep internal transfers mapped to "تحويل"
  var typ = String(type || '').toLowerCase();
  var isInternal = /(حوالة داخلية|تحويل داخلي|internal)/i.test(raw) || /(حوالة داخلية|تحويل داخلي|internal)/i.test(typ) || typ === 'transfer';
  if (isInternal) raw = 'تحويل';

  // Normalize English to Arabic if possible
  if (typeof _normalizeCategoryNameArabic_ === 'function') {
    raw = _normalizeCategoryNameArabic_(raw) || raw;
  }

  var known = getKnownCategories_();
  if (known.length === 0) return raw || 'أخرى';

  // Prefer cash-withdrawal category when type or text indicates ATM/withdrawal
  var hasWithdraw = false;
  for (var k = 0; k < known.length; k++) {
    if (String(known[k]).trim().toLowerCase() === 'سحب نقدي') { hasWithdraw = true; break; }
  }
  if (hasWithdraw) {
    var isWithdraw = /سحب|صراف|atm|withdraw|cash\s*withdrawal/i.test(raw) || /سحب|صراف|atm|withdraw|cash\s*withdrawal/i.test(typ);
    if (isWithdraw) return 'سحب نقدي';
  }

  var lc = raw.toLowerCase();
  for (var i = 0; i < known.length; i++) {
    if (String(known[i]).toLowerCase() === lc) return known[i];
  }

  return 'أخرى';
}

function getKnownCategories_() {
  try {
    // Preferred: UI categories list (handles Arabic/English schema)
    if (typeof SOV1_UI_getCategories_ === 'function') {
      var list = SOV1_UI_getCategories_('OPEN');
      if (list && list.length) {
        // Extract .name from objects if needed
        return list.map(function(c) {
          return (typeof c === 'object' && c !== null && c.name) ? c.name : String(c || '');
        }).filter(Boolean);
      }
    }

    // Fallback: CategoryManager schema
    if (typeof getCategories_ === 'function') {
      var cats = getCategories_();
      if (cats && cats.length) {
        return cats.map(function(c){ return c.name || c; });
      }
    }
  } catch (e) {
    Logger.log('getKnownCategories_ error: ' + e);
  }
  return [];
}

/** ضمان وجود صف ميزانية للتصنيف (كما كان عندك) */
function ensureBudgetRowExists_(category) {
  category = (typeof normalizeCategoryForBudget_ === 'function')
    ? normalizeCategoryForBudget_(category)
    : String(category || '').trim();
  if (!category) return;

  var sB = _sheet('Budgets');
  var vals = sB.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0] || '').trim().toLowerCase() === String(category).trim().toLowerCase()) return;
  }

  var row = sB.getLastRow() + 1;
  sB.getRange(row, 1, 1, 4).setValues([[category, 0, 0, '=B' + row + '-C' + row]]);
}

/**
 * ✅ saveTransaction (معدل):
 * - Sheet1: appendRow
 * - Budgets: تحديث مصروف التصنيف (إلا إذا تحويل داخلي)
 * - Debt_Ledger: إذا تحويل داخلي -> appendRow + تحديث الرصيد (E) بصيغة
 * - Dashboard raw: اختياري
 */
function saveTransaction(data, raw, source) {
  // ✅ Input Validation - التحقق من صحة البيانات
  data = data || {};
  
  // Check strict exclusions (like OTPs if setting says so)
  // Classifier.js marks them with excludeFromStats = true
  if (data.excludeFromStats === true) {
    // Check setting explicitly
    var saveTemp = PropertiesService.getScriptProperties().getProperty('SAVE_TEMP_CODES') === 'true';
    if (!saveTemp) {
      Logger.log('Ignoring OTP/Verification transaction because SAVE_TEMP_CODES is false');
      return { uuid: 'SKIPPED_OTP', status: 'skipped' };
    }
    // If saving is enabled, we continue but ensure it's marked as 'تحقق'
  }
  
  // تنظيف وتحقق من المبلغ
  var amount = Math.abs(Number(data.amount) || 0);
  if (amount > 10000000) {
    Logger.log('Warning: Unusually large amount detected: ' + amount);
    amount = 0; // رفض المبالغ الضخمة غير المنطقية
  }
  
  // تنظيف النصوص من الأحرف الخطرة
  var sanitizeString = function(s, maxLen) {
    s = String(s || '').trim();
    // إزالة أحرف التحكم والـ HTML tags
    s = s.replace(/[<>\"\'\\]/g, '').replace(/[\x00-\x1F\x7F]/g, '');
    return s.slice(0, maxLen || 200);
  };
  
  var merchant = sanitizeString(data.merchant, 100) || 'غير محدد';
  var categoryRaw = sanitizeString(data.category, 50) || 'أخرى';
  var category = (typeof normalizeCategoryForBudget_ === 'function')
    ? normalizeCategoryForBudget_(categoryRaw)
    : categoryRaw;
  var type = sanitizeString(data.type, 30) || 'حوالة';
  var accNum = sanitizeString(data.accNum, 20);
  var cardNum = sanitizeString(data.cardNum, 20);
  source = sanitizeString(source, 50) || 'غير معروف';
  
  var now = new Date();
  var uuid = generateShortUUID_(); // Generate UUID for tracking

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var sD = _sheet('Debt_Ledger');
  var sDash = _sheet('Dashboard'); // خام اختياري

  // Detect internal transfer early (before budgets + save)
  var internal = isInternalTransfer_({ category: categoryRaw, type: type });
  if (!internal && merchant) {
    try {
      var hit = null;
      if (typeof classifyAccountFromText_ === 'function') {
        hit = classifyAccountFromText_(merchant, null);
      }
      if (!hit && typeof findAccountByNameOrBank_ === 'function') {
        var found = findAccountByNameOrBank_(merchant);
        if (found) hit = { hit: found };
      }

      if (hit && hit.hit && hit.hit.isMine) {
        var destNum = hit.hit.num || hit.hit.number || '';
        if (destNum && String(destNum) !== String(accNum)) {
          internal = true;
          data.isInternal = true;
          data.toAccount = destNum;
          category = 'تحويل داخلي';
          type = 'تحويل داخلي';
        }
      }
    } catch (eInt) {
      Logger.log('Internal transfer detection error: ' + eInt);
    }
  }

  // 1) Sheet1 - with UUID tracking
  s1.appendRow([
    uuid, // UUID for cross-sheet tracking
    now,
    'V120_AUTO',
    'اليوم',
    'الأسبوع',
    source,
    accNum,
    cardNum,
    amount,
    merchant,
    category,
    type,
    String(raw || '').slice(0, 1000) // حد أقصى للنص الخام
  ]);

  // 2) Budgets — تجاهل التحويل الداخلي (لا يُحسب مصروف/دخل)
  var bRem = 0;

  if (!internal) {
    // ✅ استخدام Lock لمنع race condition في تحديث الميزانية
    var budgetLock = LockService.getScriptLock();
    var gotBudgetLock = budgetLock.tryLock(3000); // انتظر 3 ثواني
    
    if (gotBudgetLock) {
      try {
        ensureBudgetRowExists_(category);

        // Batch read
        var bData = sB.getDataRange().getValues();
        var rowIdx = -1;
        for (var i = 1; i < bData.length; i++) {
          if (String(bData[i][0] || '').trim().toLowerCase() === String(category).trim().toLowerCase()) { rowIdx = i + 1; break; }
        }

        if (rowIdx > 0) {
          var curSpent = Number(bData[rowIdx - 1][2]) || 0;
          var delta = data.isIncoming ? -amount : amount;
          sB.getRange(rowIdx, 3).setValue(curSpent + delta);
          SpreadsheetApp.flush();
          bRem = Number(sB.getRange(rowIdx, 4).getValue()) || 0;
        }
        
        // Recalculate ONLY the affected category using salary period
        if (typeof recalculateBudgetSpent_ === 'function') {
          try {
            recalculateBudgetSpent_();
          } catch (eRecalc) {
            Logger.log('Budget recalculation skipped: ' + eRecalc);
          }
        }
      } catch (eB) {
        Logger.log('Budget update error: ' + eB.message);
      } finally {
        budgetLock.releaseLock();
      }
    } else {
      Logger.log('Could not acquire budget lock - skipping budget update');
    }
  }

  // 3) Internal Transfers & Debt Logic
  var dBal = 0;
  var balancesUpdated = false;

  try {
    if (internal) {
      // محاولة استخراج الحساب المستلم (للتحويل بين حساباتي)
      var destAcc = data.toAccount || null;
      var rawStr = String(raw || '').toLowerCase();
      
      // 1. Regex (Numbers)
      var mCard = rawStr.match(/(?:account|acc|card|ila|to|il|beneficiary)\s*[:#\-]?\s*\*?(\d{4})/i);
      if (mCard) destAcc = mCard[1];

      // 2. Name Match (if no digits found)
      if (!destAcc && merchant && typeof findAccountByNameOrBank_ === 'function') {
        var found = findAccountByNameOrBank_(merchant);
        if (found && found.isMine) destAcc = found.number || found.num;
      }
      
      // إذا وجدنا حساب مستلم، نعالجه كتحويل داخلي بين الحسابات
      if (destAcc && typeof handleInternalTransfer_ === 'function') {
        Logger.log('🔄 Detected Self-Transfer: ' + accNum + ' -> ' + destAcc);
        handleInternalTransfer_(accNum, destAcc, amount);
        balancesUpdated = true; 
      } else {
        // وإلا، نعالجه كدين (لشخص آخر) في Debt_Ledger
        var party = merchant;
        var debtor = data.isIncoming ? amount : 0;    // مدين
        var creditor = data.isIncoming ? 0 : amount;  // دائن
        var desc = (data.isIncoming ? 'حوالة داخلية واردة' : 'حوالة داخلية صادرة') + ' - ' + party;

        // أضف الصف
        sD.appendRow([uuid, now, party, debtor, creditor, '', desc]);

        // ضع صيغة الرصيد في العمود E للصف الأخير
        var lastRow = sD.getLastRow();
        if (lastRow === 2) {
          // أول قيد بعد الهيدر
          sD.getRange(lastRow, 5).setFormula('=D2-C2');
        } else if (lastRow > 2) {
          // رصيد تراكمي
          // = E(prev) + D(this) - C(this)
          sD.getRange(lastRow, 5).setFormulaR1C1('=R[-1]C + RC[-1] - RC[-2]');
        }

        SpreadsheetApp.flush();
        try { dBal = Number(sD.getRange(lastRow, 5).getValue()) || 0; } catch (e1) {
          Logger.log('Debt balance read error: ' + e1.message);
        }
      }
    }
  } catch (eD) {
    Logger.log('Debt ledger update error: ' + eD.message);
  }

  // 4) Dashboard raw (اختياري)
  try {
    sDash.appendRow([uuid, now, merchant, amount, category, source]);
  } catch (eDash) {
    Logger.log('Dashboard append error: ' + eDash.message);
  }

  // 5) ✅ تحديث الأرصدة وتتبع الديون (إذا لم يتم تحديثها سابقاً)
  try {
    if (!balancesUpdated && typeof updateBalancesAfterTransaction_ === 'function') {
      var balancePayload = {
        accNum: accNum,
        cardNum: cardNum,
        merchant: merchant,
        amount: amount,
        isIncoming: data.isIncoming,
        category: category,
        type: type
      };
      
      // Pass authoritative balance if available in 'extra'
      if (data.extra && data.extra.currentBalance !== undefined) {
          balancePayload.currentBalance = data.extra.currentBalance;
      } else if (data.currentBalance !== undefined) {
          balancePayload.currentBalance = data.currentBalance;
      }
      
      updateBalancesAfterTransaction_(balancePayload);
    }
  } catch (eBalance) {
    Logger.log('Balance update error: ' + eBalance.message);
  }

  return { budget: bRem, debt: dBal, internal: internal };
}

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES (for tests and archived code)
// ============================================================================
var executeUniversalFlowV120 = processTransaction;
var syncQuadV120 = saveTransaction;
var SOV1_preParseFallback_ = parseBasicSMS_;
var SOV1_isInternalTransfer_ = isInternalTransfer_;
