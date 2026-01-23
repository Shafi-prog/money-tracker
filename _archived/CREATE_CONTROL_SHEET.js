/**
 * CREATE_CONTROL_SHEET.js
 * أمر واحد لإنشاء ورقة التحكم + تحديث جميع الحالات
 */

/**
 * ▶️ شغل هذه الدالة لإنشاء ورقة التحكم SJA-V1
 * 
 * الخطوات:
 * 1. فتح Google Apps Script Editor
 * 2. اختر CREATE_CONTROL_SHEET.js
 * 3. اختر دالة CREATE_SJA_CONTROL_NOW
 * 4. اضغط Run (▶️)
 */
function CREATE_SJA_CONTROL_NOW() {
  try {
    Logger.log('🚀 بدء إنشاء ورقة التحكم SJA-V1...');
    
    // استدعاء الدالة من SJA_CONTROL.js
    var result = createSJAControlSheet();
    
    if (result.success) {
      Logger.log('✅ نجح الإنشاء!');
      Logger.log('📋 اسم الورقة: ' + result.sheetName);
      Logger.log('🔗 افتح الجدول وشاهد ورقة SJA_Control في أول موضع');
      
      // تحديث الحالات
      Logger.log('📝 تحديث حالة المكونات...');
      
      updateComponentStatus('Telegram Bot', '✅ نشط', 'تم تحسين السرعة');
      updateComponentStatus('HTML Dashboard', '✅ نشط', 'جميع الصفحات جاهزة');
      updateComponentStatus('iPhone Shortcut', '⚠️ بحاجة اختبار', 'جاهز للاختبار');
      
      // إضافة سجل النشاط
      addActivityLog('إنشاء ورقة التحكم', 'تم إنشاء SJA_Control بنجاح');
      addActivityLog('تحسين Telegram', 'TELEGRAM_IMPROVED.js تم إضافته');
      addActivityLog('تطوير HTML', 'HTML_PAGES_COMPLETE.js تم إضافته');
      
      Logger.log('');
      Logger.log('✅✅✅ تم بنجاح! ✅✅✅');
      Logger.log('');
      Logger.log('📌 الخطوات التالية:');
      Logger.log('1. افتح الجدول وشاهد ورقة SJA_Control');
      Logger.log('2. جرب الأوامر من الورقة');
      Logger.log('3. اختبر Telegram Bot (يجب أن يكون سريعاً الآن)');
      Logger.log('4. اختبر HTML Dashboard (جميع التابات جاهزة)');
      
      return result;
      
    } else {
      Logger.log('❌ فشل الإنشاء');
      return result;
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    Logger.log('📋 التفاصيل: ' + e.stack);
    throw e;
  }
}

/**
 * اختبار سريع بعد إنشاء الورقة
 */
function TEST_CONTROL_SHEET() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('SJA_Control');
    
    if (sheet) {
      Logger.log('✅ ورقة SJA_Control موجودة');
      Logger.log('📊 عدد الصفوف: ' + sheet.getLastRow());
      Logger.log('📊 عدد الأعمدة: ' + sheet.getLastColumn());
      
      var title = sheet.getRange('A1').getValue();
      Logger.log('📋 العنوان: ' + title);
      
      return {
        success: true,
        exists: true,
        rows: sheet.getLastRow(),
        columns: sheet.getLastColumn(),
        title: title
      };
      
    } else {
      Logger.log('❌ ورقة SJA_Control غير موجودة');
      Logger.log('💡 شغل CREATE_SJA_CONTROL_NOW() أولاً');
      
      return {
        success: false,
        exists: false,
        message: 'الورقة غير موجودة'
      };
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    throw e;
  }
}
