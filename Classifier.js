/********** SJA-V1 | Classifier.js – Smart Classification (Shafi Jahz Almutiry) **********/

function applyClassifierMap_(rawText, ai) {
  try {
    var sMap = _sheet('Classifier_Map');
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
        break;
      }
    }
  } catch (e) { /* ignore */ }

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
      var m1 = text.match(/لدى[:،]?\s*([^\n]+)/i) || text.match(/لـ\d+;([^\n]+)/i);
      if (m1) merchant = String(m1[1] || '').trim();
      if (merchant) ai.merchant = merchant;
    }

    // العملة
    var currency = detectCurrency_(text);
    if (currency) ai.currency = currency;

    // تصنيف حسب العملة
    if (currency && currency !== 'SAR' && (!ai.category || ai.category === 'أخرى')) {
      ai.category = 'مشتريات خارجية';
      ai.type = ai.type || 'مشتريات';
    }

    // قواعد أساسية
    if (/سداد|فاتورة|stc|كهرباء|مياه/i.test(t)) {
      ai.category = ai.category || 'فواتير';
      ai.type = ai.type || 'سداد';
    } else if (/pos|mada|مدى|شراء|apple\s*pay|applepay|payment/i.test(t)) {
      ai.category = ai.category || 'مشتريات عامة';
      ai.type = ai.type || 'مشتريات';
    } else if (/تحويل|حوالة/i.test(t)) {
      ai.type = ai.type || 'حوالة';
      if (/وارد|استلام|إيداع|راتب/i.test(t)) {
        ai.category = ai.category || 'حوالات واردة';
        ai.isIncoming = true;
      } else if (/صادر|خصم|إلى/i.test(t)) {
        ai.category = ai.category || 'حوالات صادرة';
        ai.isIncoming = false;
      }
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
