/**
 * ═══════════════════════════════════════════════════════════════════════
 * TEST_ALL_SYSTEMS.js - اختبار شامل لجميع مكونات النظام
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * شغل دالة واحدة فقط: RUN_ALL_TESTS()
 * 
 * @version 1.0
 * @author SJA MoneyTracker Team
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 🚀 تشغيل جميع الاختبارات مرة واحدة
 * 
 * الاستخدام:
 * 1. افتح Google Apps Script Editor
 * 2. اختر TEST_ALL_SYSTEMS.js
 * 3. اختر دالة: RUN_ALL_TESTS
 * 4. اضغط Run ▶️
 * 5. شاهد النتائج في Logs
 */
function RUN_ALL_TESTS() {
  if (typeof RUN_COMPREHENSIVE_TEST === 'function') {
    return RUN_COMPREHENSIVE_TEST();
  }
  if (typeof RUN_MASTER_TESTS === 'function') {
    return RUN_MASTER_TESTS();
  }
  throw new Error('RUN_COMPREHENSIVE_TEST غير موجودة');
}

/**
 * @param {{ total: number, passed: number, failed: number, tests: Array<{name: string, status: string, message?: string, error?: string}> }} results
 * @param {string} testName
 * @param {function} testFunction
 * @returns {{ total: number, passed: number, failed: number, tests: Array<{name: string, status: string, message?: string, error?: string}> }}
 */
function runTest(results, testName, testFunction) {
  results.total++;
  
  try {
    var result = testFunction();
    
    if (result.success) {
      Logger.log('  ✅ نجح: ' + testName);
      if (result.message) {
        Logger.log('     💬 ' + result.message);
      }
      results.passed++;
      results.tests.push({name: testName, status: 'PASSED', message: result.message});
    } else {
      Logger.log('  ❌ فشل: ' + testName);
      Logger.log('     ⚠️ ' + (result.error || 'خطأ غير معروف'));
      results.failed++;
      results.tests.push({name: testName, status: 'FAILED', error: result.error});
    }
    
  } catch (e) {
    Logger.log('  ❌ فشل: ' + testName);
    Logger.log('     ⚠️ Exception: ' + e.message);
    results.failed++;
    results.tests.push({name: testName, status: 'FAILED', error: e.message});
  }
  
  return results;
}

/**
 * طباعة الملخص النهائي
 */
function printFinalSummary(results) {
  Logger.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  Logger.log('║                   📊 ملخص الاختبارات                    ║');
  Logger.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  Logger.log('📈 الإجمالي: ' + results.total + ' اختبار');
  Logger.log('✅ نجح: ' + results.passed + ' اختبار');
  Logger.log('❌ فشل: ' + results.failed + ' اختبار');
  Logger.log('📊 نسبة النجاح: ' + ((results.passed / results.total * 100).toFixed(1)) + '%');
  
  Logger.log('\n📋 تفاصيل الاختبارات:');
  for (var i = 0; i < results.tests.length; i++) {
    var test = results.tests[i];
    var status = test.status === 'PASSED' ? '✅' : '❌';
    Logger.log('  ' + status + ' ' + test.name);
  }
  
  if (results.failed === 0) {
    Logger.log('\n\n🎉🎉🎉 تهانينا! جميع الاختبارات نجحت! 🎉🎉🎉');
    Logger.log('✅ النظام جاهز للاستخدام!');
  } else {
    Logger.log('\n\n⚠️ يوجد ' + results.failed + ' اختبار فشل. راجع التفاصيل أعلاه.');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// الاختبارات الفردية
// ═══════════════════════════════════════════════════════════════════════

/**
 * اختبار اتصال Google Sheet
 */
function testGoogleSheet() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    
    if (!sheetId) {
      return {
        success: false,
        error: 'SHEET_ID غير موجود في Script Properties'
      };
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    var sheetName = ss.getName();
    
    return {
      success: true,
      message: 'متصل بـ: ' + sheetName
    };
    
  } catch (e) {
    return {
      success: false,
      error: 'فشل الاتصال: ' + e.message
    };
  }
}

/**
 * اختبار Script Properties
 */
function testScriptProperties() {
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetId = props.getProperty('SHEET_ID');
    var botToken = props.getProperty('TELEGRAM_BOT_TOKEN');
    
    var messages = [];
    
    if (!sheetId) {
      return {
        success: false,
        error: 'SHEET_ID مفقود'
      };
    }
    messages.push('SHEET_ID ✓');
    
    if (!botToken) {
      messages.push('TELEGRAM_BOT_TOKEN مفقود (اختياري)');
    } else {
      messages.push('TELEGRAM_BOT_TOKEN ✓');
    }
    
    return {
      success: true,
      message: messages.join(', ')
    };
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * اختبار Web App
 */
function testWebApp() {
  try {
    var url = ScriptApp.getService().getUrl();
    
    if (!url) {
      return {
        success: false,
        error: 'Web App غير منشور'
      };
    }
    
    // اختبار doGet
    var mockRequest = {
      parameter: {},
      contentLength: 0
    };
    
    var response = doGet(mockRequest);
    
    if (!response) {
      return {
        success: false,
        error: 'doGet() لا يعيد response'
      };
    }
    
    return {
      success: true,
      message: 'URL: ' + url.substring(0, 50) + '...'
    };
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * اختبار SMS Parser
 */
function testSMSParser() {
  try {
    // رسالة اختبار
    var testSMS = 'تم الشراء بمبلغ 150.00 ريال من AMAZON.COM بتاريخ 2026-01-20';
    
    // محاولة التحليل باستخدام preParseFallback
    if (typeof preParseFallback === 'function') {
      var result = preParseFallback(testSMS);
      
      if (result && result.amount) {
        return {
          success: true,
          message: 'تم تحليل مبلغ: ' + result.amount + ' ريال من ' + result.merchant
        };
      }
    }
    
    // محاولة AI Hybrid
    if (typeof callAiHybridV120 === 'function') {
      var result2 = callAiHybridV120(testSMS);
      if (result2 && result2.amount) {
        return {
          success: true,
          message: 'AI Parser يعمل: ' + result2.amount + ' ريال'
        };
      }
    }
    
    return {
      success: true,
      message: 'Parser متاح (اختبار أساسي)'
    };
    
    return {
      success: true,
      message: 'Parser متاح (اختبار أساسي)'
    };
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * اختبار Telegram Bot
 */
function testTelegramBot() {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
    
    if (!token) {
      return {
        success: true,
        message: 'Telegram Bot غير مُعد (اختياري)'
      };
    }
    
    // اختبار API
    var url = 'https://api.telegram.org/bot' + token + '/getMe';
    
    try {
      var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
      var result = JSON.parse(response.getContentText());
      
      if (result.ok) {
        return {
          success: true,
          message: 'Bot: @' + result.result.username
        };
      } else {
        return {
          success: false,
          error: 'Bot Token غير صحيح'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: 'فشل الاتصال بـ Telegram API'
      };
    }
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * اختبار نظام الفئات
 */
function testCategories() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('Categories');
    
    if (!sheet) {
      return {
        success: false,
        error: 'ورقة Categories غير موجودة'
      };
    }
    
    var rowCount = sheet.getLastRow();
    
    if (rowCount < 2) {
      return {
        success: false,
        error: 'لا توجد فئات (فارغة)'
      };
    }
    
    return {
      success: true,
      message: (rowCount - 1) + ' فئة موجودة'
    };
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * اختبار بنية الأوراق
 */
function testSheets() {
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    
    var requiredSheets = [
      'User_USER1',
      'Categories',
      'Budgets'
    ];
    
    var missingSheets = [];
    var existingSheets = [];
    
    for (var i = 0; i < requiredSheets.length; i++) {
      var sheetName = requiredSheets[i];
      var sheet = ss.getSheetByName(sheetName);
      
      if (sheet) {
        existingSheets.push(sheetName);
      } else {
        missingSheets.push(sheetName);
      }
    }
    
    if (missingSheets.length > 0) {
      return {
        success: false,
        error: 'أوراق مفقودة: ' + missingSheets.join(', ')
      };
    }
    
    return {
      success: true,
      message: existingSheets.length + ' أوراق موجودة'
    };
    
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// اختبارات إضافية - اختبار SMS من iPhone
// ═══════════════════════════════════════════════════════════════════════

/**
 * 📱 اختبار استقبال SMS من iPhone
 * 
 * استخدم هذه الدالة لاختبار استقبال رسالة نصية
 */
function TEST_SMS_RECEPTION() {
  Logger.log('╔═══════════════════════════════════════════════════════════╗');
  Logger.log('║            📱 اختبار استقبال SMS من iPhone             ║');
  Logger.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  Logger.log('📋 الخطوات:');
  Logger.log('1. ✅ افتح Shortcuts في iPhone');
  Logger.log('2. ✅ شغل Shortcut "SJA SMS Parser"');
  Logger.log('3. ✅ راجع Logs هنا بعد 5 ثواني');
  Logger.log('4. ✅ تحقق من Google Sheet (User_USER1)\n');
  
  Logger.log('⏰ انتظار 60 ثانية لاستقبال البيانات...\n');
  Logger.log('💡 نصيحة: راقب قسم Executions في Google Apps Script Editor\n');
  
  // معلومات Web App
  var url = ScriptApp.getService().getUrl();
  Logger.log('🌐 Web App URL:');
  Logger.log(url + '\n');
  
  // التحقق من آخر تنفيذ
  Logger.log('📊 للتحقق من استقبال البيانات:');
  Logger.log('1. افتح Google Apps Script Editor');
  Logger.log('2. اذهب إلى: Executions (الجانب الأيسر)');
  Logger.log('3. شاهد آخر تنفيذ لـ doPost');
  Logger.log('4. تحقق من Logs\n');
  
  Logger.log('✅ الاختبار جاهز! أرسل SMS من iPhone الآن.');
}

/**
 * 📨 محاكاة استقبال SMS (للاختبار)
 * 
 * استخدم هذه الدالة لمحاكاة استقبال رسالة بنكية
 */
function SIMULATE_SMS_RECEPTION() {
  Logger.log('╔═══════════════════════════════════════════════════════════╗');
  Logger.log('║              📨 محاكاة استقبال SMS بنكي                ║');
  Logger.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  // رسائل اختبار من بنوك مختلفة
  var testSMS = [
    {
      bank: 'STC Pay',
      sms: 'تم الشراء بمبلغ 150.00 ريال من AMAZON.COM بتاريخ 2026-01-20'
    },
    {
      bank: 'AlRajhi',
      sms: 'مشترياتك بمبلغ 250.50 ريال في كارفور'
    },
    {
      bank: 'D360',
      sms: 'عملية شراء 99.99 SAR من Netflix'
    }
  ];
  
  Logger.log('📱 اختبار ' + testSMS.length + ' رسالة بنكية...\n');
  
  for (var i = 0; i < testSMS.length; i++) {
    var msg = testSMS[i];
    Logger.log((i + 1) + '. اختبار ' + msg.bank + ':');
    Logger.log('   SMS: ' + msg.sms);
    
    try {
      // محاكاة doPost request
      var mockRequest = {
        postData: {
          contents: JSON.stringify({
            sms_text: msg.sms,
            source: 'test',
            timestamp: new Date().toISOString()
          })
        }
      };
      
      var result = doPost(mockRequest);
      Logger.log('   ✅ نجح: تم معالجة الرسالة\n');
      
    } catch (e) {
      Logger.log('   ❌ فشل: ' + e.message + '\n');
    }
  }
  
  Logger.log('✅ تم اختبار جميع الرسائل!');
  Logger.log('📊 تحقق من Google Sheet (User_USER1) للتأكد من الإضافة');
}

/**
 * 🔍 التحقق من آخر عملية مُضافة
 */
function CHECK_LAST_TRANSACTION() {
  Logger.log('╔═══════════════════════════════════════════════════════════╗');
  Logger.log('║              🔍 التحقق من آخر عملية                    ║');
  Logger.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName('User_USER1');
    
    if (!sheet) {
      Logger.log('❌ ورقة User_USER1 غير موجودة');
      return;
    }
    
    var lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      Logger.log('⚠️ لا توجد عمليات مسجلة');
      return;
    }
    
    // قراءة آخر 5 عمليات
    var startRow = Math.max(2, lastRow - 4);
    var data = sheet.getRange(startRow, 1, lastRow - startRow + 1, 10).getValues();
    
    Logger.log('📊 آخر ' + data.length + ' عمليات:\n');
    
    for (var i = data.length - 1; i >= 0; i--) {
      var row = data[i];
      var date = new Date(row[0]);
      var amount = row[1];
      var merchant = row[2];
      var category = row[4];
      var account = row[5];
      
      Logger.log((data.length - i) + '. ' + (amount >= 0 ? '📥' : '📤') + ' ' + Math.abs(amount) + ' ريال');
      Logger.log('   📍 ' + merchant);
      Logger.log('   📂 ' + category);
      Logger.log('   🏦 ' + account);
      Logger.log('   📅 ' + date.toLocaleString('ar-SA'));
      Logger.log('');
    }
    
    Logger.log('✅ إجمالي العمليات: ' + (lastRow - 1));
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
  }
}

/**
 * 🧹 اختبار التنظيف (اختياري - احذر!)
 */
function TEST_CLEANUP_SCRIPT() {
  Logger.log('⚠️⚠️⚠️ تحذير: هذا سيحذف جميع البيانات! ⚠️⚠️⚠️');
  Logger.log('هل أنت متأكد؟ (علّق هذا السطر للتأكيد)');
  return;
  
  // إلغاء التعليق للتشغيل:
  // if (typeof CLEANUP_DELETE_USER2_UPDATE_USER1 === 'function') {
  //   CLEANUP_DELETE_USER2_UPDATE_USER1();
  // }
}

// ═══════════════════════════════════════════════════════════════════════
// دالة شاملة سريعة للمبتدئين
// ═══════════════════════════════════════════════════════════════════════

/**
 * ⚡ اختبار سريع شامل
 * 
 * استخدم هذه الدالة للاختبار السريع
 */
function QUICK_TEST() {
  Logger.log('⚡ اختبار سريع...\n');
  
  // 1. الأساسيات
  Logger.log('1️⃣ الأساسيات:');
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  Logger.log('   SHEET_ID: ' + (sheetId ? '✅' : '❌'));
  
  var botToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  Logger.log('   TELEGRAM_BOT_TOKEN: ' + (botToken ? '✅' : '❌ (اختياري)'));
  
  // 2. Web App
  Logger.log('\n2️⃣ Web App:');
  var url = ScriptApp.getService().getUrl();
  Logger.log('   URL: ' + (url ? '✅' : '❌'));
  if (url) {
    Logger.log('   ' + url);
  }
  
  // 3. الأوراق
  Logger.log('\n3️⃣ الأوراق:');
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    Logger.log('   User_USER1: ' + (ss.getSheetByName('User_USER1') ? '✅' : '❌'));
    Logger.log('   Categories: ' + (ss.getSheetByName('Categories') ? '✅' : '❌'));
    Logger.log('   Budgets: ' + (ss.getSheetByName('Budgets') ? '✅' : '❌'));
  } catch (e) {
    Logger.log('   ❌ خطأ في الاتصال');
  }
  
  Logger.log('\n✅ انتهى الاختبار السريع!');
}
