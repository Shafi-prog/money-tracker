/**
 * TELEGRAM_IMPROVED.js
 * تحسينات شاملة لسرعة استجابة Telegram Bot
 * Comprehensive improvements for Telegram Bot response speed
 */

/**
 * معالج سريع للـ callback queries
 * يرسل استجابة فورية ثم يعالج البيانات
 */
function handleCallbackQueryFast(query) {
  var chatId = query.message.chat.id;
  var messageId = query.message.message_id;
  var data = query.data;
  var callbackId = query.id;
  
  // إرسال استجابة فورية لإزالة ساعة التحميل
  answerCallbackQueryFast(callbackId, '⏳ جاري التحميل...');
  
  try {
    // معالجة الأمر
    if (data.startsWith('cmd_')) {
      var command = data.replace('cmd_', '');
      
      // إرسال "جاري العمل..." أولاً
      editMessageText(chatId, messageId, '⏳ جاري تحضير البيانات...');
      
      // تنفيذ الأمر
      var result = executeCommandFast(command, chatId);
      
      // تحديث الرسالة بالنتيجة
      editMessageText(chatId, messageId, result.text);
      
      return { ok: true };
    }
    
    // أوامر أخرى
    return handleOldCallbackQuery(query);
    
  } catch (e) {
    Logger.log('Error in handleCallbackQueryFast: ' + e);
    editMessageText(chatId, messageId, '❌ خطأ: ' + e.message);
    return { ok: false };
  }
}

/**
 * تنفيذ الأمر بسرعة
 */
function executeCommandFast(command, chatId) {
  var commandMap = {
    'today': generateQuickDailyReport,
    'week': generateQuickWeeklyReport,
    'month': generateQuickMonthlyReport,
    'budgets': generateQuickBudgetsReport,
    'transfers': generateQuickTransfersReport,
    'accounts': generateQuickAccountsReport,
    'stats': generateQuickStatsReport,
    'help': generateQuickHelp
  };
  
  var handler = commandMap[command];
  if (handler) {
    var text = handler();
    return { text: text };
  }
  
  return { text: '❌ أمر غير معروف' };
}

/**
 * تقرير يومي سريع (بدون loops معقدة)
 */
function generateQuickDailyReport() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) return '❌ SHEET_ID غير موجود';
    
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    if (!sheet) return '❌ لا توجد بيانات';
    
    var today = new Date();
    var todayStr = Utilities.formatDate(today, 'Asia/Riyadh', 'yyyy-MM-dd');
    
    // قراءة آخر 50 صف فقط (سريع)
    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - 50);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();
    
    var total = 0;
    var count = 0;
    
    for (var i = 0; i < data.length; i++) {
      var dateCell = data[i][0];
      if (!dateCell) continue;
      
      var dateStr = Utilities.formatDate(new Date(dateCell), 'Asia/Riyadh', 'yyyy-MM-dd');
      if (dateStr === todayStr) {
        total += Math.abs(Number(data[i][7]) || 0);
        count++;
      }
    }
    
    var text = '📆 *مصروفات اليوم*\n';
    text += todayStr + '\n';
    text += '═══════════════════\n\n';
    text += '💰 الإجمالي: ' + total.toFixed(2) + ' ريال\n';
    text += '📝 عدد المعاملات: ' + count;
    
    return text;
    
  } catch (e) {
    return '❌ خطأ: ' + e.message;
  }
}

/**
 * تقرير أسبوعي سريع
 */
function generateQuickWeeklyReport() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    if (!sheet) return '❌ لا توجد بيانات';
    
    var today = new Date();
    var weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - 100);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();
    
    var total = 0;
    var count = 0;
    
    for (var i = 0; i < data.length; i++) {
      var dateCell = data[i][0];
      if (!dateCell) continue;
      
      var date = new Date(dateCell);
      if (date >= weekAgo && date <= today) {
        total += Math.abs(Number(data[i][7]) || 0);
        count++;
      }
    }
    
    var avg = count > 0 ? (total / 7) : 0;
    
    var text = '📅 *مصروفات الأسبوع*\n';
    text += 'آخر 7 أيام\n';
    text += '═══════════════════\n\n';
    text += '💰 الإجمالي: ' + total.toFixed(2) + ' ريال\n';
    text += '📊 المتوسط اليومي: ' + avg.toFixed(2) + ' ريال\n';
    text += '📝 عدد المعاملات: ' + count;
    
    return text;
    
  } catch (e) {
    return '❌ خطأ: ' + e.message;
  }
}

/**
 * تقرير شهري سريع
 */
function generateQuickMonthlyReport() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    if (!sheet) return '❌ لا توجد بيانات';
    
    var today = new Date();
    var month = today.getMonth();
    var year = today.getFullYear();
    
    var lastRow = sheet.getLastRow();
    var startRow = Math.max(2, lastRow - 200);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();
    
    var total = 0;
    var count = 0;
    
    for (var i = 0; i < data.length; i++) {
      var dateCell = data[i][0];
      if (!dateCell) continue;
      
      var date = new Date(dateCell);
      if (date.getMonth() === month && date.getFullYear() === year) {
        total += Math.abs(Number(data[i][7]) || 0);
        count++;
      }
    }
    
    var months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    var text = '📆 *مصروفات الشهر*\n';
    text += months[month] + ' ' + year + '\n';
    text += '═══════════════════\n\n';
    text += '💰 الإجمالي: ' + total.toFixed(2) + ' ريال\n';
    text += '📝 عدد المعاملات: ' + count;
    
    return text;
    
  } catch (e) {
    return '❌ خطأ: ' + e.message;
  }
}

/**
 * تقرير ميزانيات سريع
 */
function generateQuickBudgetsReport() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Budgets');
    if (!sheet) return '❌ لا توجد ميزانيات';
    
    var data = sheet.getDataRange().getValues();
    
    var text = '💰 *الميزانيات*\n';
    text += '═══════════════════\n\n';
    
    for (var i = 1; i < Math.min(data.length, 6); i++) {
      var category = data[i][0];
      var budgeted = Number(data[i][1]) || 0;
      var spent = Number(data[i][2]) || 0;
      var percentage = budgeted > 0 ? (spent / budgeted * 100) : 0;
      
      var icon = percentage >= 100 ? '🔴' : percentage >= 80 ? '⚠️' : percentage >= 50 ? '🟡' : '✅';
      
      text += icon + ' *' + category + '*\n';
      text += '  ' + spent.toFixed(0) + ' / ' + budgeted.toFixed(0) + ' (' + percentage.toFixed(0) + '%)\n';
    }
    
    return text;
    
  } catch (e) {
    return '❌ خطأ: ' + e.message;
  }
}

/**
 * تقرير حوالات سريع
 */
function generateQuickTransfersReport() {
  try {
    if (typeof formatTransfersReport === 'function') {
      return formatTransfersReport();
    }
    return '🔄 *تقرير الحوالات*\n\nلا توجد بيانات متاحة';
  } catch (e) {
    return '❌ خطأ: ' + e.message;
  }
}

/**
 * تقرير حسابات سريع
 */
function generateQuickAccountsReport() {
  var text = '💳 *الحسابات المسجلة*\n';
  text += '═══════════════════\n\n';
  text += '*AlRajhi Bank:*\n';
  text += '• 9767 (راتب)\n• 9765 (جاري)\n• 4912 (مدى)\n• 0005 (خيري)\n\n';
  text += '*STC Bank:*\n';
  text += '• 3281 (Apple Pay)\n• 4495 (VISA)\n\n';
  text += '*tiqmo:*\n';
  text += '• 0305 (MasterCard)\n• 9682 (محفظة)\n\n';
  text += '*D360:*\n';
  text += '• 3449 (VISA & Mada)\n• 7815 (محفظة)\n\n';
  text += '📊 *الإجمالي:* 14 حساب';
  
  return text;
}

/**
 * إحصائيات سريعة
 */
function generateQuickStatsReport() {
  return generateQuickMonthlyReport();
}

/**
 * مساعدة سريعة
 */
function generateQuickHelp() {
  var text = '📖 *الأوامر المتاحة*\n\n';
  text += '/today - اليوم\n';
  text += '/week - الأسبوع\n';
  text += '/month - الشهر\n';
  text += '/budgets - الميزانيات\n';
  text += '/transfers - الحوالات\n';
  text += '/accounts - الحسابات\n';
  text += '/help - المساعدة';
  
  return text;
}

/**
 * إرسال callback answer سريع
 */
function answerCallbackQueryFast(queryId, text) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    
    var url = 'https://api.telegram.org/bot' + botToken + '/answerCallbackQuery';
    var payload = {
      callback_query_id: queryId,
      text: text || '✓',
      show_alert: false
    };
    
    var options = {
      method: /** @type {const} */ ('post'),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('Error in answerCallbackQueryFast: ' + e);
  }
}

/**
 * تعديل نص رسالة
 */
function editMessageText(chatId, messageId, text) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    
    var url = 'https://api.telegram.org/bot' + botToken + '/editMessageText';
    var payload = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown'
    };
    
    var options = {
      method: /** @type {const} */ ('post'),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log('Error in editMessageText: ' + e);
  }
}

/**
 * معالج callback قديم (fallback)
 */
function handleOldCallbackQuery(query) {
  if (typeof handleCallbackQuery === 'function') {
    return handleCallbackQuery(query);
  }
  return { ok: false };
}
