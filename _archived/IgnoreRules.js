
/********** IgnoreRules.gs — تجاهل نهائي لرسائل غير مالية **********/

function SOV1_isIgnorableMessage_(text) {
  var t = String(text || '').toLowerCase();

  // OTP / رمز تحقق
  if (t.indexOf('رمز التحقق') >= 0) return true;
  if (t.indexOf('otp') >= 0) return true;
  if (t.indexOf('رمز مؤقت') >= 0) return true;
  if (t.indexOf('رمز التحقق (otp)') >= 0) return true;

  // رفض/فشل
  if (t.indexOf('عملية مرفوضة') >= 0) return true;
  if (t.indexOf('رصيد غير كافي') >= 0) return true;
  if (t.indexOf('لا يوجد رصيد') >= 0) return true;
  if (t.indexOf('رقم سري خاطئ') >= 0) return true;
  if (t.indexOf('declined') >= 0) return true;
  if (t.indexOf('timeout') >= 0) return true;
  if (t.indexOf('فشل') >= 0) return true;

  // Hold / حجز مؤقت
  if (t.indexOf('just a hold') >= 0) return true;
  if (t.indexOf('will be released') >= 0) return true;
  if (t.indexOf('hold on your card') >= 0) return true;

  return false;
}
