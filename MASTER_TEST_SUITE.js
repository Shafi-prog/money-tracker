/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MASTER_TEST_SUITE.js - مجموعة الاختبارات الشاملة الموحدة
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🎯 الدوال الرئيسية:
 * - RUN_MASTER_TESTS() - تشغيل جميع الاختبارات
 * - QUICK_DIAGNOSTIC() - تشخيص سريع
 * - SHOW_WEBAPP_URL() - عرض رابط Web App
 * - RESET_TELEGRAM_WEBHOOK() - إعادة تعيين Webhook
 * - CLEANUP_TEST_DATA() - تنظيف بيانات الاختبارات
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 🚀 نقطة الدخول الرئيسية - شغل هذه الدالة فقط
 */
function RUN_MASTER_TESTS() {
  var startTime = Date.now();
  
  Logger.log('╔═══════════════════════════════════════════════════════════════════════╗');
  Logger.log('║           🧪 مجموعة الاختبارات الشاملة - SJA MoneyTracker           ║');
  Logger.log('║                    ' + new Date().toLocaleString('ar-SA') + '                       ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════════════╝\n');
  
  var suites = [
    { name: '⚙️ تهيئة النظام', fn: TEST_SUITE_CONFIG },
    { name: '📊 الأوراق والهيكل', fn: TEST_SUITE_SHEETS },
    { name: '🔧 الدوال الأساسية', fn: TEST_SUITE_FUNCTIONS },
    { name: '🤖 AI والتحليل', fn: TEST_SUITE_AI_PARSER },
    { name: '📱 معالجة SMS', fn: TEST_SUITE_SMS_FLOW },
    { name: '🔑 Primary Keys', fn: TEST_SUITE_PRIMARY_KEYS },
    { name: '🗑️ Cascade Delete', fn: TEST_SUITE_CASCADE_DELETE },
    { name: '📤 Telegram', fn: TEST_SUITE_TELEGRAM },
    { name: '🌐 Webhook', fn: TEST_SUITE_WEBHOOK },
    { name: '🛡️ سلامة البيانات', fn: TEST_SUITE_INTEGRITY }
  ];
  
  var results = [];
  var totalPassed = 0;
  var totalFailed = 0;
  var totalSkipped = 0;
  
  suites.forEach(function(suite, idx) {
    Logger.log('\n' + '═'.repeat(70));
    Logger.log('📦 [' + (idx + 1) + '/' + suites.length + '] ' + suite.name);
    Logger.log('═'.repeat(70));
    
    try {
      var result = suite.fn();
      results.push({
        name: suite.name,
        passed: result.passed || 0,
        failed: result.failed || 0,
        skipped: result.skipped || 0,
        tests: result.tests || [],
        error: null
      });
      
      totalPassed += result.passed || 0;
      totalFailed += result.failed || 0;
      totalSkipped += result.skipped || 0;
      
    } catch (e) {
      results.push({
        name: suite.name,
        passed: 0,
        failed: 1,
        skipped: 0,
        tests: [],
        error: e.message
      });
      totalFailed++;
      Logger.log('❌ خطأ في المجموعة: ' + e.message);
    }
  });
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // 📊 ملخص النتائج
  // ═══════════════════════════════════════════════════════════════════════════════
  
  var duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  Logger.log('\n\n');
  Logger.log('╔═══════════════════════════════════════════════════════════════════════╗');
  Logger.log('║                         📊 ملخص النتائج                              ║');
  Logger.log('╠═══════════════════════════════════════════════════════════════════════╣');
  
  results.forEach(function(r) {
    var status = r.failed === 0 ? '✅' : '❌';
    var line = '║ ' + status + ' ' + r.name.padEnd(30) + 
               '✓' + String(r.passed).padStart(3) + 
               ' ✗' + String(r.failed).padStart(3) + 
               ' ⊘' + String(r.skipped).padStart(3);
    Logger.log(line.padEnd(74) + '║');
  });
  
  Logger.log('╠═══════════════════════════════════════════════════════════════════════╣');
  
  var totalTests = totalPassed + totalFailed + totalSkipped;
  var passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  var finalStatus = totalFailed === 0 ? '🎉 جميع الاختبارات نجحت!' : '⚠️ بعض الاختبارات فشلت';
  
  Logger.log('║                                                                       ║');
  Logger.log('║   ✅ نجح: ' + String(totalPassed).padEnd(5) + '  ❌ فشل: ' + String(totalFailed).padEnd(5) + '  ⊘ تخطى: ' + String(totalSkipped).padEnd(20) + '║');
  Logger.log('║   📈 نسبة النجاح: ' + passRate + '%'.padEnd(50) + '║');
  Logger.log('║   ⏱️ الوقت: ' + duration + ' ثانية'.padEnd(55) + '║');
  Logger.log('║                                                                       ║');
  Logger.log('║   ' + finalStatus.padEnd(66) + '║');
  Logger.log('╚═══════════════════════════════════════════════════════════════════════╝');
  
  // إرسال تقرير للتليجرام
  sendTestReportToTelegram_(results, totalPassed, totalFailed, totalSkipped, duration);
  
  return {
    suites: results,
    summary: {
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      total: totalTests,
      passRate: passRate,
      duration: duration
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 Test Suites
// ═══════════════════════════════════════════════════════════════════════════════

function TEST_SUITE_CONFIG() {
  var tests = [];
  
  // Test 1: ENV موجود
  tests.push(runMasterTest_('ENV معرف', function() {
    return typeof ENV !== 'undefined';
  }));
  
  // Test 2: SHEET_ID
  tests.push(runMasterTest_('SHEET_ID موجود', function() {
    return ENV.SHEET_ID && ENV.SHEET_ID.length > 10;
  }));
  
  // Test 3: TELEGRAM_TOKEN
  tests.push(runMasterTest_('TELEGRAM_TOKEN موجود', function() {
    return ENV.TELEGRAM_TOKEN && ENV.TELEGRAM_TOKEN.length > 20;
  }));
  
  // Test 4: CHAT_ID
  tests.push(runMasterTest_('CHAT_ID أو CHANNEL_ID موجود', function() {
    return (ENV.CHAT_ID && ENV.CHAT_ID.length > 0) || 
           (ENV.CHANNEL_ID && ENV.CHANNEL_ID.length > 0);
  }));
  
  // Test 5: AI Keys
  tests.push(runMasterTest_('GROQ_KEY أو GEMINI_KEY موجود', function() {
    return (ENV.GROQ_KEY && ENV.GROQ_KEY.length > 10) || 
           (ENV.GEMINI_KEY && ENV.GEMINI_KEY.length > 10);
  }, true)); // optional
  
  return summarizeTests(tests);
}

function TEST_SUITE_SHEETS() {
  var tests = [];
  
  // Test 1: الاتصال بالـ Spreadsheet
  tests.push(runMasterTest_('الاتصال بـ Spreadsheet', function() {
    var ss = _ss();
    return ss && ss.getName().length > 0;
  }));
  
  // Test sheets individually to avoid closure issues
  tests.push(runMasterTest_('ورقة Sheet1 موجودة', function() {
    var sheet = _sheet('Sheet1');
    return sheet !== null;
  }));
  
  tests.push(runMasterTest_('ورقة Budgets موجودة', function() {
    var sheet = _sheet('Budgets');
    return sheet !== null;
  }));
  
  tests.push(runMasterTest_('ورقة Dashboard موجودة', function() {
    var sheet = _sheet('Dashboard');
    return sheet !== null;
  }));
  
  tests.push(runMasterTest_('ورقة Debt_Ledger موجودة', function() {
    var sheet = _sheet('Debt_Ledger');
    return sheet !== null;
  }));
  
  // Test 6: Headers في Sheet1
  tests.push(runMasterTest_('Sheet1 يحتوي على بيانات', function() {
    var s1 = _sheet('Sheet1');
    return s1.getLastRow() >= 1;
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_FUNCTIONS() {
  var tests = [];
  
  // Test each function individually to avoid closure issues
  tests.push(runMasterTest_('دالة doPost', function() {
    return typeof doPost === 'function';
  }));
  
  tests.push(runMasterTest_('دالة doGet', function() {
    return typeof doGet === 'function';
  }));
  
  tests.push(runMasterTest_('دالة executeUniversalFlowV120', function() {
    return typeof executeUniversalFlowV120 === 'function';
  }));
  
  tests.push(runMasterTest_('دالة syncQuadV120', function() {
    return typeof syncQuadV120 === 'function';
  }));
  
  tests.push(runMasterTest_('دالة sendTelegram_', function() {
    return typeof sendTelegram_ === 'function';
  }));
  
  tests.push(runMasterTest_('دالة _ss', function() {
    return typeof _ss === 'function';
  }));
  
  tests.push(runMasterTest_('دالة _sheet', function() {
    return typeof _sheet === 'function';
  }));
  
  tests.push(runMasterTest_('دالة generateUUID_', function() {
    return typeof generateUUID_ === 'function';
  }));
  
  tests.push(runMasterTest_('دالة insertTransaction_', function() {
    return typeof insertTransaction_ === 'function';
  }));
  
  tests.push(runMasterTest_('دالة deleteTransaction_', function() {
    return typeof deleteTransaction_ === 'function';
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_AI_PARSER() {
  var tests = [];
  
  // Test 1: دالة AI موجودة
  tests.push(runMasterTest_('callAiHybridV120 موجودة', function() {
    return typeof callAiHybridV120 === 'function';
  }));
  
  // Test 2: Fallback Parser
  tests.push(runMasterTest_('SOV1_preParseFallback_ موجودة', function() {
    return typeof SOV1_preParseFallback_ === 'function';
  }));
  
  // Test 3: تحليل رسالة شراء
  tests.push(runMasterTest_('تحليل رسالة شراء', function() {
    var sms = 'شراء مدى مبلغ: SAR 150.00 لدى: جرير';
    var parsed = SOV1_preParseFallback_(sms);
    return parsed && parsed.amount === 150;
  }));
  
  // Test 4: استخراج المبلغ
  tests.push(runMasterTest_('استخراج المبلغ بدقة', function() {
    var sms = 'SAR 239.05 خصم من حسابك';
    var parsed = SOV1_preParseFallback_(sms);
    return parsed && Math.abs(parsed.amount - 239.05) < 0.01;
  }));
  
  // Test 5: تمييز الوارد والصادر
  tests.push(runMasterTest_('تمييز حوالة واردة', function() {
    var sms = 'حوالة واردة إلى حسابك بمبلغ 500 ريال';
    var parsed = SOV1_preParseFallback_ ? SOV1_preParseFallback_(sms) : null;
    return parsed && parsed.isIncoming === true;
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_SMS_FLOW() {
  var tests = [];
  
  // Test 1: executeUniversalFlowV120
  tests.push(runMasterTest_('Flow يعمل بدون أخطاء', function() {
    var sms = 'اختبار شراء SAR 10.00 لدى متجر الاختبار';
    try {
      executeUniversalFlowV120(sms, 'UNIT_TEST', null);
      return true;
    } catch (e) {
      return false;
    }
  }));
  
  // Test 2: الإضافة لـ Sheet1
  tests.push(runMasterTest_('الإضافة لـ Sheet1', function() {
    var s1 = _sheet('Sheet1');
    var beforeCount = s1.getLastRow();
    
    var sms = 'شراء اختباري SAR 5.00';
    executeUniversalFlowV120(sms, 'TEST_ADD', null);
    
    var afterCount = s1.getLastRow();
    return afterCount > beforeCount;
  }));
  
  // Test 3: syncQuadV120
  tests.push(runMasterTest_('syncQuadV120 تعمل', function() {
    var data = { amount: 1, merchant: 'test', category: 'اختبار', type: 'شراء', isIncoming: false };
    var result = syncQuadV120(data, 'test raw', 'TEST');
    return result !== null && result !== undefined;
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_PRIMARY_KEYS() {
  var tests = [];
  
  // Test 1: توليد UUID
  tests.push(runMasterTest_('توليد UUID', function() {
    var uuid = generateUUID_();
    return uuid && uuid.length > 10 && uuid.indexOf('-') !== -1;
  }));
  
  // Test 2: توليد Short UUID
  tests.push(runMasterTest_('توليد Short UUID', function() {
    var uuid = generateShortUUID_();
    return uuid && uuid.startsWith('TXN-');
  }));
  
  // Test 3: insertTransaction_ مع UUID
  tests.push(runMasterTest_('insertTransaction_ مع UUID', function() {
    var data = { amount: 1, merchant: 'UUID Test', category: 'اختبار', type: 'شراء' };
    var result = insertTransaction_(data, 'PK_TEST', 'test');
    return result && result.uuid && result.uuid.startsWith('TXN-');
  }));
  
  // Test 4: البحث بالـ UUID
  tests.push(runMasterTest_('البحث بالـ UUID', function() {
    var data = { amount: 2, merchant: 'Find Test UUID', category: 'بحث', type: 'شراء' };
    var result = insertTransaction_(data, 'FIND_TEST', 'find test uuid');
    
    var found = findTransactionByUUID_(result.uuid);
    // الـ header في الورقة قد يكون بأي تنسيق - نبحث عن القيمة في أي مفتاح
    if (!found) return false;
    var values = Object.values(found);
    return values.indexOf('Find Test UUID') !== -1;
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_CASCADE_DELETE() {
  var tests = [];
  
  // Test 1: إنشاء معاملة للحذف
  var testUUID = null;
  tests.push(runMasterTest_('إنشاء معاملة للاختبار', function() {
    var data = { amount: 99, merchant: 'DELETE TEST', category: 'حذف اختباري', type: 'شراء' };
    var result = insertTransaction_(data, 'DELETE_TEST', 'cascade delete test');
    testUUID = result.uuid;
    return testUUID !== null;
  }));
  
  // Test 2: التحقق من الوجود قبل الحذف
  tests.push(runMasterTest_('المعاملة موجودة قبل الحذف', function() {
    if (!testUUID) return false;
    var found = findTransactionByUUID_(testUUID);
    return found !== null;
  }));
  
  // Test 3: Cascade Delete
  tests.push(runMasterTest_('Cascade Delete يعمل', function() {
    if (!testUUID) return false;
    var result = deleteTransaction_(testUUID);
    return result && result.success && result.deleted.length > 0;
  }));
  
  // Test 4: التحقق من الحذف
  tests.push(runMasterTest_('المعاملة محذوفة من كل الأوراق', function() {
    if (!testUUID) return false;
    var found = findTransactionByUUID_(testUUID);
    return found === null;
  }));
  
  return summarizeTests(tests);
}

function TEST_SUITE_TELEGRAM() {
  var tests = [];
  
  // Test 1: sendTelegram_ موجودة
  tests.push(runMasterTest_('sendTelegram_ موجودة', function() {
    return typeof sendTelegram_ === 'function';
  }));
  
  // Test 2: getHubChatId_
  tests.push(runMasterTest_('getHubChatId_ ترجع قيمة', function() {
    if (typeof getHubChatId_ !== 'function') return false;
    var chatId = getHubChatId_();
    return chatId && chatId.length > 0;
  }));
  
  // Test 3: إرسال رسالة
  tests.push(runMasterTest_('إرسال رسالة Telegram', function() {
    var chatId = ENV.CHAT_ID || ENV.CHANNEL_ID;
    if (!chatId || !ENV.TELEGRAM_TOKEN) return null; // skip
    
    var result = sendTelegram_(chatId, '🧪 اختبار تلقائي - ' + new Date().toLocaleTimeString('ar-SA'));
    return result && result.ok;
  }, true));
  
  return summarizeTests(tests);
}

function TEST_SUITE_WEBHOOK() {
  var tests = [];
  
  // Test 1: doPost موجودة
  tests.push(runMasterTest_('doPost موجودة', function() {
    return typeof doPost === 'function';
  }));
  
  // Test 2: doGet موجودة
  tests.push(runMasterTest_('doGet موجودة', function() {
    return typeof doGet === 'function';
  }));
  
  // Test 3: normalizeRequest_
  tests.push(runMasterTest_('normalizeRequest_ موجودة', function() {
    return typeof normalizeRequest_ === 'function';
  }));
  
  // Test 4: handleTelegramWebhook_
  tests.push(runMasterTest_('handleTelegramWebhook_ موجودة', function() {
    return typeof handleTelegramWebhook_ === 'function';
  }));
  
  // Test 5: Web App URL
  tests.push(runMasterTest_('Web App منشور', function() {
    try {
      var url = ScriptApp.getService().getUrl();
      return url && url.length > 20;
    } catch (e) {
      return false;
    }
  }));
  
  // Test 6: Telegram Webhook
  tests.push(runMasterTest_('Telegram Webhook مفعل', function() {
    if (!ENV.TELEGRAM_TOKEN) return null;
    
    try {
      var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/getWebhookInfo';
      var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      var info = JSON.parse(resp.getContentText());
      return info.ok && info.result && info.result.url && info.result.url.length > 0;
    } catch (e) {
      return false;
    }
  }, true));
  
  return summarizeTests(tests);
}

function TEST_SUITE_INTEGRITY() {
  var tests = [];
  
  // Test 1: checkDataIntegrity_ موجودة
  tests.push(runMasterTest_('checkDataIntegrity_ موجودة', function() {
    return typeof checkDataIntegrity_ === 'function';
  }));
  
  // Test 2: فحص السلامة
  tests.push(runMasterTest_('فحص سلامة البيانات', function() {
    var result = checkDataIntegrity_();
    return result !== null && typeof result.healthy !== 'undefined';
  }));
  
  // Test 3: SCHEMA معرف
  tests.push(runMasterTest_('SCHEMA معرف', function() {
    return typeof SCHEMA !== 'undefined' && SCHEMA.Sheet1 && SCHEMA.Budgets;
  }));
  
  return summarizeTests(tests);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 Test Utilities
// ═══════════════════════════════════════════════════════════════════════════════

function runMasterTest_(name, fn, optional) {
  try {
    var result = fn();
    
    if (result === null && optional) {
      Logger.log('   ⊘ ' + name + ' (تخطى)');
      return { name: name, status: 'skipped' };
    }
    
    if (result) {
      Logger.log('   ✅ ' + name);
      return { name: name, status: 'passed' };
    } else {
      Logger.log('   ❌ ' + name);
      return { name: name, status: 'failed' };
    }
  } catch (e) {
    Logger.log('   ❌ ' + name + ' - ' + e.message);
    return { name: name, status: 'failed', error: e.message };
  }
}

function summarizeTests(tests) {
  var passed = 0, failed = 0, skipped = 0;
  
  tests.forEach(function(t) {
    if (t.status === 'passed') passed++;
    else if (t.status === 'failed') failed++;
    else if (t.status === 'skipped') skipped++;
  });
  
  return { passed: passed, failed: failed, skipped: skipped, tests: tests };
}

function sendTestReportToTelegram_(results, passed, failed, skipped, duration) {
  try {
    var chatId = ENV.CHAT_ID || ENV.CHANNEL_ID;
    if (!chatId || !ENV.TELEGRAM_TOKEN) return;
    
    var status = failed === 0 ? '✅' : '⚠️';
    var total = passed + failed + skipped;
    var passRate = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
    
    var msg = status + ' <b>تقرير الاختبارات</b>\n\n';
    
    results.forEach(function(r) {
      var icon = r.failed === 0 ? '✅' : '❌';
      msg += icon + ' ' + r.name + '\n';
    });
    
    msg += '\n📊 <b>الملخص:</b>\n';
    msg += '✓ نجح: ' + passed + ' | ✗ فشل: ' + failed + ' | ⊘ تخطى: ' + skipped + '\n';
    msg += '📈 نسبة النجاح: ' + passRate + '%\n';
    msg += '⏱️ الوقت: ' + duration + ' ثانية';
    
    sendTelegramLogged_(chatId, msg, { parse_mode: 'HTML' });
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧹 Cleanup Test Data
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * حذف بيانات الاختبارات
 */
function CLEANUP_TEST_DATA() {
  Logger.log('🧹 تنظيف بيانات الاختبارات...\n');
  
  var ss = _ss();
  var sheets = ['Sheet1', 'Dashboard', 'Debt_Ledger'];
  var testSources = ['UNIT_TEST', 'TEST_ADD', 'PK_TEST', 'FIND_TEST', 'DELETE_TEST', 'اختبار تشخيصي', 'اختبار_1', 'اختبار_2', 'اختبار_3'];
  var deleted = 0;
  
  sheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    var data = sheet.getDataRange().getValues();
    
    // من الأسفل للأعلى
    for (var i = data.length - 1; i >= 1; i--) {
      var row = data[i];
      var isTest = false;
      
      // فحص كل الأعمدة
      for (var j = 0; j < row.length; j++) {
        var cell = String(row[j] || '');
        
        testSources.forEach(function(src) {
          if (cell.indexOf(src) !== -1) isTest = true;
        });
        
        if (cell.indexOf('UUID Test') !== -1 || 
            cell.indexOf('Find Test') !== -1 || 
            cell.indexOf('DELETE TEST') !== -1 ||
            cell.indexOf('اختبار شراء') !== -1 ||
            cell.indexOf('متجر الاختبار') !== -1) {
          isTest = true;
        }
      }
      
      if (isTest) {
        sheet.deleteRow(i + 1);
        deleted++;
      }
    }
  });
  
  // تنظيف Budgets
  var budgets = ss.getSheetByName('Budgets');
  if (budgets) {
    var bData = budgets.getDataRange().getValues();
    for (var i = bData.length - 1; i >= 1; i--) {
      var cat = String(bData[i][0] || '');
      if (cat === 'اختبار' || cat === 'بحث' || cat === 'حذف اختباري') {
        budgets.deleteRow(i + 1);
        deleted++;
      }
    }
  }
  
  Logger.log('✅ تم حذف ' + deleted + ' صف اختباري');
  return { deleted: deleted };
}
// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 Quick Diagnostic - تشخيص سريع
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🔍 تشخيص سريع (بديل FULL_SYSTEM_DIAGNOSTIC)
 */
function QUICK_DIAGNOSTIC() {
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║         🔍 تشخيص سريع للنظام                                 ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  var checks = [];
  
  // 1. ENV
  checks.push({ name: 'ENV معرف', ok: typeof ENV !== 'undefined' });
  checks.push({ name: 'SHEET_ID', ok: ENV && ENV.SHEET_ID && ENV.SHEET_ID.length > 5 });
  checks.push({ name: 'TELEGRAM_TOKEN', ok: ENV && ENV.TELEGRAM_TOKEN && ENV.TELEGRAM_TOKEN.length > 20 });
  checks.push({ name: 'CHAT_ID', ok: ENV && (ENV.CHAT_ID || ENV.CHANNEL_ID) });
  
  // 2. Functions
  checks.push({ name: 'doPost', ok: typeof doPost === 'function' });
  checks.push({ name: 'executeUniversalFlowV120', ok: typeof executeUniversalFlowV120 === 'function' });
  checks.push({ name: 'insertTransaction_', ok: typeof insertTransaction_ === 'function' });
  checks.push({ name: 'deleteTransaction_', ok: typeof deleteTransaction_ === 'function' });
  
  // 3. Sheets
  try {
    var ss = _ss();
    checks.push({ name: 'اتصال Spreadsheet', ok: true });
    checks.push({ name: 'Sheet1 موجودة', ok: ss.getSheetByName('Sheet1') !== null });
    checks.push({ name: 'Budgets موجودة', ok: ss.getSheetByName('Budgets') !== null });
  } catch (e) {
    checks.push({ name: 'اتصال Spreadsheet', ok: false });
  }
  
  // 4. Web App
  try {
    var url = ScriptApp.getService().getUrl();
    checks.push({ name: 'Web App منشور', ok: url && url.length > 20 });
  } catch (e) {
    checks.push({ name: 'Web App منشور', ok: false });
  }
  
  // 5. Webhook
  try {
    if (ENV && ENV.TELEGRAM_TOKEN) {
      var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/getWebhookInfo', { muteHttpExceptions: true });
      var info = JSON.parse(resp.getContentText());
      checks.push({ name: 'Telegram Webhook', ok: info.ok && info.result && info.result.url });
    } else {
      checks.push({ name: 'Telegram Webhook', ok: false });
    }
  } catch (e) {
    checks.push({ name: 'Telegram Webhook', ok: false });
  }
  
  // Print results
  var passed = 0, failed = 0;
  checks.forEach(function(c) {
    var icon = c.ok ? '✅' : '❌';
    Logger.log(icon + ' ' + c.name);
    if (c.ok) passed++; else failed++;
  });
  
  Logger.log('\n📊 النتيجة: ' + passed + '/' + checks.length + ' نجح');
  
  if (failed > 0) {
    Logger.log('\n⚠️ يوجد ' + failed + ' مشاكل تحتاج إصلاح');
  } else {
    Logger.log('\n🎉 النظام يعمل بشكل صحيح!');
  }
  
  return { checks: checks, passed: passed, failed: failed };
}

/**
 * 🌐 عرض Web App URL
 */
function SHOW_WEBAPP_URL() {
  try {
    var url = ScriptApp.getService().getUrl();
    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║                   🌐 Web App URL                              ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝\n');
    
    if (url) {
      Logger.log('✅ Web App URL:');
      Logger.log(url);
      Logger.log('\n📌 استخدم هذا الرابط في:');
      Logger.log('   - iPhone Shortcut');
      Logger.log('   - Telegram Webhook');
    } else {
      Logger.log('❌ Web App غير منشور!');
      Logger.log('\n📌 خطوات النشر:');
      Logger.log('   1. Deploy → New deployment');
      Logger.log('   2. Select type → Web app');
      Logger.log('   3. Execute as → Me');
      Logger.log('   4. Who has access → Anyone');
      Logger.log('   5. Deploy');
    }
    
    return url;
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    return null;
  }
}

/**
 * 🔄 إعادة تعيين Telegram Webhook
 */
function RESET_TELEGRAM_WEBHOOK() {
  Logger.log('🔄 إعادة تعيين Telegram Webhook...\n');
  
  if (!ENV.TELEGRAM_TOKEN) {
    Logger.log('❌ TELEGRAM_TOKEN غير موجود!');
    return { success: false, error: 'No token' };
  }
  
  try {
    // 1. حذف Webhook الحالي
    Logger.log('1️⃣ حذف Webhook الحالي...');
    UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/deleteWebhook', {
      method: 'post',
      payload: { drop_pending_updates: true }
    });
    Logger.log('   ✅ تم الحذف');
    
    // 2. الحصول على URL
    var webAppUrl = ENV.WEBAPP_URL_DIRECT || ENV.WEBAPP_URL || ScriptApp.getService().getUrl();
    if (!webAppUrl) {
      Logger.log('❌ Web App URL غير موجود!');
      return { success: false, error: 'No URL' };
    }
    
    Logger.log('\n2️⃣ تعيين Webhook جديد...');
    Logger.log('   URL: ' + webAppUrl);
    
    var resp = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/setWebhook', {
      method: 'post',
      payload: {
        url: webAppUrl,
        allowed_updates: JSON.stringify(['message', 'channel_post', 'callback_query']),
        drop_pending_updates: true
      }
    });
    
    var result = JSON.parse(resp.getContentText());
    Logger.log('   الرد: ' + JSON.stringify(result));
    
    // 3. التحقق
    Logger.log('\n3️⃣ التحقق...');
    var infoResp = UrlFetchApp.fetch('https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/getWebhookInfo');
    var info = JSON.parse(infoResp.getContentText());
    
    if (info.result && info.result.url) {
      Logger.log('✅ Webhook مفعل: ' + info.result.url);
      return { success: true, url: info.result.url };
    } else {
      Logger.log('❌ فشل التفعيل');
      return { success: false };
    }
    
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * 📋 للتوافق مع الاسم القديم
 */
function FULL_SYSTEM_DIAGNOSTIC() {
  return QUICK_DIAGNOSTIC();
}
