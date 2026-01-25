
/********** Triggers.gs — مشغلات وجدولة **********
 * يوفر:
 * - setupTimeTriggers()
 * - weeklyReport()
 * - monthlyReport()
 * - insertMonthlySalary()
 **************************************************/

function deleteTriggers_(names) {
  var ts = ScriptApp.getProjectTriggers();
  ts.forEach(function (t) {
    if (names.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
}

function setupTimeTriggers() {
  deleteTriggers_(['weeklyReport', 'monthlyReport', 'insertMonthlySalary']);

  ScriptApp.newTrigger('weeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(20)
    .create();

  ScriptApp.newTrigger('monthlyReport')
    .timeBased()
    .onMonthDay(26)
    .atHour(20)
    .create();

  ScriptApp.newTrigger('insertMonthlySalary')
    .timeBased()
    .onMonthDay(27)
    .atHour(9)
    .create();

  safeNotify('⏰ تم إعداد المشغلات: أسبوعي (السبت)، شهري تقرير (26)، راتب (27).');
}

function insertMonthlySalary() {
  var p = PropertiesService.getScriptProperties();
  var amt = Number(p.getProperty('SALARY_AMOUNT') || ENV.SALARY_AMOUNT || 0) || 0;
  if (amt <= 0) amt = 5000; // افتراضي

  var acc = String(p.getProperty('SALARY_ACCOUNT') || ENV.SALARY_ACCOUNT || '9767');
  var bank = String(p.getProperty('SALARY_BANK') || ENV.SALARY_BANK || 'AlrajhiBank');

  var ai = {
    merchant: 'راتب ' + bank,
    amount: amt,
    currency: 'SAR',
    category: 'الراتب',
    type: 'حوالة',
    isIncoming: true,
    accNum: acc,
    cardNum: ''
  };

  var sync = saveTransaction(ai, 'راتب شهري ' + amt, 'راتب_مجدوَل');
  if (typeof sendTransactionReport === 'function') {
    sendTransactionReport(ai, sync, 'راتب_مجدوَل', 'راتب شهري ' + amt, ENV.CHAT_ID);
  }
}

function weeklyReport() {
  var s1 = _sheet('Sheet1');
  var rows = s1.getDataRange().getValues();
  var now = new Date();
  var day = now.getDay();

  // السبت الحالي
  var todaySat = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((day + 1) % 7));
  var lastSat = new Date(todaySat.getFullYear(), todaySat.getMonth(), todaySat.getDate() - 7);

  var sum = 0, byCat = {};
  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][0];
    if (!(d instanceof Date)) continue;

    if (d >= lastSat && d < todaySat) {
      var amt = Number(rows[i][7]) || 0;
      var cat = String(rows[i][9] || 'أخرى');
      var typ = String(rows[i][10] || '');
      var raw = String(rows[i][11] || '');

      var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
      if (!incoming) {
        sum += Math.max(amt, 0);
        byCat[cat] = (byCat[cat] || 0) + Math.max(amt, 0);
      }
    }
  }

  var lines = Object.keys(byCat).map(function (k) { return '• ' + k + ': ' + byCat[k].toFixed(2); });
  var msg =
    '📅 تقرير أسبوعي (السبت–الجمعة)\n' +
    'إجمالي المصروف: ' + sum.toFixed(2) + ' SAR\n' +
    (lines.length ? ('تفصيل:\n' + lines.join('\n')) : '');

  sendTelegram_(ENV.CHAT_ID, msg);
}

function monthlyReport() {
  var s1 = _sheet('Sheet1');
  var rows = s1.getDataRange().getValues();
  var now = new Date();

  var start = new Date(now.getFullYear(), now.getMonth(), 1);
  var end = new Date(now.getFullYear(), now.getMonth(), 27); // 1–26

  var sum = 0, byCat = {};
  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][0];
    if (!(d instanceof Date)) continue;

    if (d >= start && d < end) {
      var amt = Number(rows[i][7]) || 0;
      var cat = String(rows[i][9] || 'أخرى');
      var typ = String(rows[i][10] || '');
      var raw = String(rows[i][11] || '');

      var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
      if (!incoming) {
        sum += Math.max(amt, 0);
        byCat[cat] = (byCat[cat] || 0) + Math.max(amt, 0);
      }
    }
  }

  var lines = Object.keys(byCat).map(function (k) { return '• ' + k + ': ' + byCat[k].toFixed(2); });
  var msg =
    '📆 تقرير شهري (1–26)\n' +
    'إجمالي المصروف: ' + sum.toFixed(2) + ' SAR\n' +
    (lines.length ? ('تفصيل:\n' + lines.join('\n')) : '');

  sendTelegram_(ENV.CHAT_ID, msg);
}
