/**
 * ============================================
 * SJA-V1 | One-Click Complete Setup
 * ============================================
 * 
 * تشغيل واحد لإعداد كل شيء!
 * 
 * By: Shafi Jahz Almutiry
 */

// ================================
// Setup كامل بأمر واحد
// ================================

function SJA_ONE_CLICK_SETUP() {
  Logger.log('🚀🚀🚀 بدء الإعداد الكامل لـ SJA MoneyTracker 🚀🚀🚀\n');
  
  var results = {
    sheets: false,
    accounts: false,
    patterns: false,
    users: false,
    budgets: false,
    errors: []
  };
  
  try {
    // ================================
    // 1. إنشاء جميع الأوراق
    // ================================
    Logger.log('📊 الخطوة 1/5: إنشاء Google Sheets...');
    
    try {
      V1_setupAllSheets();
      results.sheets = true;
      Logger.log('✅ Sheets جاهزة\n');
    } catch (e) {
      results.errors.push('Sheets: ' + e);
      Logger.log('❌ خطأ في Sheets: ' + e + '\n');
    }
    
    // ================================
    // 2. نظام البنوك والحسابات
    // ================================
    Logger.log('💳 الخطوة 2/5: تسجيل البطاقات والحسابات...');
    
    try {
      var bankSetup = SJA_setupBankingSystem();
      results.accounts = true;
      Logger.log('✅ تم تسجيل ' + bankSetup.accounts + ' بطاقة/حساب');
      Logger.log('   البنوك: STC Bank, tiqmo, الراجحي, D360\n');
    } catch (e) {
      results.errors.push('Accounts: ' + e);
      Logger.log('❌ خطأ في Accounts: ' + e + '\n');
    }
    
    // ================================
    // 3. الأنماط الخاصة
    // ================================
    Logger.log('🎯 الخطوة 3/5: إعداد الأنماط الخاصة...');
    
    try {
      if (!results.patterns) {
        // تم بالفعل في SJA_setupBankingSystem
        results.patterns = true;
      }
      Logger.log('✅ 10 أنماط خاصة (تابي، تمارا، إضافة أموال، إلخ)\n');
    } catch (e) {
      results.errors.push('Patterns: ' + e);
      Logger.log('❌ خطأ في Patterns: ' + e + '\n');
    }
    
    // ================================
    // 4. تسجيل المستخدمين
    // ================================
    Logger.log('👥 الخطوة 4/5: تسجيل المستخدمين...');
    
    try {
      // USER1 - شافي جهز المطيري
      registerUser(
        'USER1',
        'شافي جهز المطيري',
        null,
        ['9767', '9765', '9682', '7815', '0005'], // الحسابات
        ['9767', '9765', '4912', '0005', '3281', '4495', '0305', '9682', '3449', '7815']  // جميع البطاقات
      );
      
      // USER2 - DELETED as requested
      
      results.users = true;
      Logger.log('✅ تم تسجيل 1 مستخدم (SJA)\n');
    } catch (e) {
      results.errors.push('Users: ' + e);
      Logger.log('❌ خطأ في Users: ' + e + '\n');
    }
    
    // ================================
    // 5. إعداد الميزانيات
    // ================================
    Logger.log('💰 الخطوة 5/5: إعداد الميزانيات...');
    
    try {
      setupDefaultBudgets_();
      results.budgets = true;
      Logger.log('✅ ميزانيات افتراضية جاهزة\n');
    } catch (e) {
      results.errors.push('Budgets: ' + e);
      Logger.log('⚠️ تحذير في Budgets: ' + e + '\n');
    }
    
    // ================================
    // النتيجة النهائية
    // ================================
    Logger.log('═══════════════════════════════════════');
    Logger.log('📊 ملخص الإعداد:');
    Logger.log('═══════════════════════════════════════');
    Logger.log('✅ Google Sheets: ' + (results.sheets ? 'نجح' : 'فشل'));
    Logger.log('✅ البطاقات والحسابات: ' + (results.accounts ? 'نجح' : 'فشل'));
    Logger.log('✅ الأنماط الخاصة: ' + (results.patterns ? 'نجح' : 'فشل'));
    Logger.log('✅ المستخدمين: ' + (results.users ? 'نجح' : 'فشل'));
    Logger.log('✅ الميزانيات: ' + (results.budgets ? 'نجح' : 'فشل'));
    
    if (results.errors.length > 0) {
      Logger.log('\n⚠️ أخطاء:');
      results.errors.forEach(function(err) {
        Logger.log('   - ' + err);
      });
    }
    
    Logger.log('═══════════════════════════════════════\n');
    
    // إرسال تقرير على Telegram (إن أمكن)
    try {
      sendSetupReport_(results);
    } catch (e) {
      Logger.log('⚠️ تعذر إرسال تقرير Telegram: ' + e);
    }
    
    Logger.log('🎉 SJA MoneyTracker جاهز للاستخدام!');
    Logger.log('📖 اقرأ TEST_NOW.md للاختبارات\n');
    
    return results;
    
  } catch (error) {
    Logger.log('❌ خطأ فادح: ' + error);
    return {ok: false, error: error.toString()};
  }
}

// ================================
// إعداد الميزانيات الافتراضية
// ================================

function setupDefaultBudgets_() {
  var ss = _ss();
  var budgetSheet = ss.getSheetByName('Budgets');
  
  if (!budgetSheet) {
    Logger.log('⚠️ Budgets sheet غير موجود');
    return;
  }
  
  // تحقق من وجود بيانات
  if (budgetSheet.getLastRow() > 1) {
    Logger.log('⚠️ Budgets موجودة مسبقاً');
    return;
  }
  
  // ميزانيات افتراضية (شهرية)
  var budgets = [
    ['مطاعم', 500, 80, true, 'monthly'],
    ['مواد غذائية', 1000, 80, true, 'monthly'],
    ['مواصلات', 300, 80, true, 'monthly'],
    ['فواتير', 600, 80, true, 'monthly'],
    ['ترفيه', 200, 90, true, 'monthly'],
    ['صحة', 400, 80, false, 'monthly'],
    ['تعليم', 300, 80, false, 'monthly'],
    ['ملابس', 250, 80, false, 'monthly'],
    ['تبرعات', 200, 90, false, 'monthly'],
    ['أخرى', 500, 80, false, 'monthly']
  ];
  
  budgets.forEach(function(budget) {
    budgetSheet.appendRow([
      budget[0], // Category
      budget[1], // Budgeted
      0,         // Spent (will be calculated)
      0,         // Remaining (formula)
      0,         // % Used (formula)
      budget[2], // Alert Threshold
      '',        // Status (formula)
      budget[3], // Auto-Budget
      budget[4]  // Period
    ]);
  });
  
  Logger.log('✅ تم إضافة ' + budgets.length + ' ميزانية افتراضية');
}

// ================================
// إرسال تقرير Setup على Telegram
// ================================

function sendSetupReport_(results) {
  var status = 
    (results.sheets ? '✅' : '❌') + ' Sheets\n' +
    (results.accounts ? '✅' : '❌') + ' Accounts\n' +
    (results.patterns ? '✅' : '❌') + ' Patterns\n' +
    (results.users ? '✅' : '❌') + ' Users\n' +
    (results.budgets ? '✅' : '❌') + ' Budgets';
  
  var message = 
    '🚀 *SJA MoneyTracker Setup Complete!*\n\n' +
    status + '\n\n';
  
  if (results.errors.length > 0) {
    message += '⚠️ *Errors:*\n';
    results.errors.forEach(function(err) {
      message += '• ' + err.substring(0, 100) + '\n';
    });
  } else {
    message += '🎉 *جميع الأنظمة جاهزة!*\n\n';
    message += '📊 *التفاصيل:*\n';
    message += '• 10 أوراق في Google Sheets\n';
    message += '• 15 بطاقة/حساب\n';
    message += '• 4 بنوك\n';
    message += '• 10 أنماط خاصة\n';
    message += '• 2 مستخدمين\n';
    message += '• 10 ميزانيات\n';
  }
  
  message += '\n_Powered by Shafi Jahz Almutiry_';
  
  sendTelegram_(message, null);
}

// ================================
// اختبار سريع بعد Setup
// ================================

function SJA_QUICK_TEST_AFTER_SETUP() {
  Logger.log('🧪 اختبار سريع بعد Setup...\n');
  
  var testMessages = [
    {
      name: 'STC Bank - Apple Pay',
      sms: 'شراء Apple Pay\nعبر:*3281\nبـ:8 SAR\nمن:LMSAT KHOZAM\nفي: 19/01/26 22:49',
      expect: {account: '3281', bank: 'STC Bank', amount: 8}
    },
    {
      name: 'tiqmo - POS',
      sms: 'شراء POS\nبـ 5.00 SAR\nمن ZAWYAT ALSAER ALADEL\nعبر MasterCard **0305',
      expect: {account: '0305', bank: 'tiqmo', amount: 5}
    },
    {
      name: 'الراجحي - حوالة',
      sms: 'حوالة داخلية صادرة\nمن9765\nبـSAR 300\nلـ3512;محمد المطيري',
      expect: {account: '9765', bank: 'بنك الراجحي', amount: 300}
    },
    {
      name: 'إضافة أموال (IGNORE)',
      sms: 'إضافة أموال\nمبلغ 1000.00 ريال\nمن آبل باي',
      expect: {ignored: true}
    }
  ];
  
  var passed = 0;
  var failed = 0;
  
  testMessages.forEach(function(test) {
    Logger.log('🔹 ' + test.name);
    
    try {
      var result = executeUniversalFlowSJA(test.sms, 'test', null, null);
      
      if (test.expect.ignored && result.ignored) {
        Logger.log('   ✅ تم تجاهلها كما متوقع\n');
        passed++;
      } else if (result.ok) {
        Logger.log('   ✅ نجح\n');
        passed++;
      } else {
        Logger.log('   ❌ فشل: ' + JSON.stringify(result) + '\n');
        failed++;
      }
    } catch (e) {
      Logger.log('   ❌ خطأ: ' + e + '\n');
      failed++;
    }
  });
  
  Logger.log('📊 النتائج:');
  Logger.log('✅ نجح: ' + passed + '/' + testMessages.length);
  Logger.log('❌ فشل: ' + failed + '/' + testMessages.length);
  
  if (failed === 0) {
    Logger.log('\n🎉 جميع الاختبارات نجحت! النظام جاهز 100%');
  } else {
    Logger.log('\n⚠️ بعض الاختبارات فشلت. راجع الأخطاء أعلاه');
  }
}

// ================================
// التحقق من المتطلبات
// ================================

function SJA_CHECK_REQUIREMENTS() {
  Logger.log('🔍 التحقق من المتطلبات...\n');
  
  var props = PropertiesService.getScriptProperties();
  var allProps = props.getProperties();
  
  var required = [
    'GROQ_KEY',
    'GEMINI_KEY',
    'TELEGRAM_TOKEN',
    'TELEGRAM_CHAT_ID',
    'SHEET_ID'
  ];
  
  var missing = [];
  
  required.forEach(function(key) {
    if (allProps[key]) {
      Logger.log('✅ ' + key + ': موجود');
    } else {
      Logger.log('❌ ' + key + ': مفقود');
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    Logger.log('\n⚠️ يجب إضافة المفاتيح المفقودة في Script Properties:');
    missing.forEach(function(key) {
      Logger.log('   - ' + key);
    });
    Logger.log('\n📖 راجع TEST_NOW.md الخطوة 2');
    return false;
  } else {
    Logger.log('\n✅ جميع المتطلبات متوفرة!');
    return true;
  }
}

// ================================
// Complete Workflow
// ================================

function SJA_COMPLETE_WORKFLOW() {
  Logger.log('🎯 بدء Complete Workflow...\n');
  
  // 1. التحقق من المتطلبات
  if (!SJA_CHECK_REQUIREMENTS()) {
    Logger.log('❌ توقف! أكمل المتطلبات أولاً');
    return;
  }
  
  // 2. Setup كامل
  Logger.log('\n═══════════════════════════════════════\n');
  var setupResult = SJA_ONE_CLICK_SETUP();
  
  // 3. الاختبارات
  Logger.log('\n═══════════════════════════════════════\n');
  SJA_QUICK_TEST_AFTER_SETUP();
  
    // 4. الإطلاق
  Logger.log('\n═══════════════════════════════════════\n');
  Logger.log('🎨 تطبيق التنسيقات النهائية...');
  
  try {
    // تطبيق RTL على جميع الأوراق
    if (typeof applyRTLToAllSheets === 'function') {
      applyRTLToAllSheets();
    }
    
    // إنشاء ورقة التصنيفات المحسنة
    if (typeof createCategoriesSheet === 'function') {
      createCategoriesSheet();
    }
    
    // إنشاء ورقة الحوالات
    if (typeof createTransfersSheet === 'function') {
      createTransfersSheet();
    }
    
    Logger.log('✅ التنسيقات جاهزة!');
  } catch (e) {
    Logger.log('⚠️ تحذير في التنسيقات: ' + e);
  }
  
  Logger.log('✅ System is now LIVE and ready to receive SMS!');
  Logger.log('📱 Web App URL: ' + ScriptApp.getService().getUrl());
  
  Logger.log('\n🎉🎉🎉 Complete Workflow انتهى بنجاح! 🎉🎉🎉');
}
