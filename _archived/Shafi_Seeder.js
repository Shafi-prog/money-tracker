
/********** Shafi_Seeder.gs — زرع مرة واحدة (Accounts + Templates + Filters) **********
 * شغّل: SHAFI_seedAllOnce_()
 * ملاحظة: لا يحذف شيئًا؛ فقط يضيف إذا غير موجود.
 ****************************************************************************************/

function SHAFI_seedAllOnce_() {
  SHAFI_seedAccounts_();
  SHAFI_seedTemplates_();
  safeNotify('✅ تم زرع الحسابات والقوالب بنجاح. انتقل للواجهة/الشيت للمراجعة.');
}

/** ===================== Accounts ===================== */
function SHAFI_seedAccounts_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  var existing = {};
  var last = sh.getLastRow();
  if (last >= 2) {
    sh.getRange(2,1,last-1,7).getValues().forEach(function(r){
      var key = String(r[2]||'') + '|' + String(r[3]||'');
      existing[key] = true;
    });
  }

  var rows = [
    // الراجحي
    ['الراجحي 9767', 'بنك',  '9767', 'AlrajhiBank', 'الراجحي,alrajhi,من:9767,من9767', true, false],
    ['الراجحي 9765', 'بنك',  '9765', 'AlrajhiBank', 'من:9765,من9765', true, false],

    // حساب/بطاقات D360 (حسب أمثلتك)
    ['بطاقة مدى *3449', 'بطاقة', '3449', 'D360 Bank', 'D360, d360, mada, Mada, *3449', true, false],
    ['بطاقة مدى *4912', 'بطاقة', '4912', 'D360 Bank', 'D360, d360, Apple Pay, آبل باي, *4912', true, false],

    // وجهة داخلية/محفظة (تحويلات داخلية)
    ['محفظة Tiqmo', 'محفظة', '', 'tiqmo', 'Tiqmo,tiqmo,تيقمو', true, true],
    ['حساب/وجهة *7815', 'محفظة', '7815', 'tiqmo', 'إلى:*7815,الى:*7815,*7815', true, true],

    // STC Bank
    ['بطاقة STC *3281', 'بطاقة', '3281', 'STC Bank', 'stc,stcpay,stc bank,***3281,*3281', true, false],
    ['بطاقة VISA *4495', 'بطاقة', '4495', 'STC Bank', 'visa,***4495,*4495', true, false],

    // MasterCard **0305 (Apple Pay)
    ['MasterCard **0305', 'بطاقة', '0305', 'MasterCard', 'mastercard,apple pay,0305,Card No. (last 4 digit): 0305', true, false],

    // Account No. **9682 (من الرسالة الإنجليزية)
    ['حساب **9682', 'بنك', '9682', 'MasterCard', 'Account No.: **9682,9682', true, false]
  ];

  var toAdd = [];
  rows.forEach(function(r){
    var key = String(r[2]||'') + '|' + String(r[3]||'');
    if (!existing[key]) toAdd.push(r);
  });

  if (toAdd.length) {
    sh.getRange(sh.getLastRow()+1, 1, toAdd.length, 7).setValues(toAdd);
  }
}

/** ===================== Templates ===================== */
function SHAFI_seedTemplates_() {
  var sh = _sheet('Sms_Templates');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['مفعل', 'الجهة', 'Regex', 'map']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  // لمنع تكرار نفس Regex
  var existing = {};
  var last = sh.getLastRow();
  if (last >= 2) {
    sh.getRange(2,1,last-1,4).getValues().forEach(function(r){
      existing[String(r[2]||'')] = true;
    });
  }

  var rows = [

    // ========= D360 Bank =========
    [true, 'D360 Bank',
      'شراء\\s+انترنت[\\s\\S]*?مبلغ:\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?بطاقة:\\s*\\*?(\\d{3,4})\\s*-\\s*(mada|Mada|VISA|Visa).*?[\\s\\S]*?لدى:\\s*(.+?)[\\s\\S]*?في:\\s*(\\d{1,2}:\\d{2}(?::\\d{2})?)\\s*(\\d{4}-\\d{2}-\\d{2})',
      'amount=1;card=2;merchant=4;time=5;date=6'
    ],

    [true, 'D360 Bank',
      'شراء\\s+دولي[\\s\\S]*?مبلغ:\\s*KWD\\s*[\\d,\\.]+\\s*\\(SAR\\s*([\\d,\\.]+)\\)[\\s\\S]*?بطاقة:\\s*\\*?(\\d{3,4}).*?[\\s\\S]*?لدى:\\s*(.+?)[\\s\\S]*?في:\\s*(\\d{1,2}:\\d{2}(?::\\d{2})?)\\s*(\\d{4}-\\d{2}-\\d{2})',
      'amount=1;card=2;merchant=3;time=4;date=5'
    ],

    [true, 'D360 Bank',
      'سحب\\s+نقدي[\\s\\S]*?مبلغ:\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?بطاقة:\\s*\\*?(\\d{3,4}).*?[\\s\\S]*?لدى:\\s*(.+?)[\\s\\S]*?في:\\s*(\\d{1,2}:\\d{2}(?::\\d{2})?)\\s*(\\d{4}-\\d{2}-\\d{2})',
      'amount=1;card=2;merchant=3;time=4;date=5'
    ],

    [true, 'D360 Bank',
      '(?:اضافة|إضافة)\\s+باستخدام\\s+آبل\\s+باي[\\s\\S]*?مبلغ:?\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?بطاقة:?\\s*\\*?(\\d{3,4}).*?[\\s\\S]*?إلى:?\\s*\\*?(\\d{3,4})[\\s\\S]*?في:?\\s*(\\d{2}\\/\\d{2}\\/\\d{4})\\s*(\\d{1,2}:\\d{2}(?::\\d{2})?)',
      'amount=1;card=2;merchant=3;date=4;time=5'
    ],

    // ========= AlrajhiBank =========
    [true, 'AlrajhiBank',
      'حوالة\\s+داخلية\\s+صادرة[\\s\\S]*?من\\s*:?\\s*(\\d{4})[\\s\\S]*?بـ\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?لـ\\s*(\\d{3,4});?\\s*(.+?)[\\s\\S]*?(\\d{1,2}\\/\\d{1,2}\\/\\d{2})\\s*(\\d{1,2}:\\d{2})',
      'card=1;amount=2;merchant=4;date=5;time=6'
    ],

    [true, 'AlrajhiBank',
      'حوالة\\s+محلية\\s+صادرة[\\s\\S]*?من:\\s*(\\d{4})[\\s\\S]*?مبلغ:?\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?الى:\\s*(.+?)[\\s\\S]*?الرسوم:?\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?(\\d{1,2}\\/\\d{1,2}\\/\\d{2})\\s*(\\d{1,2}:\\d{2})',
      'card=1;amount=2;merchant=3;date=5;time=6'
    ],

    [true, 'AlrajhiBank',
      'شراء\\s+انترنت[\\s\\S]*?بطاقة:\\s*(\\d{3,4}).*?[\\s\\S]*?من:?\\s*(\\d{4})[\\s\\S]*?مبلغ:?\\s*SAR\\s*([\\d,\\.]+)[\\s\\S]*?لدى:?\\s*(.+?)[\\s\\S]*?(\\d{1,2}[\\/\\\\]\\d{1,2}[\\/\\\\]\\d{2,4})\\s*(\\d{1,2}:\\d{2})',
      'card=1;amount=3;merchant=4;date=5;time=6'
    ],

    // ========= MasterCard / Apple Pay (Arabic POS) =========
    [true, 'MasterCard',
      'شراء\\s+POS\\s*\\n?\\s*بـ\\s*(\\d[\\d\\.,]*)\\s*SAR\\s*\\n?\\s*من\\s+(.+?)\\s*\\n?\\s*عبر\\s+.*?\\*\\*(\\d{3,6}).*?في\\s+(\\d{4}-\\d{2}-\\d{2})\\s+(\\d{2}:\\d{2}:\\d{2})',
      'amount=1;merchant=2;card=3;date=4;time=5'
    ],

    // ========= English online purchase with total SAR =========
    [true, 'MasterCard',
      'Online\\s+Purchase\\s+Amount[\\s\\S]*?Total\\s*([\\d,\\.]+)\\s*SAR[\\s\\S]*?Website\\s+or\\s+store\\s*:\\s*(.+?)[\\s\\S]*?last\\s+4\\s+digit\\)?:\\s*(\\d{4})[\\s\\S]*?Date:\\s*(\\d{4}-\\d{2}-\\d{2})[\\s\\S]*?Time:\\s*(\\d{2}:\\d{2}:\\d{2})',
      'amount=1;merchant=2;card=3;date=4;time=5'
    ],

    // ========= tiqmo Add money (Arabic) =========
    [true, 'tiqmo',
      '(إضافة\\s+أموال)[\\s\\S]*?مبلغ\\s*([\\d,\\.]+)\\s*(?:ريال|ر\\.س)[\\s\\S]*?في\\s*(\\d{4}-\\d{2}-\\d{2})\\s*(\\d{2}:\\d{2}:\\d{2})',
      'merchant=1;amount=2;date=3;time=4'
    ],

    // ========= STC Bank Apple Pay =========
    [true, 'STC Bank',
      'شراء\\s+Apple\\s*Pay[\\s\\S]*?عبر:\\*?(\\d{3,4})[\\s\\S]*?بـ:?\\s*([\\d,\\.]+)\\s*SAR[\\s\\S]*?من:\\s*(.+?)[\\s\\S]*?في:\\s*(\\d{1,2}\\/\\d{1,2}\\/\\d{2})\\s*(\\d{1,2}:\\d{2})',
      'card=1;amount=2;merchant=3;date=4;time=5'
    ]
  ];

  var toAdd = [];
  rows.forEach(function(r){
    if (!existing[r[2]]) toAdd.push(r);
  });

  if (toAdd.length) {
    sh.getRange(sh.getLastRow()+1, 1, toAdd.length, 4).setValues(toAdd);
  }
}

/** ===================== Filters (اقتراح) ===================== */
/**
 * استخدم هذه الدالة في Ingress.gs و UI submit لتجاهل:
 * OTP / رفض / حجز مؤقت HOLD
 */
function SHAFI_isIgnorableMessage_(text) {
  var t = String(text||'').toLowerCase();
  return (
    t.indexOf('رمز التحقق') >= 0 ||
    t.indexOf('otp') >= 0 ||
    t.indexOf('رمز مؤقت') >= 0 ||
    t.indexOf('رمز التحقق (otp)') >= 0 ||
    t.indexOf('عملية مرفوضة') >= 0 ||
    t.indexOf('رصيد غير كافي') >= 0 ||
    t.indexOf('declined') >= 0 ||
    t.indexOf('timeout') >= 0 ||
    t.indexOf('رقم سري خاطئ') >= 0 ||
    t.indexOf('just a hold') >= 0 ||
    t.indexOf('will be released') >= 0
  );
}
