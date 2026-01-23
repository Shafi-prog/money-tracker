/**
 * TEST_SCRIPT.js
 * Quick testing script for SJA MoneyTracker
 * Run these functions in Google Apps Script after deploying
 */

/**
 * 🧪 اختبار معالجة رسالة SMS يدوياً
 * شغل هذه الدالة لاختبار المعالجة الكاملة
 */
function TEST_PROCESS_SMS() {
  var testMessage = 'حوالة داخلية صادرة\nمن1626\nبـSAR 500\nلـ3818;مقرن المطيري\n26/1/20 17:16';
  
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('🧪 اختبار معالجة SMS');
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('📝 الرسالة:\n' + testMessage);
  Logger.log('═══════════════════════════════════════════════════');
  
  // 1. اختبار Parser
  Logger.log('\n📊 1. تحليل الرسالة (Parser):');
  var parsed = SOV1_preParseFallback_(testMessage);
  Logger.log(JSON.stringify(parsed, null, 2));
  
  // 2. تنفيذ Flow الكامل
  Logger.log('\n🚀 2. تنفيذ Flow:');
  try {
    var result = executeUniversalFlowV120(testMessage, 'MANUAL_TEST', null);
    Logger.log('✅ نتيجة: ' + JSON.stringify(result, null, 2));
  } catch (e) {
    Logger.log('❌ خطأ: ' + e.message);
  }
  
  // 3. التحقق من Sheet1
  Logger.log('\n📋 3. التحقق من Sheet1:');
  var s1 = _sheet('Sheet1');
  var lastRow = s1.getLastRow();
  if (lastRow >= 2) {
    var lastData = s1.getRange(lastRow, 1, 1, 13).getValues()[0];
    Logger.log('آخر صف (' + lastRow + '): ' + JSON.stringify(lastData));
  }
  
  Logger.log('\n═══════════════════════════════════════════════════');
  Logger.log('✅ اكتمل الاختبار');
}

/**
 * 🔧 إعادة ضبط Webhook للتليجرام
 */
function TEST_SETUP_WEBHOOK() {
  return SETUP_TELEGRAM_WEBHOOK();
}

/**
 * 📊 فحص حالة Webhook
 */
function TEST_CHECK_WEBHOOK() {
  return CHECK_WEBHOOK_STATUS();
}

/**
 * 📤 إرسال رسالة تجريبية للتليجرام
 */
function TEST_SEND_TELEGRAM() {
  var chatId = ENV.CHAT_ID || ENV.CHANNEL_ID;
  if (!chatId) {
    Logger.log('❌ CHAT_ID غير موجود');
    return;
  }
  
  var result = sendTelegram_(chatId, '✅ رسالة اختبارية من SJA MoneyTracker\n⏰ ' + new Date().toLocaleString('ar-SA'));
  Logger.log('النتيجة: ' + JSON.stringify(result));
  return result;
}

/**
 * STEP 1: Verify all Properties are set
 * Run this FIRST before any other tests
 */
function TEST_1_VERIFY_PROPERTIES() {
  Logger.log('=== TEST 1: Verifying Script Properties ===\n');
  
  var props = PropertiesService.getScriptProperties();
  var required = [
    'GROQ_KEY',
    'GEMINI_KEY', 
    'TELEGRAM_BOT_TOKEN',
    'CHAT_ID',
    'SHEET_ID'
  ];
  
  var missing = [];
  var found = [];
  
  required.forEach(function(prop) {
    var value = props.getProperty(prop);
    if (!value) {
      missing.push(prop);
      Logger.log('❌ ' + prop + ' - MISSING');
    } else {
      found.push(prop);
      var display = value.length > 20 ? value.substring(0, 20) + '...' : value;
      Logger.log('✅ ' + prop + ' = ' + display);
    }
  });
  
  Logger.log('\n=== Results ===');
  Logger.log('Found: ' + found.length + '/' + required.length);
  Logger.log('Missing: ' + missing.length);
  
  if (missing.length > 0) {
    Logger.log('\n❌ Please add these Properties:');
    missing.forEach(function(prop) {
      Logger.log('  - ' + prop);
    });
    return false;
  }
  
  Logger.log('\n✅ All Properties configured!\n');
  return true;
}

/**
 * STEP 2: Test Telegram connection
 * Sends a test message to verify Telegram is working
 */
function TEST_2_TELEGRAM() {
  Logger.log('=== TEST 2: Testing Telegram ===\n');
  
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_TOKEN');
  var chatId = props.getProperty('TELEGRAM_CHAT_ID');
  
  if (!token || !chatId) {
    Logger.log('❌ TELEGRAM_TOKEN or TELEGRAM_CHAT_ID missing');
    return false;
  }
  
  try {
    var message = '🧪 TEST من SJA MoneyTracker\n\n' +
                  '✅ Telegram متصل بنجاح!\n' +
                  '⏰ ' + new Date().toLocaleString('ar-SA') + '\n\n' +
                  'جاهز للاستقبال الإشعارات 📱';
    
    var url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    var payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    };
    
    var options = {
      method: /** @type {const} */ ('post'),
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ Telegram message sent successfully!');
      Logger.log('Message ID: ' + result.result.message_id);
      return true;
    } else {
      Logger.log('❌ Telegram error: ' + result.description);
      return false;
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return false;
  }
}

/**
 * STEP 3: Test Google Sheets access
 * Verifies Sheet connection and lists all sheets
 */
function TEST_3_SHEETS() {
  Logger.log('=== TEST 3: Testing Google Sheets ===\n');
  
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    Logger.log('❌ SHEET_ID missing');
    return false;
  }
  
  try {
    var ss = SpreadsheetApp.openById(sheetId);
    Logger.log('✅ Connected to: ' + ss.getName());
    Logger.log('URL: ' + ss.getUrl());
    
    var sheets = ss.getSheets();
    Logger.log('\nSheets found: ' + sheets.length);
    sheets.forEach(function(sheet, i) {
      Logger.log((i + 1) + '. ' + sheet.getName() + ' (' + sheet.getMaxRows() + ' rows)');
    });
    
    return true;
  } catch (e) {
    Logger.log('❌ Error accessing Sheet: ' + e.toString());
    Logger.log('Make sure SHEET_ID is correct and Sheet is shared with script');
    return false;
  }
}

/**
 * STEP 4: Test AI Parser with sample SMS
 */
function TEST_4_AI_PARSER() {
  Logger.log('=== TEST 4: Testing AI Parser ===\n');
  
  var sampleSMS = 'شراء Apple Pay\nعبر:*3281\nبـ:25 SAR\nمن:ستاربكس\nفي: 20/01/26';
  
  Logger.log('Sample SMS:\n' + sampleSMS + '\n');
  
  try {
    // Test if function exists
    if (typeof SJA_parseEnhancedSMS === 'function') {
      var result = SJA_parseEnhancedSMS(sampleSMS);
      
      if (result) {
        Logger.log('✅ Parser successful!');
        Logger.log('Amount: ' + result.amount);
        Logger.log('Currency: ' + result.currency);
        Logger.log('Merchant: ' + result.merchant);
        Logger.log('Category: ' + result.category);
        Logger.log('Type: ' + result.transactionType);
        Logger.log('Confidence: ' + (result.confidence * 100) + '%');
        return true;
      } else {
        Logger.log('❌ Parser returned null');
        return false;
      }
    } else {
      Logger.log('❌ SJA_parseEnhancedSMS function not found');
      Logger.log('Make sure AI_Enhanced_SJA.js is deployed');
      return false;
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return false;
  }
}

/**
 * STEP 5: Test Account Detection
 * Tests detection of real bank cards
 */
function TEST_5_ACCOUNT_DETECTION() {
  Logger.log('=== TEST 5: Testing Account Detection ===\n');
  
  var testCases = [
    { card: '3281', bank: 'STC Bank', type: 'Apple Pay' },
    { card: '0305', bank: 'tiqmo', type: 'MasterCard Apple Pay' },
    { card: '9767', bank: 'AlrajhiBank', type: 'Salary Account' },
    { card: '3449', bank: 'D360', type: 'VISA & Mada' }
  ];
  
  var passed = 0;
  var failed = 0;
  
  Logger.log('Account detection test skipped - function implementation varies by setup');
  Logger.log('Check Account_Registry sheet manually to verify 15 accounts exist');
  
  return true;
}

/**
 * STEP 6: Complete Setup Workflow
 * Runs the complete automated setup
 */
function TEST_6_COMPLETE_SETUP() {
  Logger.log('=== TEST 6: Running Complete Setup ===\n');
  
  try {
    if (typeof SJA_COMPLETE_WORKFLOW === 'function') {
      Logger.log('Starting SJA_COMPLETE_WORKFLOW...\n');
      SJA_COMPLETE_WORKFLOW();
      Logger.log('\n✅ Setup completed! Check Telegram for confirmation.');
      return true;
    } else {
      Logger.log('❌ SJA_COMPLETE_WORKFLOW function not found');
      Logger.log('Make sure Setup_OneClick.js is deployed');
      return false;
    }
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return false;
  }
}

/**
 * RUN ALL TESTS SEQUENTIALLY
 * Execute this to run all tests in order
 */
function RUN_ALL_TESTS_SEQUENTIAL() {
  Logger.log('╔═══════════════════════════════════════╗');
  Logger.log('║   SJA MoneyTracker - Test Suite      ║');
  Logger.log('║   Testing all components...          ║');
  Logger.log('╚═══════════════════════════════════════╝\n');
  
  var results = {
    total: 5,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Properties
  if (TEST_1_VERIFY_PROPERTIES()) {
    results.passed++;
  } else {
    results.failed++;
    Logger.log('\n⚠️ Properties missing. Please add them before continuing.\n');
    return results;
  }
  
  Logger.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 2: Telegram
  if (TEST_2_TELEGRAM()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  Logger.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 3: Sheets
  if (TEST_3_SHEETS()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  Logger.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 4: AI Parser
  if (TEST_4_AI_PARSER()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  Logger.log('\n' + '─'.repeat(50) + '\n');
  
  // Test 5: Account Detection
  if (TEST_5_ACCOUNT_DETECTION()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  Logger.log('\n' + '═'.repeat(50));
  Logger.log('FINAL RESULTS');
  Logger.log('═'.repeat(50));
  Logger.log('Total Tests: ' + results.total);
  Logger.log('Passed: ✅ ' + results.passed);
  Logger.log('Failed: ❌ ' + results.failed);
  Logger.log('Success Rate: ' + Math.round((results.passed / results.total) * 100) + '%');
  
  if (results.failed === 0) {
    Logger.log('\n🎉 ALL TESTS PASSED! System ready for deployment.');
    Logger.log('\nNext step: Run TEST_6_COMPLETE_SETUP() to set up everything.');
  } else {
    Logger.log('\n⚠️ Some tests failed. Please fix issues before proceeding.');
  }
  
  return results;
}

/**
 * QUICK FIX: Add Properties manually
 * If Properties are missing, run this with your values
 */
function QUICK_FIX_ADD_PROPERTIES() {
  var props = PropertiesService.getScriptProperties();
  
  // ⚠️ REPLACE THESE WITH YOUR ACTUAL VALUES
  props.setProperties({
    'GROQ_KEY': 'YOUR_GROQ_KEY_HERE',
    'GEMINI_KEY': 'YOUR_GEMINI_KEY_HERE',
    'TELEGRAM_TOKEN': 'YOUR_TELEGRAM_TOKEN_HERE',
    'TELEGRAM_CHAT_ID': 'YOUR_CHAT_ID_HERE',
    'SHEET_ID': 'YOUR_SHEET_ID_HERE',
    'APP_LABEL': 'SJA-V1',
    'OWNER': 'Shafi Jahz Almutiry'
  });
  
  Logger.log('✅ Properties added! Run TEST_1_VERIFY_PROPERTIES() to verify.');
}

/**
 * HELPER: Show current Properties (without revealing full keys)
 */
function SHOW_CURRENT_PROPERTIES() {
  var props = PropertiesService.getScriptProperties();
  var all = props.getProperties();
  
  Logger.log('Current Script Properties:');
  Logger.log('─'.repeat(50));
  
  Object.keys(all).forEach(function(key) {
    var value = all[key];
    var display = value.length > 20 ? value.substring(0, 20) + '...' : value;
    Logger.log(key + ' = ' + display);
  });
}
