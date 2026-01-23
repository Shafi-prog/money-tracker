/**
 * DELETE_SCRIPTS_FOLDER.js
 * حذف مجلد scripts من Google Apps Script
 * هذا السكريبت لحل مشكلة "require is not defined"
 */

/**
 * لا يمكن حذف الملفات برمجياً من Google Apps Script
 * يجب الحذف يدوياً من الواجهة
 * 
 * الخطوات:
 * 1. افتح https://script.google.com
 * 2. اختر مشروعك
 * 3. ابحث عن ملف "scripts/auto-push" في القائمة اليسرى
 * 4. اضغط على النقاط الثلاث (⋮) بجانب الملف
 * 5. اختر "Delete"
 * 6. احفظ المشروع (Ctrl+S)
 * 
 * بعد الحذف:
 * - HTML Dashboard سيعمل ✅
 * - iPhone Shortcut سيعمل ✅
 * - Telegram Bot جاهز للإعداد ✅
 */

/**
 * التحقق من وجود الملف
 */
function CHECK_FOR_SCRIPTS_FOLDER() {
  Logger.log('ℹ️  لا يمكن التحقق برمجياً من الملفات في Google Apps Script');
  Logger.log('');
  Logger.log('📋 للتحقق يدوياً:');
  Logger.log('1. انظر إلى القائمة اليسرى في محرر Apps Script');
  Logger.log('2. ابحث عن ملف اسمه "scripts/auto-push" أو "auto-push"');
  Logger.log('');
  Logger.log('❌ إذا وجدته → احذفه');
  Logger.log('✅ إذا لم تجده → المشكلة محلولة!');
  
  return {
    message: 'تحقق يدوياً من القائمة اليسرى',
    steps: [
      'ابحث عن "scripts/auto-push"',
      'إذا وجدته: اضغط ⋮ → Delete',
      'احفظ المشروع'
    ]
  };
}

/**
 * اختبار بعد الحذف
 */
function TEST_AFTER_DELETE() {
  try {
    Logger.log('🧪 اختبار النظام...');
    Logger.log('');
    
    // اختبار 1: doGet
    Logger.log('1️⃣ اختبار HTML Dashboard...');
    try {
      var e = { parameter: {} };
      var result = doGet(e);
      var content = result.getContent();
      
      if (content && content.length > 0) {
        Logger.log('✅ HTML Dashboard يعمل!');
        Logger.log('   طول المحتوى: ' + content.length + ' حرف');
      } else {
        Logger.log('⚠️ HTML فارغ');
      }
    } catch (htmlError) {
      Logger.log('❌ خطأ في HTML: ' + htmlError.message);
    }
    
    Logger.log('');
    
    // اختبار 2: doPost
    Logger.log('2️⃣ اختبار iPhone Shortcut Endpoint...');
    try {
      var testPost = {
        parameter: {
          text: 'test message',
          source: 'ios_sms',
          debug: 'on'
        },
        postData: {
          contents: JSON.stringify({
            text: 'test message',
            source: 'ios_sms'
          })
        }
      };
      
      var postResult = doPost(testPost);
      Logger.log('✅ doPost يعمل!');
    } catch (postError) {
      Logger.log('❌ خطأ في doPost: ' + postError.message);
    }
    
    Logger.log('');
    Logger.log('📊 النتيجة:');
    Logger.log('إذا رأيت ✅ أعلاه → النظام يعمل');
    Logger.log('إذا رأيت ❌ → تحقق من الأخطاء');
    
    return { success: true };
    
  } catch (e) {
    Logger.log('❌ خطأ في الاختبار: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * دليل سريع
 */
function QUICK_DELETE_GUIDE() {
  Logger.log('🔧 دليل حذف scripts/auto-push');
  Logger.log('═══════════════════════════════════════');
  Logger.log('');
  Logger.log('📍 أين تجد الملف:');
  Logger.log('   القائمة اليسرى في Google Apps Script');
  Logger.log('   ابحث عن: "scripts/auto-push" أو "auto-push"');
  Logger.log('');
  Logger.log('🗑️ كيفية الحذف:');
  Logger.log('   1. اضغط على ⋮ (ثلاث نقاط) بجانب الملف');
  Logger.log('   2. اختر "Delete"');
  Logger.log('   3. احفظ المشروع (Ctrl+S)');
  Logger.log('');
  Logger.log('✅ بعد الحذف:');
  Logger.log('   - شغّل: TEST_AFTER_DELETE()');
  Logger.log('   - اختبر: HTML Dashboard');
  Logger.log('   - اختبر: iPhone Shortcut');
  Logger.log('');
  Logger.log('❓ إذا لم تجد الملف:');
  Logger.log('   - ممتاز! المشكلة محلولة');
  Logger.log('   - شغّل: TEST_AFTER_DELETE() للتأكد');
  Logger.log('');
  Logger.log('═══════════════════════════════════════');
}
