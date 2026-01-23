
/********** Sovereign — إصدار ١ | Core_Utils.gs **********
 * دوال مساعدة مشتركة:
 * - قراءة/كتابة Script Properties
 * - إخراج JSON للويبهوك
 * - تنبيه آمن (UI أو تيليجرام أو Console)
 * - تطبيع الأرقام العربية إلى الإنجليزية
 * - سجل أخطاء/منع فقط إلى ورقة Ingress_Debug
 *******************************************************/

/** قراءة خاصية من Script Properties */
function _prop_(k, fallback) {
  try {
    var v = PropertiesService.getScriptProperties().getProperty(String(k));
    return (v !== null && v !== undefined && String(v).length) ? v : (fallback || '');
  } catch (e) {
    return (fallback || '');
  }
}

/** كتابة خاصية في Script Properties */
function setProp_(k, v) {
  PropertiesService.getScriptProperties().setProperty(String(k), String(v));
}

/** إخراج JSON قياسي للـ Webhook */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj || {}))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * تنبيه آمن:
 * - داخل Spreadsheet UI: alert
 * - خارج UI: Telegram (إن توفر) أو console.log
 */
function safeNotify(msg, optChatId) {
  msg = String(msg || '');
  try {
    SpreadsheetApp.getUi().alert(msg);
    return;
  } catch (e) {
    // ignore (no UI context)
  }
  try {
    if (typeof sendTelegram_ === 'function') {
      sendTelegram_(optChatId || (ENV && ENV.CHAT_ID) || '', msg);
      return;
    }
  } catch (e2) {
    // ignore
  }
  console.log(msg);
}

/** تحويل الأرقام العربية إلى الإنجليزية + توحيد الفواصل */
function normalizeNumber_(s) {
  s = String(s || '').trim();
  var map = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '٫': '.', '٬': ','
  };
  // استبدال الأرقام العربية والنقط/الفواصل العربية
  s = s.replace(/[٠-٩٫٬]/g, function (ch) { return map[ch] || ch; });
  return s;
}

/**
 * سجل أخطاء/منع فقط في ورقة Ingress_Debug (لا يلوّث Sheet1)
 * الأعمدة: الوقت | المستوى | المسار | بيانات | نص مختصر
 */
function logIngressEvent_(level, where, meta, raw) {
  try {
    var sh = _sheet('Ingress_Debug');

    // إنشاء الهيدر إن لم يوجد
    if (sh.getLastRow() === 0) {
      sh.appendRow(['الوقت', 'المستوى', 'المسار', 'بيانات', 'نص مختصر']);
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
      sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
    }

    // meta إلى JSON آمن
    var metaStr = '';
    try {
      metaStr = JSON.stringify(meta || {});
    } catch (e) {
      metaStr = String(meta || '');
    }

    sh.appendRow([
      new Date(),
      String(level || ''),
      String(where || ''),
      metaStr.slice(0, 1200),
      String(raw || '').slice(0, 900)
    ]);
  } catch (e2) {
    // لا نكسر التنفيذ بسبب فشل logging
  }
}

/** قفل نظامي اختياري لمنع تداخل عمليات حساسة (إن احتجته لاحقًا) */
function withScriptLock_(msWait, fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(msWait || 20000);
  try {
    return fn();
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** تنسيق تاريخ بشكل ثابت */
function formatDate_(d, pattern) {
  try {
    if (!(d instanceof Date)) return '';
    return Utilities.formatDate(d, Session.getScriptTimeZone(), pattern || 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    return '';
  }
}
