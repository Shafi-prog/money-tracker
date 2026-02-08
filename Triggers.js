
/********** Triggers.gs — مشغلات وجدولة **********
 * يوفر:
 * - setupTimeTriggers()
 * - dailyReport()    - يومي الساعة 11 مساءً
 * - weeklyReport()   - أسبوعي السبت 8 مساءً
 * - monthlyReport()  - شهري يوم 26 الساعة 8 مساءً
 * - insertMonthlySalary()
 **************************************************/

function deleteTriggers_(names) {
  var ts = ScriptApp.getProjectTriggers();
  ts.forEach(function (t) {
    if (names.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
}

function setupTimeTriggers() {
  deleteTriggers_(['dailyReport', 'weeklyReport', 'monthlyReport', 'insertMonthlySalary', 'SOV1_processQueueBatch_']);

  // التقرير اليومي - كل يوم الساعة 11 مساءً (23:00)
  ScriptApp.newTrigger('dailyReport')
    .timeBased()
    .atHour(23)
    .everyDays(1)
    .create();

  // التقرير الأسبوعي - السبت الساعة 8 مساءً
  ScriptApp.newTrigger('weeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(20)
    .create();

  // التقرير الشهري - يوم 26 الساعة 8 مساءً
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

  // Queue Processing (Every 5 Minutes - optimized)
  ScriptApp.newTrigger('SOV1_processQueueBatch_')
    .timeBased()
    .everyMinutes(5)
    .create();

  safeNotify('⏰ تم إعداد المشغلات:\n• يومي (11 مساءً)\n• أسبوعي (السبت 8م)\n• شهري (26 الساعة 8م)\n• راتب (27 الساعة 9ص)\n• معالج الطابور (كل 5 دقائق)');
}

/**
 * التقرير اليومي - يُرسل الساعة 11 مساءً
 * يعرض ملخص مصروفات اليوم والرصيد الحالي
 */
function dailyReport() {
  var chatId = ENV.CHAT_ID || ENV.CHANNEL_ID;
  if (!chatId) return;
  
  var s1 = _sheet('Sheet1');
  var rows = s1.getDataRange().getValues();
  var now = new Date();
  
  // بداية اليوم
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  var totalExpense = 0, totalIncome = 0, byCat = {}, txCount = 0, incomeCount = 0;
  var topMerchants = {};
  
  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][0];
    if (!(d instanceof Date)) continue;
    
    if (d >= todayStart && d <= todayEnd) {
      var amt = Number(rows[i][7]) || 0;
      var cat = String(rows[i][9] || 'أخرى');
      var merchant = String(rows[i][6] || 'غير محدد');
      var typ = String(rows[i][10] || '');
      var raw = String(rows[i][11] || '');
      
      var incoming = /(وارد|إيداع|استلام|راتب|incoming|salary)/i.test(typ) || 
                     /(وارد|إيداع|استلام|راتب)/i.test(raw) ||
                     rows[i][8] === true;
      
      if (incoming) {
        totalIncome += Math.max(amt, 0);
        incomeCount++;
      } else {
        totalExpense += Math.max(amt, 0);
        byCat[cat] = (byCat[cat] || 0) + Math.max(amt, 0);
        topMerchants[merchant] = (topMerchants[merchant] || 0) + Math.max(amt, 0);
        txCount++;
      }
    }
  }
  
  // جلب الأرصدة الحالية - عرض كل الحسابات حتى الصفرية
  var balanceItems = [];
  var totalBalance = 0;
  try {
    if (typeof getAllBalances_ === 'function') {
      var balances = getAllBalances_();
      for (var key in balances) {
        if (!balances.hasOwnProperty(key)) continue;
        var b = balances[key] || {};
        var bal = Number(b.balance || 0);
        totalBalance += Math.max(bal, 0);
        var name = b.name || key;
        // Get bank icon based on bank name
        var icon = '🏦';
        var nameLower = String(name + ' ' + (b.bank || '')).toLowerCase();
        if (/rajhi|الراجحي/i.test(nameLower)) icon = '🏛️';
        else if (/stc|اس تي سي/i.test(nameLower)) icon = '📱';
        else if (/tiqmo|تيكمو/i.test(nameLower)) icon = '💳';
        else if (/saib|سايب/i.test(nameLower)) icon = '🏦';
        else if (/d360/i.test(nameLower)) icon = '💰';
        
        balanceItems.push({ icon: icon, name: name, balance: bal, bank: b.bank || '' });
      }
    }
  } catch (e) { /* ignore */ }
  
  // Sort balances
  balanceItems.sort(function(a, b) { return b.balance - a.balance; });
  
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  var dayName = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][now.getDay()];
  
  // Build beautiful report
  var msg = '╔═══════════════════════════╗\n';
  msg += '║   🌙 تقرير نهاية اليوم    ║\n';
  msg += '╚═══════════════════════════╝\n\n';
  
  msg += '📅 ' + dayName + ' ' + dateStr + '\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  if (txCount === 0 && incomeCount === 0) {
    msg += '✨ لا توجد عمليات مالية اليوم\n';
    msg += '💤 يوم هادئ بدون مصاريف!\n';
  } else {
    // Expenses section
    if (totalExpense > 0) {
      msg += '💸 المصروفات\n';
      msg += '   المجموع: ' + totalExpense.toFixed(2) + ' SAR\n';
      msg += '   العمليات: ' + txCount + ' عملية\n\n';
      
      // Top categories
      var catLines = Object.keys(byCat)
        .sort(function(a,b){ return byCat[b] - byCat[a]; })
        .slice(0, 5);
      
      if (catLines.length > 0) {
        msg += '📊 التوزيع:\n';
        for (var c = 0; c < catLines.length; c++) {
          var catName = catLines[c];
          var catIcon = getCategoryIcon_(catName);
          var pct = ((byCat[catName] / totalExpense) * 100).toFixed(0);
          msg += '   ' + catIcon + ' ' + catName + ': ' + byCat[catName].toFixed(2) + ' (' + pct + '%)\n';
        }
        msg += '\n';
      }
    }
    
    // Income section
    if (totalIncome > 0) {
      msg += '💰 الدخل\n';
      msg += '   المجموع: ' + totalIncome.toFixed(2) + ' SAR\n';
      msg += '   العمليات: ' + incomeCount + ' عملية\n\n';
    }
    
    // Net
    var net = totalIncome - totalExpense;
    msg += '📈 الصافي: ' + (net >= 0 ? '+' : '') + net.toFixed(2) + ' SAR\n';
  }
  
  // Balances table
  if (balanceItems.length > 0) {
    msg += '\n╔═══════════════════════════╗\n';
    msg += '║    💳 أرصدة الحسابات      ║\n';
    msg += '╠═══════════════════════════╣\n';
    
    for (var b = 0; b < balanceItems.length; b++) {
      var item = balanceItems[b];
      var displayName = String(item.name).substring(0, 12);
      msg += '║ ' + item.icon + ' ' + displayName;
      var pad = 14 - displayName.length;
      for (var p = 0; p < pad; p++) msg += ' ';
      msg += item.balance.toFixed(2) + ' ║\n';
    }
    
    msg += '╠═══════════════════════════╣\n';
    msg += '║ 💰 الإجمالي: ' + totalBalance.toFixed(2) + ' ║\n';
    msg += '╚═══════════════════════════╝';
  }
  
  sendTelegram_(chatId, msg);
}

/**
 * Get emoji icon for category
 */
function getCategoryIcon_(category) {
  var cat = String(category || '').toLowerCase();
  if (/طعام|مطعم|food/i.test(cat)) return '🍔';
  if (/بقالة|grocery/i.test(cat)) return '🛒';
  if (/وقود|بنزين|fuel/i.test(cat)) return '⛽';
  if (/نقل|مواصلات|transport/i.test(cat)) return '🚗';
  if (/فاتورة|bill/i.test(cat)) return '🧾';
  if (/ترفيه|entertainment/i.test(cat)) return '🎬';
  if (/صحة|health/i.test(cat)) return '💊';
  if (/ملابس|clothes/i.test(cat)) return '👕';
  if (/تقنية|tech/i.test(cat)) return '📱';
  if (/تعليم|education/i.test(cat)) return '📚';
  if (/سفر|travel/i.test(cat)) return '✈️';
  if (/هدايا|gift/i.test(cat)) return '🎁';
  if (/اشتراك|subscription/i.test(cat)) return '📺';
  if (/حوالات|transfer/i.test(cat)) return '💸';
  return '📦';
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

  // Sort categories by amount
  var catLines = Object.keys(byCat)
    .sort(function(a, b) { return byCat[b] - byCat[a]; })
    .slice(0, 8);
  
  var msg = '╔═══════════════════════════╗\n';
  msg += '║   📅 تقرير الأسبوع        ║\n';
  msg += '╚═══════════════════════════╝\n\n';
  
  msg += '📆 الفترة: السبت - الجمعة\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  msg += '💸 إجمالي المصروفات: ' + sum.toFixed(2) + ' SAR\n\n';
  
  if (catLines.length > 0) {
    msg += '📊 التوزيع حسب التصنيف:\n';
    for (var c = 0; c < catLines.length; c++) {
      var catName = catLines[c];
      var catIcon = getCategoryIcon_(catName);
      var pct = ((byCat[catName] / sum) * 100).toFixed(0);
      msg += '   ' + catIcon + ' ' + catName + ': ' + byCat[catName].toFixed(2) + ' (' + pct + '%)\n';
    }
  }
  
  // Add balances
  var balancesTable = buildReportBalancesTable_();
  if (balancesTable) {
    msg += '\n' + balancesTable;
  }

  sendTelegram_(ENV.CHAT_ID, msg);
}

function monthlyReport() {
  var s1 = _sheet('Sheet1');
  var rows = s1.getDataRange().getValues();
  var now = new Date();

  var start = new Date(now.getFullYear(), now.getMonth(), 1);
  var end = new Date(now.getFullYear(), now.getMonth(), 27); // 1–26

  var sum = 0, byCat = {}, income = 0, txCount = 0;
  for (var i = 1; i < rows.length; i++) {
    var d = rows[i][0];
    if (!(d instanceof Date)) continue;

    if (d >= start && d < end) {
      var amt = Number(rows[i][7]) || 0;
      var cat = String(rows[i][9] || 'أخرى');
      var typ = String(rows[i][10] || '');
      var raw = String(rows[i][11] || '');

      var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
      if (incoming) {
        income += Math.max(amt, 0);
      } else {
        sum += Math.max(amt, 0);
        byCat[cat] = (byCat[cat] || 0) + Math.max(amt, 0);
        txCount++;
      }
    }
  }

  var catLines = Object.keys(byCat)
    .sort(function(a, b) { return byCat[b] - byCat[a]; })
    .slice(0, 10);
  
  var monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  
  var msg = '╔═══════════════════════════╗\n';
  msg += '║   📆 تقرير الشهر          ║\n';
  msg += '╚═══════════════════════════╝\n\n';
  
  msg += '📅 ' + monthNames[now.getMonth()] + ' ' + now.getFullYear() + '\n';
  msg += '━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  msg += '💰 الدخل: ' + income.toFixed(2) + ' SAR\n';
  msg += '💸 المصروفات: ' + sum.toFixed(2) + ' SAR\n';
  msg += '📈 الصافي: ' + (income >= sum ? '+' : '') + (income - sum).toFixed(2) + ' SAR\n';
  msg += '🔢 عدد العمليات: ' + txCount + '\n\n';
  
  if (catLines.length > 0) {
    msg += '📊 أعلى التصنيفات:\n';
    for (var c = 0; c < catLines.length; c++) {
      var catName = catLines[c];
      var catIcon = getCategoryIcon_(catName);
      var pct = ((byCat[catName] / sum) * 100).toFixed(0);
      msg += '   ' + catIcon + ' ' + catName + ': ' + byCat[catName].toFixed(2) + ' (' + pct + '%)\n';
    }
  }
  
  // Savings rate
  if (income > 0) {
    var savingsRate = ((income - sum) / income * 100).toFixed(0);
    msg += '\n💾 نسبة الادخار: ' + savingsRate + '%\n';
    if (savingsRate >= 20) {
      msg += '🎉 ممتاز! تجاوزت هدف 20%\n';
    } else if (savingsRate >= 10) {
      msg += '👍 جيد! حافظ على هذا المستوى\n';
    } else if (savingsRate > 0) {
      msg += '⚠️ حاول زيادة نسبة الادخار\n';
    } else {
      msg += '🚨 المصروفات تجاوزت الدخل!\n';
    }
  }
  
  // Add balances
  var balancesTable = buildReportBalancesTable_();
  if (balancesTable) {
    msg += '\n' + balancesTable;
  }

  sendTelegram_(ENV.CHAT_ID, msg);
}

/**
 * Build balances table for reports
 */
function buildReportBalancesTable_() {
  try {
    if (typeof getAllBalances_ !== 'function') return '';
    var balances = getAllBalances_();
    if (!balances) return '';

    var items = [];
    var totalBalance = 0;
    
    for (var key in balances) {
      if (!balances.hasOwnProperty(key)) continue;
      var b = balances[key] || {};
      var bal = Number(b.balance || 0);
      // عرض كل الحسابات حتى الصفرية
      totalBalance += Math.max(bal, 0);
      var name = b.name || key;
      var icon = '🏦';
      var nameLower = String(name + ' ' + (b.bank || '')).toLowerCase();
      if (/rajhi|الراجحي/i.test(nameLower)) icon = '🏛️';
      else if (/stc|اس تي سي/i.test(nameLower)) icon = '📱';
      else if (/tiqmo|تيكمو/i.test(nameLower)) icon = '💳';
      else if (/saib|سايب/i.test(nameLower)) icon = '🏦';
      else if (/d360/i.test(nameLower)) icon = '💰';
      
      items.push({ icon: icon, name: name, balance: bal, bank: b.bank || '' });
    }

    if (items.length === 0) return '';
    
    items.sort(function(a, b) { return b.balance - a.balance; });
    
    var table = '╔═══════════════════════════╗\n';
    table += '║    💳 أرصدة الحسابات      ║\n';
    table += '╠═══════════════════════════╣\n';
    
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var displayName = String(item.name).substring(0, 12);
      table += '║ ' + item.icon + ' ' + displayName;
      var pad = 14 - displayName.length;
      for (var p = 0; p < pad; p++) table += ' ';
      table += item.balance.toFixed(2) + ' ║\n';
    }
    
    table += '╠═══════════════════════════╣\n';
    table += '║ 💰 الإجمالي: ' + totalBalance.toFixed(2) + ' ║\n';
    table += '╚═══════════════════════════╝';
    
    return table;
  } catch (e) {
    return '';
  }
}

/**
 * CLI helper: list current project triggers for inspection
 * Returns array: [{handler, triggerSource, eventType, nextRun}] (best-effort)
 */
function LIST_PROJECT_TRIGGERS() {
  try {
    var ts = ScriptApp.getProjectTriggers();
    var out = ts.map(function(t){
      var obj = { handler: t.getHandlerFunction ? t.getHandlerFunction() : 'unknown' };
      try { obj.source = t.getTriggerSource ? String(t.getTriggerSource()) : 'unknown'; } catch (e) { obj.source = 'unknown'; }
      try { obj.eventType = t.getEventType ? String(t.getEventType()) : 'time'; } catch (e) { obj.eventType = 'time'; }
      try { obj.nextRun = t.getNextRunTime ? String(t.getNextRunTime()) : null; } catch (e) { obj.nextRun = null; }
      return obj;
    });
    return { success: true, triggers: out };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

/**
 * Keep only allowed triggers (array of handler names). Deletes others.
 * Use: SOV1_enforceTriggers_(['SOV1_processQueueBatch_','dailyReport','weeklyReport','monthlyReport'])
 */
function SOV1_enforceTriggers_(allowed) {
  allowed = allowed || ['SOV1_processQueueBatch_', 'dailyReport', 'weeklyReport', 'monthlyReport', 'insertMonthlySalary'];
  var ts = ScriptApp.getProjectTriggers();
  var deleted = [];
  ts.forEach(function(t) {
    try {
      var fn = t.getHandlerFunction ? t.getHandlerFunction() : null;
      if (fn && allowed.indexOf(fn) === -1) {
        ScriptApp.deleteTrigger(t);
        deleted.push(fn);
      }
    } catch (e) {}
  });

  return { success: true, deleted: deleted, keep: allowed };
}
