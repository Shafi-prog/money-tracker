/**
 * SJA_CONTROL.js
 * ورقة التحكم الرئيسية - بديل V120
 * Main control sheet - V120 replacement
 */

/**
 * إنشاء ورقة التحكم SJA-V1
 */
function createSJAControlSheet() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      throw new Error('SHEET_ID غير موجود');
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    
    // حذف الورقة القديمة إن وجدت
    var oldSheet = ss.getSheetByName('SJA_Control');
    if (oldSheet) {
      ss.deleteSheet(oldSheet);
    }
    
    // إنشاء ورقة جديدة
    var sheet = ss.insertSheet('SJA_Control', 0); // في الموضع الأول
    
    Logger.log('🎯 إنشاء ورقة التحكم SJA-V1...');
    
    // العنوان الرئيسي
    sheet.getRange('A1:D1').merge();
    sheet.getRange('A1').setValue('🎯 SJA MoneyTracker - لوحة التحكم V1');
    sheet.getRange('A1').setBackground('#667eea').setFontColor('#FFFFFF');
    sheet.getRange('A1').setFontSize(18).setFontWeight('bold');
    sheet.getRange('A1').setHorizontalAlignment('center');
    
    // القسم 1: الأوامر السريعة
    sheet.getRange('A3').setValue('⚡ الأوامر السريعة');
    sheet.getRange('A3').setBackground('#764ba2').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.getRange('A3:D3').merge();
    
    var commands = [
      ['الأمر', 'الوصف', 'الحالة', 'تشغيل'],
      ['SJA_COMPLETE_WORKFLOW', 'إعداد كامل للنظام', '✅ جاهز', '=HYPERLINK("https://script.google.com", "▶️ تشغيل")'],
      ['CLEANUP_DELETE_USER2_UPDATE_USER1', 'حذف USER2 وتحديث USER1', '✅ مكتمل', ''],
      ['RESET_ALL_TRANSACTION_DATA', 'تصفير جميع البيانات', '⚠️ حذر', '=HYPERLINK("https://script.google.com", "🗑️ تصفير")'],
      ['COMPLETE_TELEGRAM_SETUP', 'إعداد Telegram كامل', '✅ جاهز', '=HYPERLINK("https://script.google.com", "▶️ تشغيل")'],
      ['TEST_AFTER_DELETE', 'اختبار بعد الحذف', '✅ جاهز', '=HYPERLINK("https://script.google.com", "🧪 اختبار")']
    ];
    
    sheet.getRange(4, 1, commands.length, 4).setValues(commands);
    sheet.getRange(4, 1, 1, 4).setBackground('#f8f9fa').setFontWeight('bold');
    
    // القسم 2: الإحصائيات
    var statsRow = 4 + commands.length + 2;
    sheet.getRange(statsRow, 1).setValue('📊 إحصائيات النظام');
    sheet.getRange(statsRow, 1).setBackground('#4caf50').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.getRange(statsRow, 1, 1, 4).merge();
    
    var stats = [
      ['المؤشر', 'القيمة', 'الوصف', ''],
      ['عدد المستخدمين', '1', 'USER1 (SJA)', ''],
      ['عدد الحسابات', '14', '4 بنوك', ''],
      ['عدد الفئات', '17', 'فئة رئيسية + فرعية', ''],
      ['عدد الملفات', '65+', 'في Google Apps Script', '']
    ];
    
    sheet.getRange(statsRow + 1, 1, stats.length, 4).setValues(stats);
    sheet.getRange(statsRow + 1, 1, 1, 4).setBackground('#f8f9fa').setFontWeight('bold');
    
    // القسم 3: الروابط السريعة
    var linksRow = statsRow + stats.length + 2;
    sheet.getRange(linksRow, 1).setValue('🔗 روابط سريعة');
    sheet.getRange(linksRow, 1).setBackground('#ff9800').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.getRange(linksRow, 1, 1, 4).merge();
    
    var webAppUrl = ScriptApp.getService().getUrl();
    
    var links = [
      ['الخدمة', 'الرابط', '', ''],
      ['Google Apps Script', '=HYPERLINK("https://script.google.com", "📝 فتح المحرر")', '', ''],
      ['HTML Dashboard', '=HYPERLINK("' + webAppUrl + '", "🌐 فتح Dashboard")', '', ''],
      ['Telegram Bot', '=HYPERLINK("https://t.me/YourBot", "💬 فتح البوت")', '', ''],
      ['الأدلة', '=HYPERLINK("https://github.com", "📖 الوثائق")', '', '']
    ];
    
    sheet.getRange(linksRow + 1, 1, links.length, 4).setValues(links);
    sheet.getRange(linksRow + 1, 1, 1, 4).setBackground('#f8f9fa').setFontWeight('bold');
    
    // القسم 4: الحالة الحالية
    var statusRow = linksRow + links.length + 2;
    sheet.getRange(statusRow, 1).setValue('✔️ حالة النظام');
    sheet.getRange(statusRow, 1).setBackground('#2196f3').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.getRange(statusRow, 1, 1, 4).merge();
    
    var status = [
      ['المكون', 'الحالة', 'آخر تحديث', 'ملاحظات'],
      ['USER2', '🗑️ محذوف', new Date(), 'تم الحذف بنجاح'],
      ['USER1', '✅ نشط', new Date(), '14 حساب مسجل'],
      ['Telegram Bot', '✅ نشط', new Date(), 'Webhook مُعد'],
      ['HTML Dashboard', '✅ نشط', new Date(), 'جميع الصفحات جاهزة'],
      ['iPhone Shortcut', '⚠️ بحاجة اختبار', new Date(), 'جاهز للاختبار']
    ];
    
    sheet.getRange(statusRow + 1, 1, status.length, 4).setValues(status);
    sheet.getRange(statusRow + 1, 1, 1, 4).setBackground('#f8f9fa').setFontWeight('bold');
    
    // التنسيقات النهائية
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 150);
    
    // RTL
    sheet.setRightToLeft(true);
    
    // Freeze header
    sheet.setFrozenRows(1);
    
    // Borders
    var lastRow = statusRow + status.length;
    sheet.getRange(1, 1, lastRow, 4).setBorder(
      true, true, true, true, true, true,
      '#e0e0e0', SpreadsheetApp.BorderStyle.SOLID
    );
    
    Logger.log('✅ تم إنشاء ورقة SJA_Control بنجاح!');
    
    return {
      success: true,
      message: 'تم إنشاء ورقة التحكم SJA-V1',
      sheetName: 'SJA_Control'
    };
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}

/**
 * تحديث حالة مكون في ورقة التحكم
 */
function updateComponentStatus(component, status, notes) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('SJA_Control');
    
    if (!sheet) {
      Logger.log('⚠️ ورقة SJA_Control غير موجودة');
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === component) {
        sheet.getRange(i + 1, 2).setValue(status);
        sheet.getRange(i + 1, 3).setValue(new Date());
        if (notes) {
          sheet.getRange(i + 1, 4).setValue(notes);
        }
        Logger.log('✅ تم تحديث حالة: ' + component);
        break;
      }
    }
    
  } catch (e) {
    Logger.log('❌ خطأ في updateComponentStatus: ' + e.message);
  }
}

/**
 * إضافة سجل نشاط
 */
function addActivityLog(activity, details) {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('SJA_Control');
    
    if (!sheet) return;
    
    var lastRow = sheet.getLastRow();
    
    // إضافة قسم السجل إذا لم يكن موجوداً
    if (!sheet.getRange('A' + (lastRow + 2)).getValue()) {
      sheet.getRange(lastRow + 2, 1).setValue('📝 سجل النشاط');
      sheet.getRange(lastRow + 2, 1).setBackground('#9c27b0').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.getRange(lastRow + 2, 1, 1, 4).merge();
      
      sheet.getRange(lastRow + 3, 1, 1, 4).setValues([
        ['الوقت', 'النشاط', 'التفاصيل', '']
      ]);
      sheet.getRange(lastRow + 3, 1, 1, 4).setBackground('#f8f9fa').setFontWeight('bold');
      
      lastRow = lastRow + 3;
    }
    
    // إضافة السجل
    sheet.getRange(lastRow + 1, 1, 1, 3).setValues([
      [new Date(), activity, details || '']
    ]);
    
  } catch (e) {
    Logger.log('❌ خطأ في addActivityLog: ' + e.message);
  }
}
