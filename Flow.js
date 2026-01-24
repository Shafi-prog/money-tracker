
/********** Flow.gs — Sovereign Financial System **********
 * - executeUniversalFlowV120: المعالجة الأساسية (يُستدعى من Queue Worker)
 * - syncQuadV120: كتابة Sheet1 + تحديث Budgets + (اختياري) Debt_Ledger + Dashboard(raw)
 *
 * ✅ تعديل مهم: syncQuadV120 الآن يحدّث "الرصيد" في Debt_Ledger (عمود E)
 *   - الصف 2: =D2-C2
 *   - الصف 3+: =E(الصف السابق)+D(الصف)-C(الصف)
 ****************************************************/

/** هل العملية تحويل داخلي؟ */
function SOV1_isInternalTransfer_(data) {
  var cat = String((data && data.category) ? data.category : '');
  var typ = String((data && data.type) ? data.type : '');
  return (cat.indexOf('حوالة داخلية') !== -1) || (typ.indexOf('تحويل داخلي') !== -1);
}

/** Parser احتياطي سريع إذا لم يوجد AI/Templates */
function SOV1_preParseFallback_(text) {
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

function executeUniversalFlowV120(smsText, source, destChatId) {
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
    } catch (eTpl) {}

    // 2) AI (إن وجد) وإلا fallback
    if (!ai) {
      if (typeof callAiHybridV120 === 'function') ai = callAiHybridV120(smsText);
      else ai = SOV1_preParseFallback_(smsText);
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
      if (typeof classifyAccountFromText_ === 'function' && typeof SOV1_extractFingerprintParts_ === 'function') {
        var parts = SOV1_extractFingerprintParts_(smsText);
        var acc = classifyAccountFromText_(smsText, parts.cardLast);
        if (acc && acc.hit) {
          ai.accNum = String(acc.hit.org || '') + (acc.hit.num ? (' ' + acc.hit.num) : '');
          if (acc.isInternal) { ai.category = 'حوالة داخلية'; ai.type = 'تحويل داخلي'; }
        }
      }
    } catch (eA) {}

    // 5) sync - ✅ استخدام نظام UUID الجديد إذا متاح
    var sync;
    if (typeof insertTransaction_ === 'function') {
      sync = insertTransaction_(ai, source, smsText);
    } else {
      sync = syncQuadV120(ai, smsText, source);
    }

    // 6) send report
    try {
      if (typeof sendSovereignReportV120 === 'function') {
        // تمرير UUID للتقرير
        ai.uuid = sync.uuid || null;
        sendSovereignReportV120(ai, sync, source, smsText, destChatId);
      }
    } catch (eS) {}
    
    return sync;

  } catch (err) {
    logIngressEvent_('ERROR', 'executeUniversalFlowV120', { error: String(err), source: source }, smsText);
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
 * ✅ syncQuadV120 (معدل):
 * - Sheet1: appendRow
 * - Budgets: تحديث مصروف التصنيف (إلا إذا تحويل داخلي)
 * - Debt_Ledger: إذا تحويل داخلي -> appendRow + تحديث الرصيد (E) بصيغة
 * - Dashboard raw: اختياري
 */
function syncQuadV120(data, raw, source) {
  var now = new Date();

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var sD = _sheet('Debt_Ledger');
  var sDash = _sheet('Dashboard'); // خام اختياري

  // 1) Sheet1
  s1.appendRow([
    now,
    'V120_AUTO',
    'اليوم',
    'الأسبوع',
    source,
    data.accNum || '',
    data.cardNum || '',
    Number(data.amount) || 0,
    data.merchant || '',
    data.category || '',
    data.type || '',
    raw
  ]);

  // 2) Budgets — تجاهل التحويل الداخلي (لا يُحسب مصروف/دخل)
  var internal = SOV1_isInternalTransfer_(data);
  var bRem = 0;

  if (!internal) {
    try {
      ensureBudgetRowExists_(data.category);

      // Batch read
      var bData = sB.getDataRange().getValues();
      var rowIdx = -1;
      for (var i = 1; i < bData.length; i++) {
        if (String(bData[i][0] || '') === String(data.category || '')) { rowIdx = i + 1; break; }
      }

      if (rowIdx > 0) {
        var curSpent = Number(bData[rowIdx - 1][2]) || 0;
        var delta = data.isIncoming ? -(Number(data.amount) || 0) : (Number(data.amount) || 0);
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
    } catch (eB) {}
  }

  // 3) Debt_Ledger — ✅ تحديث الرصيد في العمود E
  var dBal = 0;
  try {
    if (internal) {
      var amt = Number(data.amount) || 0;
      var party = data.merchant || 'تحويل داخلي';
      var debtor = data.isIncoming ? amt : 0;    // مدين
      var creditor = data.isIncoming ? 0 : amt;  // دائن
      var desc = (data.isIncoming ? 'حوالة داخلية واردة' : 'حوالة داخلية صادرة') + ' - ' + party;

      // أضف الصف
      sD.appendRow([now, party, debtor, creditor, '', desc]);

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
      try { dBal = Number(sD.getRange(lastRow, 5).getValue()) || 0; } catch (e1) {}
    }
  } catch (eD) {}

  // 4) Dashboard raw (اختياري)
  try {
    sDash.appendRow([now, data.merchant || '', Number(data.amount) || 0, data.category || '', source]);
  } catch (eDash) {}

  return { budget: bRem, debt: dBal, internal: internal };
}
