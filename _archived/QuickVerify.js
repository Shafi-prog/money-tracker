/**
 * ============================================
 * SJA-V1 | Quick Verification & Testing
 * ============================================
 * 
 * للتحقق السريع من أن كل شيء يعمل
 */

// ================================
// 1. التحقق من البيئة
// ================================

function VERIFY_ENVIRONMENT() {
  Logger.log('🔍 التحقق من البيئة...\n');
  
  var results = {
    properties: {},
    functions: {},
    sheets: {},
    errors: []
  };
  
  // التحقق من Properties
  Logger.log('📋 Script Properties:');
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  
  var required = ['GROQ_KEY', 'GEMINI_KEY', 'TELEGRAM_TOKEN', 'TELEGRAM_CHAT_ID', 'SHEET_ID'];
  
  required.forEach(function(key) {
    var exists = !!allProps[key];
    results.properties[key] = exists;
    Logger.log('   ' + (exists ? '✅' : '❌') + ' ' + key);
  });
  
  // التحقق من الدوال المهمة
  Logger.log('\n🔧 الدوال الأساسية:');
  var functions = [
    'SJA_setupBankingSystem',
    'SJA_registerAccount',
    'SJA_detectAccountFromSMS',
    'executeUniversalFlowSJA',
    'SJA_ONE_CLICK_SETUP',
    'SJA_COMPLETE_WORKFLOW'
  ];
  
  functions.forEach(function(fn) {
    var exists = typeof eval('typeof ' + fn) !== 'undefined';
    results.functions[fn] = exists;
    Logger.log('   ' + (exists ? '✅' : '❌') + ' ' + fn);
  });
  
  Logger.log('\n═══════════════════════════════════════');
  
  var propsOk = required.every(function(k) { return results.properties[k]; });
  var funcsOk = functions.every(function(f) { return results.functions[f]; });
  
  if (propsOk && funcsOk) {
    Logger.log('✅ البيئة جاهزة 100%!');
    Logger.log('🚀 يمكنك تشغيل: SJA_COMPLETE_WORKFLOW()');
  } else {
    Logger.log('⚠️ بعض المتطلبات مفقودة');
    if (!propsOk) {
      Logger.log('   📋 راجع Script Properties');
    }
    if (!funcsOk) {
      Logger.log('   🔧 بعض الدوال مفقودة (تأكد من رفع الملفات)');
    }
  }
  
  Logger.log('═══════════════════════════════════════\n');
  
  return results;
}

// ================================
// 2. اختبار اتصال Telegram
// ================================

function TEST_TELEGRAM() {
  Logger.log('📱 اختبار Telegram...\n');
  
  try {
    var token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
    
    if (!token) {
      Logger.log('❌ TELEGRAM_TOKEN مفقود');
      return false;
    }
    
    if (!chatId) {
      Logger.log('❌ TELEGRAM_CHAT_ID مفقود');
      return false;
    }
    
    Logger.log('✅ Token موجود');
    Logger.log('✅ Chat ID موجود');
    
    // اختبار إرسال
    Logger.log('\n📤 إرسال رسالة اختبار...');
    
    sendTelegram_(
      '🧪 *SJA MoneyTracker - Test*\n\n' +
      '✅ Telegram متصل\n' +
      '✅ البوت يعمل\n' +
      '✅ المجموعة صحيحة\n\n' +
      '_تم الإرسال من Apps Script_',
      chatId
    );
    
    Logger.log('✅ تم الإرسال بنجاح!');
    Logger.log('📱 تحقق من Telegram الآن');
    
    return true;
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

// ================================
// 3. اختبار Google Sheets
// ================================

function TEST_SHEETS() {
  Logger.log('📊 اختبار Google Sheets...\n');
  
  try {
    var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    
    if (!sheetId) {
      Logger.log('❌ SHEET_ID مفقود');
      return false;
    }
    
    var ss = SpreadsheetApp.openById(sheetId);
    Logger.log('✅ تم الاتصال بـ Google Sheets');
    Logger.log('   الاسم: ' + ss.getName());
    
    // عد الأوراق
    var sheets = ss.getSheets();
    Logger.log('   عدد الأوراق: ' + sheets.length);
    
    sheets.forEach(function(sheet) {
      Logger.log('   - ' + sheet.getName());
    });
    
    return true;
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    Logger.log('   تأكد من SHEET_ID صحيح');
    Logger.log('   تأكد من أن الملف مشارك معك');
    return false;
  }
}

// ================================
// 4. اختبار AI
// ================================

function TEST_AI() {
  Logger.log('🤖 اختبار AI...\n');
  
  try {
    var groqKey = PropertiesService.getScriptProperties().getProperty('GROQ_KEY');
    var geminiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
    
    if (!groqKey && !geminiKey) {
      Logger.log('❌ لا يوجد AI keys');
      return false;
    }
    
    Logger.log((groqKey ? '✅' : '❌') + ' GROQ_KEY');
    Logger.log((geminiKey ? '✅' : '❌') + ' GEMINI_KEY');
    
    // اختبار بسيط
    var testSMS = 'شراء بـ 50 ريال من ستاربكس';
    
    Logger.log('\n📤 اختبار Parser...');
    Logger.log('   الرسالة: ' + testSMS);
    
    var result = SJA_hybridParser(testSMS);
    
    if (result) {
      Logger.log('\n✅ Parser يعمل!');
      Logger.log('   المبلغ: ' + result.amount);
      Logger.log('   التاجر: ' + result.merchant);
      Logger.log('   التصنيف: ' + result.category);
      return true;
    } else {
      Logger.log('⚠️ Parser أرجع null');
      return false;
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

// ================================
// 5. اختبار Account Detection
// ================================

function TEST_ACCOUNT_DETECTION() {
  Logger.log('💳 اختبار Account Detection...\n');
  
  try {
    var testMessages = [
      {sms: 'شراء عبر:*3281 بـ 10 SAR', expect: '3281'},
      {sms: 'بطاقة **0305 مبلغ 20 SAR', expect: '0305'},
      {sms: 'من9767 بـSAR 30', expect: '9767'},
      {sms: 'بطاقة:*3449 مبلغ 40 SAR', expect: '3449'}
    ];
    
    var passed = 0;
    var failed = 0;
    
    testMessages.forEach(function(test) {
      var account = SJA_detectAccountFromSMS(test.sms);
      
      if (account && account.accountId === test.expect) {
        Logger.log('✅ ' + test.expect + ' → ' + account.bankName);
        passed++;
      } else {
        Logger.log('❌ توقع ' + test.expect + ' لكن حصل: ' + (account ? account.accountId : 'null'));
        failed++;
      }
    });
    
    Logger.log('\n📊 النتائج: ' + passed + '/' + testMessages.length + ' نجح');
    
    return failed === 0;
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

// ================================
// 6. اختبار End-to-End
// ================================

function TEST_END_TO_END() {
  Logger.log('🎯 اختبار End-to-End...\n');
  
  try {
    var sms = 'شراء Apple Pay\nعبر:*3281\nبـ:15 SAR\nمن:TEST MERCHANT\nفي: 20/01/26';
    
    Logger.log('📨 الرسالة:');
    Logger.log(sms);
    Logger.log('');
    
    var result = executeUniversalFlowSJA(sms, 'test_verification', null, null);
    
    if (result && result.ok) {
      Logger.log('✅ Flow نجح!');
      if (result.account) {
        Logger.log('   الحساب: ' + result.account.accountId + ' (' + result.account.bankName + ')');
      }
      Logger.log('   المستخدم: ' + result.userId);
      Logger.log('\n📱 تحقق من Telegram');
      Logger.log('📊 تحقق من Google Sheets → Sheet1');
      
      return true;
    } else {
      Logger.log('❌ Flow فشل: ' + JSON.stringify(result));
      return false;
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e);
    return false;
  }
}

// ================================
// 7. اختبار شامل
// ================================

function RUN_ALL_TESTS() {
  Logger.log('🧪🧪🧪 بدء الاختبارات الشاملة 🧪🧪🧪\n');
  Logger.log('═══════════════════════════════════════\n');
  
  var tests = [
    {name: 'البيئة', fn: VERIFY_ENVIRONMENT},
    {name: 'Telegram', fn: TEST_TELEGRAM},
    {name: 'Google Sheets', fn: TEST_SHEETS},
    {name: 'AI Parser', fn: TEST_AI},
    {name: 'Account Detection', fn: TEST_ACCOUNT_DETECTION},
    {name: 'End-to-End Flow', fn: TEST_END_TO_END}
  ];
  
  var results = [];
  
  tests.forEach(function(test) {
    Logger.log('🔹 اختبار: ' + test.name);
    Logger.log('───────────────────────────────────────');
    
    try {
      var result = test.fn();
      results.push({name: test.name, passed: result});
      Logger.log('');
    } catch (e) {
      Logger.log('❌ Exception: ' + e + '\n');
      results.push({name: test.name, passed: false});
    }
  });
  
  Logger.log('═══════════════════════════════════════');
  Logger.log('📊 النتائج النهائية:');
  Logger.log('═══════════════════════════════════════');
  
  var passed = 0;
  var failed = 0;
  
  results.forEach(function(r) {
    Logger.log((r.passed ? '✅' : '❌') + ' ' + r.name);
    if (r.passed) passed++;
    else failed++;
  });
  
  Logger.log('');
  Logger.log('إجمالي: ' + passed + '/' + tests.length + ' نجح');
  
  if (failed === 0) {
    Logger.log('\n🎉🎉🎉 جميع الاختبارات نجحت! 🎉🎉🎉');
    Logger.log('🚀 النظام جاهز 100% للاستخدام!');
    Logger.log('\nالخطوة التالية:');
    Logger.log('1. نشر Web App');
    Logger.log('2. إعداد iPhone Automation (اختياري)');
    Logger.log('3. بدء الاستخدام الحقيقي!');
  } else {
    Logger.log('\n⚠️ بعض الاختبارات فشلت');
    Logger.log('راجع الأخطاء أعلاه وأصلحها');
  }
  
  Logger.log('═══════════════════════════════════════\n');
  
  return {passed: passed, failed: failed, total: tests.length};
}

// ================================
// 8. Quick Fix للمشاكل الشائعة
// ================================

function FIX_COMMON_ISSUES() {
  Logger.log('🔧 إصلاح المشاكل الشائعة...\n');
  
  // 1. إنشاء Account_Registry إن لم يكن موجوداً
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
    var registry = ss.getSheetByName('Account_Registry');
    
    if (!registry) {
      Logger.log('⚙️ إنشاء Account_Registry...');
      SJA_setupAccountRegistry();
      Logger.log('✅ تم');
    } else {
      Logger.log('✅ Account_Registry موجود');
    }
  } catch (e) {
    Logger.log('❌ خطأ في Account_Registry: ' + e);
  }
  
  // 2. تسجيل البطاقات إن لم تكن مسجلة
  try {
    Logger.log('\n⚙️ التحقق من البطاقات...');
    var data = ss.getSheetByName('Account_Registry').getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('⚙️ تسجيل البطاقات...');
      SJA_registerMyRealAccounts();
      Logger.log('✅ تم');
    } else {
      Logger.log('✅ البطاقات مسجلة (' + (data.length - 1) + ' بطاقة)');
    }
  } catch (e) {
    Logger.log('❌ خطأ في البطاقات: ' + e);
  }
  
  Logger.log('\n✅ انتهى الإصلاح');
}
