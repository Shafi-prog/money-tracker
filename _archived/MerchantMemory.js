
/********** MerchantMemory.gs — ذاكرة التاجر لتثبيت التصنيف **********
 * الفكرة: لو التاجر معروف سابقًا → نفس التصنيف دائمًا مهما تغيّر AI.
 * الورقة: Merchant_Map
 * الأعمدة: التاجر_مُطبّع | اسم_التاجر | التصنيف | النوع | مرات | آخر_ظهور
 ********************************************************************/

function SOV1_normMerchantKey_(merchant) {
  merchant = String(merchant || '').trim().toLowerCase();
  merchant = merchant.replace(/[\u200E\u200F]/g, '');
  merchant = merchant.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  merchant = merchant.replace(/\s+/g, ' ').trim();
  // كلمات عامة
  merchant = merchant.replace(/\b(co|company|ltd|sa|ksa)\b/g, '').replace(/\s+/g, ' ').trim();
  return merchant.slice(0, 120);
}

function SOV1_ensureMerchantMapSheet_() {
  var sh = _sheet('Merchant_Map');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['التاجر_مُطبّع', 'اسم_التاجر', 'التصنيف', 'النوع', 'مرات', 'آخر_ظهور']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  return sh;
}

/** إرجاع تصنيف ثابت إذا وجد */
function SOV1_getMerchantMemory_(merchantName) {
  var key = SOV1_normMerchantKey_(merchantName);
  if (!key) return null;

  var cache = CacheService.getScriptCache();
  var c = cache.get('MM_' + key);
  if (c) { try { return JSON.parse(c); } catch(e){} }

  var sh = SOV1_ensureMerchantMapSheet_();
  var last = sh.getLastRow();
  if (last < 2) return null;

  var data = sh.getRange(2, 1, last - 1, 6).getValues();
  for (var i=0; i<data.length; i++) {
    if (String(data[i][0] || '') === key) {
      var obj = { category: String(data[i][2]||''), type: String(data[i][3]||'') };
      cache.put('MM_' + key, JSON.stringify(obj), 3600);
      return obj;
    }
  }
  return null;
}

/** حفظ/تحديث ذاكرة التاجر (تُستدعى بعد التسجيل أو بعد تعديل التصنيف يدويًا) */
function SOV1_upsertMerchantMemory_(merchantName, category, type) {
  var key = SOV1_normMerchantKey_(merchantName);
  merchantName = String(merchantName || '').trim();
  category = String(category || '').trim();
  type = String(type || '').trim();
  if (!key || !category) return;

  var sh = SOV1_ensureMerchantMapSheet_();
  var last = sh.getLastRow();

  if (last >= 2) {
    var data = sh.getRange(2, 1, last - 1, 6).getValues();
    for (var i=0; i<data.length; i++) {
      if (String(data[i][0] || '') === key) {
        var row = i + 2;
        var hits = Number(data[i][4] || 0) + 1;
        sh.getRange(row, 2).setValue(merchantName);
        sh.getRange(row, 3).setValue(category);
        sh.getRange(row, 4).setValue(type);
        sh.getRange(row, 5).setValue(hits);
        sh.getRange(row, 6).setValue(new Date());
        CacheService.getScriptCache().put('MM_' + key, JSON.stringify({category:category, type:type}), 3600);
        return;
      }
    }
  }

  // لم يوجد — أضف صف جديد
  sh.appendRow([key, merchantName, category, type, 1, new Date()]);
  CacheService.getScriptCache().put('MM_' + key, JSON.stringify({category:category, type:type}), 3600);
}
