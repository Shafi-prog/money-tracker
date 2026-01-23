
/***************
 * Filters.gs
 * فلترة الرسائل غير المالية قبل المعالجة:
 * OTP / Declined / Hold / Pending / Reversed / Refunded ... إلخ
 ***************/

function shouldIgnoreMessageV120_(text) {
  var t = normalizeTextV120_(text);

  // OTP / Verification
  var otp = [
    /\botp\b/i,
    /one\s*time\s*password/i,
    /رمز\s*(التحقق|التفعيل|الدخول|الأمان|السري)/,
    /كود\s*(التحقق|التفعيل)/,
    /لا\s*تشارك\s*(هذا\s*)?الرمز/,
    /\bpasscode\b/i
  ];

  // Declined / Hold / Pending / Reversed / Refunded
  var status = [
    /\bdeclined\b/i,
    /\bdenied\b/i,
    /مرفوض/,
    /تم\s*رفض/,
    /تعذر\s*إتمام/,
    /لم\s*تتم\s*(العملية|المعاملة)/,

    /\bhold\b/i,
    /معلّق/,
    /تعليق/,

    /\bpending\b/i,
    /قيد\s*(الانتظار|المعالجة)/,

    /\breversed\b/i,
    /تم\s*عكس/,
    /استرجاع/,
    /\brefunded\b/i,
    /تم\s*إرجاع/
  ];

  // (اختياري) رسائل تسويقية/تنبيه أمني ليست عمليات
  var nonFinancial = [
    /عرض\s*خاص/,
    /خصم\s*على/,
    /نقاط\s*مكافآت/,
    /تحديث\s*البيانات/,
    /تنبيه\s*أمني/
  ];

  if (matchesAnyV120_(t, otp)) return true;
  if (matchesAnyV120_(t, status)) return true;
  if (matchesAnyV120_(t, nonFinancial)) return true;

  return false;
}

function normalizeTextV120_(text) {
  return String(text || "")
    .replace(/\u200f|\u200e/g, "")  // اتجاه
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAnyV120_(text, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    if (patterns[i].test(text)) return true;
  }
  return false;
}
