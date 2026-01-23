/**
 * TELEGRAM_COMMANDS_ENHANCED.js
 * أوامر Telegram شاملة - بدون الحاجة للرجوع لـ Google Sheets
 * Complete Telegram commands for full system access
 */

/**
 * معالج الأوامر الرئيسي
 */
function handleTelegramCommand(message) {
  var text = (message.text || '').trim();
  var chatId = message.chat.id;
  
  // إزالة / من بداية الأمر
  var command = text.replace(/^\//, '').toLowerCase();
  
  // الأوامر المتاحة
  var commands = {
    'start': cmdStart,
    'help': cmdHelp,
    'menu': cmdMenu,
    
    // تقارير
    'today': cmdToday,
    'week': cmdWeek,
    'month': cmdMonth,
    'year': cmdYear,
    'summary': cmdSummary,
    
    // الميزانيات
    'budgets': cmdBudgets,
    'budget': cmdBudgetDetails,
    
    // الحسابات
    'accounts': cmdAccounts,
    'balance': cmdBalance,
    
    // الحوالات - جديد
    'transfers': cmdTransfers,
    'debts': cmdDebts,
    
    // الفئات
    'categories': cmdCategories,
    'top': cmdTopSpending,
    
    // البحث
    'search': cmdSearch,
    'last': cmdLastTransactions,
    
    // الإحصائيات
    'stats': cmdStats,
    'trends': cmdTrends,
    
    // إدارة
    'settings': cmdSettings,
    'export': cmdExport
  };
  
  // تنفيذ الأمر
  var handler = commands[command.split(' ')[0]];
  if (handler) {
    return handler(chatId, command, message);
  }
  
  // أمر غير معروف
  return sendTelegramMessage(chatId, '❓ أمر غير معروف. أرسل /help لرؤية الأوامر المتاحة.');
}

/**
 * /start - البداية
 */
function cmdStart(chatId) {
  var text = '👋 مرحباً بك في *SJA MoneyTracker*!\n\n';
  text += 'نظام متكامل لتتبع مصروفاتك تلقائياً 💰\n\n';
  text += '📱 أرسل /menu لرؤية القائمة الرئيسية\n';
  text += '❓ أرسل /help للمساعدة';
  
  return sendTelegramMessage(chatId, text);
}

/**
 * /help - المساعدة
 */
function cmdHelp(chatId) {
  var text = '📖 *دليل الأوامر*\n';
  text += '═══════════════════\n\n';
  
  text += '*📊 التقارير:*\n';
  text += '/today - مصروفات اليوم\n';
  text += '/week - مصروفات الأسبوع\n';
  text += '/month - مصروفات الشهر\n';
  text += '/year - مصروفات السنة\n';
  text += '/summary - ملخص شامل\n\n';
  
  text += '*💰 الميزانيات:*\n';
  text += '/budgets - جميع الميزانيات\n';
  text += '/budget [فئة] - تفاصيل ميزانية معينة\n\n';
  
  text += '*💳 الحسابات:*\n';
  text += '/accounts - قائمة الحسابات\n';
  text += '/balance - الأرصدة\n\n';
  
  text += '*🔄 الحوالات:*\n';
  text += '/transfers - تقرير الحوالات\n';
  text += '/debts - المدينين والدائنين\n\n';
  
  text += '*📈 التحليلات:*\n';
  text += '/categories - التصنيفات\n';
  text += '/top - أكثر الفئات صرفاً\n';
  text += '/stats - إحصائيات\n';
  text += '/trends - الاتجاهات\n\n';
  
  text += '*🔍 البحث:*\n';
  text += '/search [كلمة] - بحث في المعاملات\n';
  text += '/last [عدد] - آخر المعاملات\n\n';
  
  text += '*⚙️ أخرى:*\n';
  text += '/settings - الإعدادات\n';
  text += '/export - تصدير البيانات\n';
  text += '/menu - القائمة الرئيسية';
  
  return sendTelegramMessage(chatId, text);
}

/**
 * /menu - القائمة الرئيسية
 */
function cmdMenu(chatId) {
  var keyboard = {
    inline_keyboard: [
      [
        { text: '📊 اليوم', callback_data: 'cmd_today' },
        { text: '📅 الأسبوع', callback_data: 'cmd_week' },
        { text: '📆 الشهر', callback_data: 'cmd_month' }
      ],
      [
        { text: '💰 الميزانيات', callback_data: 'cmd_budgets' },
        { text: '💳 الحسابات', callback_data: 'cmd_accounts' }
      ],
      [
        { text: '🔄 الحوالات', callback_data: 'cmd_transfers' },
        { text: '📈 الإحصائيات', callback_data: 'cmd_stats' }
      ],
      [
        { text: '🔍 البحث', callback_data: 'cmd_search' },
        { text: '❓ المساعدة', callback_data: 'cmd_help' }
      ]
    ]
  };
  
  return sendTelegramMessage(chatId, '📱 *القائمة الرئيسية*\nاختر ما تريد:', keyboard);
}

/**
 * /today - مصروفات اليوم
 */
function cmdToday(chatId) {
  try {
    var report = generateDailyReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب البيانات: ' + e);
  }
}

/**
 * /week - مصروفات الأسبوع
 */
function cmdWeek(chatId) {
  try {
    var report = generateWeeklyReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب البيانات: ' + e);
  }
}

/**
 * /month - مصروفات الشهر
 */
function cmdMonth(chatId) {
  try {
    var report = generateMonthlyReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب البيانات: ' + e);
  }
}

/**
 * /year - مصروفات السنة
 */
function cmdYear(chatId) {
  try {
    return sendTelegramMessage(chatId, '📊 تقرير السنة قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب البيانات: ' + e);
  }
}

/**
 * /summary - ملخص شامل
 */
function cmdSummary(chatId) {
  try {
    var report = generateMonthlyReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب الملخص: ' + e);
  }
}

/**
 * /transfers - تقرير الحوالات
 */
function cmdTransfers(chatId) {
  try {
    var report = formatTransfersReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب بيانات الحوالات: ' + e);
  }
}

/**
 * /budgets - جميع الميزانيات
 */
function cmdBudgets(chatId) {
  try {
    var report = generateBudgetsReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب الميزانيات: ' + e);
  }
}

/**
 * /budget - تفاصيل ميزانية معينة
 */
function cmdBudgetDetails(chatId, command) {
  try {
    var category = command.replace('budget', '').trim();
    if (!category) {
      return sendTelegramMessage(chatId, '❌ يرجى تحديد الفئة. مثال: /budget Food & Dining');
    }
    return sendTelegramMessage(chatId, '📊 تفاصيل الميزانية قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /accounts - قائمة الحسابات
 */
function cmdAccounts(chatId) {
  try {
    var report = generateAccountsReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب الحسابات: ' + e);
  }
}

/**
 * /stats - إحصائيات شاملة
 */
function cmdStats(chatId) {
  try {
    var stats = generateStatsReport();
    return sendTelegramMessage(chatId, stats);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ في جلب الإحصائيات: ' + e);
  }
}

/**
 * /balance - الأرصدة
 */
function cmdBalance(chatId) {
  try {
    return sendTelegramMessage(chatId, '💰 تقرير الأرصدة قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /debts - المدينين والدائنين
 */
function cmdDebts(chatId) {
  try {
    var report = formatTransfersReport();
    return sendTelegramMessage(chatId, report);
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /categories - التصنيفات
 */
function cmdCategories(chatId) {
  try {
    return sendTelegramMessage(chatId, '📂 قائمة التصنيفات قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /top - أكثر الفئات صرفاً
 */
function cmdTopSpending(chatId) {
  try {
    return sendTelegramMessage(chatId, '📈 أعلى فئات الصرف قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /search - بحث في المعاملات
 */
function cmdSearch(chatId, command) {
  try {
    var query = command.replace('search', '').trim();
    if (!query) {
      return sendTelegramMessage(chatId, '❌ يرجى إدخال كلمة البحث. مثال: /search ستاربكس');
    }
    return sendTelegramMessage(chatId, '🔍 البحث عن: ' + query + '\n\nقيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /last - آخر المعاملات
 */
function cmdLastTransactions(chatId, command) {
  try {
    var count = parseInt(command.replace('last', '').trim()) || 5;
    return sendTelegramMessage(chatId, '📝 آخر ' + count + ' معاملات قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /trends - الاتجاهات
 */
function cmdTrends(chatId) {
  try {
    return sendTelegramMessage(chatId, '📊 تحليل الاتجاهات قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /settings - الإعدادات
 */
function cmdSettings(chatId) {
  try {
    return sendTelegramMessage(chatId, '⚙️ الإعدادات قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * /export - تصدير البيانات
 */
function cmdExport(chatId) {
  try {
    return sendTelegramMessage(chatId, '📤 تصدير البيانات قيد التطوير');
  } catch (e) {
    return sendTelegramMessage(chatId, '❌ خطأ: ' + e);
  }
}

/**
 * توليد تقرير يومي
 */
function generateDailyReport() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('User_USER1');
  
  if (!sheet) {
    return '❌ لا توجد بيانات';
  }
  
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  
  var data = sheet.getDataRange().getValues();
  var total = 0;
  var count = 0;
  var categories = {};
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    rowDate.setHours(0, 0, 0, 0);
    
    if (rowDate.getTime() === today.getTime()) {
      var amount = Math.abs(Number(data[i][3]) || 0);
      var category = data[i][4] || 'غير مصنف';
      
      total += amount;
      count++;
      categories[category] = (categories[category] || 0) + amount;
    }
  }
  
  var text = '📊 *مصروفات اليوم*\n';
  text += today.toLocaleDateString('ar-SA') + '\n';
  text += '═══════════════════\n\n';
  text += '💰 الإجمالي: *' + total.toFixed(2) + ' ريال*\n';
  text += '📝 عدد المعاملات: ' + count + '\n\n';
  
  if (Object.keys(categories).length > 0) {
    text += '*التوزيع حسب الفئة:*\n';
    Object.keys(categories).sort(function(a, b) {
      return categories[b] - categories[a];
    }).forEach(function(cat) {
      text += '• ' + cat + ': ' + categories[cat].toFixed(2) + ' ريال\n';
    });
  }
  
  return text;
}

/**
 * توليد تقرير أسبوعي
 */
function generateWeeklyReport() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('User_USER1');
  
  if (!sheet) {
    return '❌ لا توجد بيانات';
  }
  
  var today = new Date();
  var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  var data = sheet.getDataRange().getValues();
  var total = 0;
  var count = 0;
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    
    if (rowDate >= weekAgo && rowDate <= today) {
      total += Math.abs(Number(data[i][3]) || 0);
      count++;
    }
  }
  
  var avg = count > 0 ? total / 7 : 0;
  
  var text = '📅 *مصروفات الأسبوع*\n';
  text += 'آخر 7 أيام\n';
  text += '═══════════════════\n\n';
  text += '💰 الإجمالي: *' + total.toFixed(2) + ' ريال*\n';
  text += '📊 المتوسط اليومي: ' + avg.toFixed(2) + ' ريال\n';
  text += '📝 عدد المعاملات: ' + count;
  
  return text;
}

/**
 * توليد تقرير شهري
 */
function generateMonthlyReport() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('User_USER1');
  
  if (!sheet) {
    return '❌ لا توجد بيانات';
  }
  
  var today = new Date();
  var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  var data = sheet.getDataRange().getValues();
  var total = 0;
  var count = 0;
  var categories = {};
  
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][0]);
    
    if (rowDate >= firstDay && rowDate <= today) {
      var amount = Math.abs(Number(data[i][3]) || 0);
      var category = data[i][4] || 'غير مصنف';
      
      total += amount;
      count++;
      categories[category] = (categories[category] || 0) + amount;
    }
  }
  
  var daysInMonth = today.getDate();
  var avg = daysInMonth > 0 ? total / daysInMonth : 0;
  
  var text = '📆 *مصروفات الشهر*\n';
  text += today.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' }) + '\n';
  text += '═══════════════════\n\n';
  text += '💰 الإجمالي: *' + total.toFixed(2) + ' ريال*\n';
  text += '📊 المتوسط اليومي: ' + avg.toFixed(2) + ' ريال\n';
  text += '📝 عدد المعاملات: ' + count + '\n\n';
  
  if (Object.keys(categories).length > 0) {
    text += '*أعلى 5 فئات:*\n';
    Object.keys(categories).sort(function(a, b) {
      return categories[b] - categories[a];
    }).slice(0, 5).forEach(function(cat) {
      var percentage = (categories[cat] / total * 100).toFixed(1);
      text += '• ' + cat + ': ' + categories[cat].toFixed(2) + ' (' + percentage + '%)\n';
    });
  }
  
  return text;
}

/**
 * توليد تقرير الحسابات
 */
function generateAccountsReport() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Account_Registry');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return '❌ لا توجد حسابات مسجلة';
  }
  
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
  
  var text = '💳 *حساباتك المسجلة*\n';
  text += '═══════════════════\n\n';
  
  var banks = {};
  data.forEach(function(row) {
    var accountId = row[0];
    var nickname = row[1];
    var bank = row[2];
    var last4 = row[3];
    
    if (!banks[bank]) {
      banks[bank] = [];
    }
    banks[bank].push({ nickname: nickname, last4: last4 });
  });
  
  Object.keys(banks).forEach(function(bank) {
    text += '*' + bank + ':*\n';
    banks[bank].forEach(function(account) {
      text += '  • ' + account.nickname + ' (*' + account.last4 + ')\n';
    });
    text += '\n';
  });
  
  text += '📊 إجمالي الحسابات: ' + data.length;
  
  return text;
}

/**
 * توليد تقرير الميزانيات
 */
function generateBudgetsReport() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName('Budgets');
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return '❌ لا توجد ميزانيات';
  }
  
  var data = sheet.getDataRange().getValues();
  
  var text = '💰 *الميزانيات*\n';
  text += '═══════════════════\n\n';
  
  for (var i = 1; i < data.length; i++) {
    var category = data[i][0];
    var budgeted = Number(data[i][1]) || 0;
    var spent = Number(data[i][2]) || 0;
    var remaining = budgeted - spent;
    var percentage = budgeted > 0 ? (spent / budgeted * 100).toFixed(1) : 0;
    var percentageNum = Number(percentage);
    
    var icon = '✅';
    if (percentageNum >= 100) icon = '🔴';
    else if (percentageNum >= 80) icon = '⚠️';
    else if (percentageNum >= 50) icon = '🟡';
    
    text += icon + ' *' + category + '*\n';
    text += '  المخصص: ' + budgeted.toFixed(2) + ' ريال\n';
    text += '  المصروف: ' + spent.toFixed(2) + ' ريال\n';
    text += '  المتبقي: ' + remaining.toFixed(2) + ' ريال\n';
    text += '  النسبة: ' + percentage + '%\n\n';
  }
  
  return text;
}

/**
 * توليد تقرير إحصائيات
 */
function generateStatsReport() {
  var text = '📈 *إحصائيات شاملة*\n';
  text += '═══════════════════\n\n';
  
  var dailyReport = generateDailyReport();
  var weeklyTotal = getWeeklyTotal_();
  var monthlyTotal = getMonthlyTotal_();
  
  text += '*اليوم:* ' + getDailyTotal_().toFixed(2) + ' ريال\n';
  text += '*الأسبوع:* ' + weeklyTotal.toFixed(2) + ' ريال\n';
  text += '*الشهر:* ' + monthlyTotal.toFixed(2) + ' ريال\n\n';
  
  text += '*المتوسطات:*\n';
  text += '• يومي: ' + (weeklyTotal / 7).toFixed(2) + ' ريال\n';
  text += '• أسبوعي: ' + (monthlyTotal / 4).toFixed(2) + ' ريال\n';
  
  return text;
}

// Helper functions
function getDailyTotal_() {
  // implementation
  return 0;
}

function getWeeklyTotal_() {
  // implementation
  return 0;
}

function getMonthlyTotal_() {
  // implementation
  return 0;
}

/**
 * إرسال رسالة Telegram
 */
function sendTelegramMessage(chatId, text, keyboard) {
  var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };
  
  if (keyboard) {
    payload.reply_markup = keyboard;
  }
  
  var options = {
    method: /** @type {const} */ ('post'),
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log('Error sending Telegram message: ' + e);
    return null;
  }
}
