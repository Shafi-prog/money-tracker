
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

/** Parser احتياطي سريع إذا لم يوجد AI/Templates */
function parseBasicSMS_(text) {
  var t = String(text || '').replace(/\s+/g, ' ').trim();

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
  var cat = 'أخرى', type = 'حوالة';
  
  // حوالة داخلية
  if (/حوالة داخلية/i.test(t)) {
    type = 'تحويل داخلي';
    cat = 'حوالات داخلية';
    if (/صادر/i.test(t)) { cat = 'حوالات صادرة'; outgoing = true; }
    if (/وارد/i.test(t)) { cat = 'حوالات واردة'; incoming = true; }
  } else if (/(شراء|POS|Apple\s*Pay|مدى)/i.test(t)) {
    type = 'مشتريات';
    cat = 'مشتريات عامة';
  } else if (incoming) {
    type = 'حوالة';
    cat = 'حوالات واردة';
  } else if (outgoing) {
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
          if (acc.isInternal) { ai.category = 'حوالة داخلية'; ai.type = 'تحويل داخلي'; }
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

    // 5) sync - ✅ استخدام نظام UUID الجديد إذا متاح
    var sync;
    if (typeof insertTransaction_ === 'function') {
      sync = insertTransaction_(ai, source, smsText);
    } else {
      sync = saveTransaction(ai, smsText, source);
    }

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

/** ضمان وجود صف ميزانية للتصنيف (كما كان عندك) */
function ensureBudgetRowExists_(category) {
  category = String(category || '').trim();
  if (!category) return;

  var sB = _sheet('Budgets');
  var vals = sB.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0] || '') === category) return;
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
  var category = sanitizeString(data.category, 50) || 'أخرى';
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
  var internal = isInternalTransfer_({ category: category, type: type });
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
          if (String(bData[i][0] || '') === category) { rowIdx = i + 1; break; }
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
      var destAcc = null;
      var rawStr = String(raw || '').toLowerCase();
      
      // 1. Regex (Numbers)
      var mCard = rawStr.match(/(?:account|acc|card|ila|to|il|beneficiary)\s*[:#\-]?\s*\*?(\d{4})/i);
      if (mCard) destAcc = mCard[1];

      // 2. Name Match (if no digits found)
      if (!destAcc && merchant && typeof findAccountByNameOrBank_ === 'function') {
         var found = findAccountByNameOrBank_(merchant);
         if (found && found.isMine) destAcc = found.number;
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
      updateBalancesAfterTransaction_({
        accNum: accNum,
        cardNum: cardNum,
        merchant: merchant,
        amount: amount,
        isIncoming: data.isIncoming,
        category: category,
        type: type
      });
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
