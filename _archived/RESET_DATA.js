/**
 * RESET_DATA.js
 * تصفير البيانات بعد الاختبارات
 * Reset all transaction data while keeping structure
 */

/**
 * تصفير جميع البيانات - الاحتفاظ بالهيكل فقط
 */
function RESET_ALL_TRANSACTION_DATA() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      throw new Error('SHEET_ID غير موجود');
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    
    Logger.log('⚠️ بدء عملية تصفير البيانات...');
    
    var confirmation = Browser.msgBox(
      'تأكيد التصفير',
      'هل أنت متأكد من تصفير جميع البيانات؟\\n\\n' +
      'سيتم حذف:\\n' +
      '• جميع المعاملات من User_USER1\\n' +
      '• جميع الحوالات من Transfers_Tracking\\n' +
      '• إعادة ضبط الميزانيات\\n\\n' +
      'سيتم الاحتفاظ بـ:\\n' +
      '• الحسابات المسجلة\\n' +
      '• التصنيفات\\n' +
      '• الإعدادات',
      Browser.Buttons.YES_NO
    );
    
    if (confirmation !== 'yes') {
      Logger.log('❌ تم الإلغاء من قِبل المستخدم');
      return { success: false, message: 'تم الإلغاء' };
    }
    
    var stats = {
      user1Cleared: 0,
      transfersCleared: 0,
      budgetsReset: 0
    };
    
    // 1. تصفير معاملات User_USER1
    stats.user1Cleared = clearUserTransactions_(ss, 'User_USER1');
    
    // 2. تصفير الحوالات
    stats.transfersCleared = clearTransfers_(ss);
    
    // 3. إعادة ضبط الميزانيات
    stats.budgetsReset = resetBudgets_(ss);
    
    Logger.log('✅ تم التصفير بنجاح!');
    Logger.log('📊 الإحصائيات:');
    Logger.log('  • معاملات User_USER1: ' + stats.user1Cleared);
    Logger.log('  • الحوالات: ' + stats.transfersCleared);
    Logger.log('  • الميزانيات: ' + stats.budgetsReset);
    
    // إرسال تنبيه Telegram
    sendResetNotification_(stats);
    
    return {
      success: true,
      message: '✅ تم تصفير البيانات بنجاح',
      stats: stats
    };
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * تصفير معاملات مستخدم معين
 */
function clearUserTransactions_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('⚠️ ' + sheetName + ' غير موجودة');
    return 0;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('⚠️ ' + sheetName + ' فارغة بالفعل');
    return 0;
  }
  
  var rowsToDelete = lastRow - 1;
  
  // حذف جميع الصفوف ما عدا الرأس
  if (rowsToDelete > 0) {
    sheet.deleteRows(2, rowsToDelete);
    Logger.log('✅ تم حذف ' + rowsToDelete + ' صف من ' + sheetName);
  }
  
  return rowsToDelete;
}

/**
 * تصفير الحوالات
 */
function clearTransfers_(ss) {
  var sheet = ss.getSheetByName('Transfers_Tracking');
  if (!sheet) {
    Logger.log('⚠️ Transfers_Tracking غير موجودة');
    return 0;
  }
  
  return clearUserTransactions_(ss, 'Transfers_Tracking');
}

/**
 * إعادة ضبط الميزانيات - تصفير المصروف
 */
function resetBudgets_(ss) {
  var sheet = ss.getSheetByName('Budgets');
  if (!sheet) {
    Logger.log('⚠️ Budgets غير موجودة');
    return 0;
  }
  
  var data = sheet.getDataRange().getValues();
  var resetCount = 0;
  
  for (var i = 1; i < data.length; i++) {
    // تصفير عمود Spent (العمود C = 3)
    sheet.getRange(i + 1, 3).setValue(0);
    // تصفير عمود Remaining (العمود D = 4)
    var budgeted = data[i][1];
    sheet.getRange(i + 1, 4).setValue(budgeted);
    resetCount++;
  }
  
  Logger.log('✅ تم إعادة ضبط ' + resetCount + ' ميزانية');
  return resetCount;
}

/**
 * إرسال تنبيه Telegram بالتصفير
 */
function sendResetNotification_(stats) {
  try {
    var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
    
    if (!botToken || !chatId) {
      Logger.log('⚠️ بيانات Telegram غير متوفرة');
      return;
    }
    
    var text = '🔄 *تم تصفير البيانات*\n';
    text += '═══════════════════\n\n';
    text += '📊 الإحصائيات:\n';
    text += '• معاملات: ' + stats.user1Cleared + '\n';
    text += '• حوالات: ' + stats.transfersCleared + '\n';
    text += '• ميزانيات: ' + stats.budgetsReset + '\n\n';
    text += '✅ النظام جاهز للبدء من جديد!';
    
    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var payload = {
      chat_id: chatId,
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
    Logger.log('✅ تم إرسال إشعار Telegram');
    
  } catch (e) {
    Logger.log('⚠️ خطأ في إرسال Telegram: ' + e.message);
  }
}

/**
 * تصفير البيانات بدون تأكيد (للاستخدام البرمجي)
 */
function RESET_ALL_DATA_NO_CONFIRM() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    
    var stats = {
      user1Cleared: clearUserTransactions_(ss, 'User_USER1'),
      transfersCleared: clearTransfers_(ss),
      budgetsReset: resetBudgets_(ss)
    };
    
    Logger.log('✅ تم التصفير بنجاح (بدون تأكيد)');
    sendResetNotification_(stats);
    
    return stats;
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * عرض إحصائيات البيانات الحالية
 */
function SHOW_DATA_STATS() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    
    Logger.log('📊 إحصائيات البيانات الحالية:');
    Logger.log('═══════════════════════════════════');
    
    // User_USER1
    var sheet1 = ss.getSheetByName('User_USER1');
    if (sheet1) {
      var count1 = sheet1.getLastRow() - 1;
      Logger.log('معاملات User_USER1: ' + count1);
    }
    
    // Transfers
    var transfers = ss.getSheetByName('Transfers_Tracking');
    if (transfers) {
      var countT = transfers.getLastRow() - 1;
      Logger.log('الحوالات: ' + countT);
    }
    
    // Budgets
    var budgets = ss.getSheetByName('Budgets');
    if (budgets) {
      var data = budgets.getDataRange().getValues();
      var totalSpent = 0;
      for (var i = 1; i < data.length; i++) {
        totalSpent += Number(data[i][2]) || 0;
      }
      Logger.log('إجمالي المصروف: ' + totalSpent.toFixed(2) + ' ريال');
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
  }
}
