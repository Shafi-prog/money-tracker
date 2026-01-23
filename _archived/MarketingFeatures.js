/********** Sovereign V1.0 | MarketingFeatures.gs **********/

/**
 * ميزات موجهة للتسويق والبيع
 * Best Practices for Financial Management
 */

/**
 * 1. تصدير تقرير شامل PDF (تحضير للمستقبل)
 */
function exportMonthlyReportPDF() {
  // هذه الميزة تتطلب تكامل مع خدمة خارجية
  // يمكن استخدام Google Docs API لإنشاء PDF
  
  var ui = SpreadsheetApp.getUi();
  ui.alert('قريباً', 'ميزة تصدير PDF ستكون متاحة قريباً في V1.1', ui.ButtonSet.OK);
  
  // TODO: تكامل مع Google Docs API
  // createPDFReport_()
}

/**
 * 2. إشعارات تجاوز الميزانية الذكية
 */
function checkBudgetAlerts() {
  try {
    var sB = _sheet('Budgets');
    var vals = sB.getDataRange().getValues();
    var alerts = [];

    for (var i = 1; i < vals.length; i++) {
      var category = vals[i][0];
      var budget = Number(vals[i][1]) || 0;
      var spent = Number(vals[i][2]) || 0;
      var remaining = Number(vals[i][3]) || 0;

      // تنبيه عند 80%
      if (spent >= budget * 0.8 && spent < budget) {
        alerts.push('⚠️ ' + category + ': اقتربت من حد الميزانية (80%)');
      }
      
      // تنبيه عند التجاوز
      if (spent >= budget) {
        alerts.push('🚨 ' + category + ': تجاوزت الميزانية بـ ' + Math.abs(remaining).toFixed(2) + ' SAR');
      }
    }

    if (alerts.length > 0) {
      var msg = '📊 <b>تنبيهات الميزانية</b>\n\n' + alerts.join('\n');
      sendTelegram_(getHubChatId_(), msg);
    }

    return alerts;
  } catch (e) {
    return [];
  }
}

/**
 * 3. تحليل أنماط الإنفاق (AI-Powered)
 */
function analyzeSpendingPatterns(userId) {
  try {
    var sheetName = userId ? 'User_' + userId : 'Sheet1';
    var s1 = _sheet(sheetName);
    var vals = s1.getDataRange().getValues();

    var patterns = {
      weekday: {},
      timeOfDay: {},
      category: {},
      merchant: {}
    };

    for (var i = 1; i < vals.length; i++) {
      var date = vals[i][0];
      if (!(date instanceof Date)) continue;

      var amount = Number(vals[i][7]) || 0;
      var merchant = vals[i][8] || 'غير محدد';
      var category = vals[i][9] || 'أخرى';

      // تحليل حسب يوم الأسبوع
      var day = date.getDay();
      patterns.weekday[day] = (patterns.weekday[day] || 0) + amount;

      // تحليل حسب وقت اليوم
      var hour = date.getHours();
      var timeSlot = hour < 12 ? 'صباح' : hour < 18 ? 'ظهر' : 'مساء';
      patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + amount;

      // تحليل حسب التصنيف
      patterns.category[category] = (patterns.category[category] || 0) + amount;

      // تحليل حسب التاجر
      patterns.merchant[merchant] = (patterns.merchant[merchant] || 0) + amount;
    }

    return patterns;
  } catch (e) {
    return null;
  }
}

/**
 * 4. توقعات المصروفات القادمة (Predictive Analytics)
 */
function predictNextMonthExpenses(userId) {
  try {
    var sheetName = userId ? 'User_' + userId : 'Sheet1';
    var s1 = _sheet(sheetName);
    var vals = s1.getDataRange().getValues();

    var monthlyTotals = {};

    for (var i = 1; i < vals.length; i++) {
      var date = vals[i][0];
      if (!(date instanceof Date)) continue;

      var amount = Number(vals[i][7]) || 0;
      var type = String(vals[i][10] || '');
      var raw = String(vals[i][11] || '');
      
      var isIncoming = /(وارد|إيداع|استلام)/i.test(type) || /(وارد|إيداع|استلام)/i.test(raw);
      if (isIncoming) continue;

      var monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
    }

    // حساب المتوسط من آخر 3 أشهر
    var keys = Object.keys(monthlyTotals).sort().slice(-3);
    var avg = 0;
    for (var k = 0; k < keys.length; k++) {
      avg += monthlyTotals[keys[k]];
    }
    avg = keys.length > 0 ? avg / keys.length : 0;

    return {
      prediction: avg,
      confidence: keys.length >= 3 ? 'عالية' : keys.length >= 2 ? 'متوسطة' : 'منخفضة',
      basedOn: keys.length + ' شهر'
    };
  } catch (e) {
    return null;
  }
}

/**
 * 5. تقرير شامل للمدير/المالك
 */
function generateExecutiveSummary() {
  try {
    var summary = {
      timestamp: new Date(),
      users: getAllUsers().length,
      totalTransactions: 0,
      totalIncome: 0,
      totalExpense: 0,
      topCategories: [],
      alerts: checkBudgetAlerts()
    };

    var s1 = _sheet('Sheet1');
    var vals = s1.getDataRange().getValues();

    var categoryTotals = {};

    for (var i = 1; i < vals.length; i++) {
      summary.totalTransactions++;
      
      var amount = Number(vals[i][7]) || 0;
      var category = vals[i][9] || 'أخرى';
      var type = String(vals[i][10] || '');
      var raw = String(vals[i][11] || '');
      
      var isIncoming = /(وارد|إيداع|استلام)/i.test(type) || /(وارد|إيداع|استلام)/i.test(raw);

      if (isIncoming) {
        summary.totalIncome += amount;
      } else {
        summary.totalExpense += amount;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      }
    }

    // أعلى 5 تصنيفات
    summary.topCategories = Object.keys(categoryTotals)
      .sort(function(a, b) { return categoryTotals[b] - categoryTotals[a]; })
      .slice(0, 5)
      .map(function(cat) {
        return { category: cat, amount: categoryTotals[cat] };
      });

    return summary;
  } catch (e) {
    return null;
  }
}

/**
 * 6. إرسال تقرير تنفيذي إلى Telegram
 */
function sendExecutiveSummaryToTelegram() {
  var summary = generateExecutiveSummary();
  if (!summary) return;

  var msg = '📊 <b>التقرير التنفيذي - MoneyTracker V1</b>\n\n' +
            '👥 عدد المستخدمين: ' + summary.users + '\n' +
            '📝 إجمالي العمليات: ' + summary.totalTransactions + '\n\n' +
            '💰 إجمالي الإيرادات: ' + summary.totalIncome.toFixed(2) + ' SAR\n' +
            '💸 إجمالي المصروفات: ' + summary.totalExpense.toFixed(2) + ' SAR\n' +
            '📈 الصافي: ' + (summary.totalIncome - summary.totalExpense).toFixed(2) + ' SAR\n\n' +
            '<b>أعلى 5 تصنيفات:</b>\n';

  for (var i = 0; i < summary.topCategories.length; i++) {
    msg += (i + 1) + '. ' + summary.topCategories[i].category + ': ' + 
           summary.topCategories[i].amount.toFixed(2) + ' SAR\n';
  }

  if (summary.alerts.length > 0) {
    msg += '\n<b>⚠️ التنبيهات:</b>\n' + summary.alerts.join('\n');
  }

  sendTelegramLogged_(getHubChatId_(), msg, { parse_mode: 'HTML' });
}

/**
 * 7. إعدادات الإشعارات (Notification Settings)
 */
function setupNotificationTriggers() {
  // حذف المشغلات القديمة
  deleteTriggers_(['checkBudgetAlerts', 'sendExecutiveSummaryToTelegram']);

  // تنبيهات الميزانية: كل 6 ساعات
  ScriptApp.newTrigger('checkBudgetAlerts')
    .timeBased()
    .everyHours(6)
    .create();

  // تقرير تنفيذي: يومي في الساعة 9 صباحاً
  ScriptApp.newTrigger('sendExecutiveSummaryToTelegram')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  safeNotify('✅ تم إعداد مشغلات الإشعارات: تنبيهات كل 6 ساعات + تقرير يومي');
}

/**
 * 8. Best Practice: تنظيف البيانات القديمة
 */
function archiveOldTransactions(monthsToKeep) {
  monthsToKeep = monthsToKeep || 12;
  
  try {
    var s1 = _sheet('Sheet1');
    var vals = s1.getDataRange().getValues();
    
    var cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    
    var archiveSheet = _sheet('Archive');
    if (archiveSheet.getLastRow() === 0) {
      archiveSheet.appendRow(vals[0]); // النسخ headers
    }
    
    var toArchive = [];
    var toKeep = [vals[0]]; // headers
    
    for (var i = 1; i < vals.length; i++) {
      var date = vals[i][0];
      if (date instanceof Date && date < cutoffDate) {
        toArchive.push(vals[i]);
      } else {
        toKeep.push(vals[i]);
      }
    }
    
    if (toArchive.length > 0) {
      // نقل إلى الأرشيف
      var lastRow = archiveSheet.getLastRow();
      archiveSheet.getRange(lastRow + 1, 1, toArchive.length, toArchive[0].length).setValues(toArchive);
      
      // تنظيف Sheet1
      s1.clear();
      s1.getRange(1, 1, toKeep.length, toKeep[0].length).setValues(toKeep);
      
      safeNotify('✅ تم أرشفة ' + toArchive.length + ' عملية أقدم من ' + monthsToKeep + ' شهر');
    } else {
      safeNotify('✅ لا توجد عمليات قديمة للأرشفة');
    }
    
  } catch (e) {
    safeNotify('❌ خطأ في الأرشفة: ' + e.toString());
  }
}
