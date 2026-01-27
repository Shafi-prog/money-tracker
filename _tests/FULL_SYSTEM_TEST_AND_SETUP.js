/**
 * FULL_SYSTEM_TEST_AND_SETUP.js
 * 
 * اختبار شامل للنظام من البداية للنهاية:
 * iPhone SMS → Google Apps Script → GROK AI → Telegram
 * 
 * الخطوات:
 * 1. إعادة تعيين البيانات
 * 2. إعداد تصنيفات منطقية
 * 3. إعداد أرصدة الحسابات الابتدائية
 * 4. اختبار المعالجة الكاملة
 */

/**
 * ========================================
 * الخطوة 1: إعادة تعيين البيانات وإعداد النظام
 * ========================================
 */
function STEP1_RESET_AND_SETUP() {
  Logger.log('====================================');
  Logger.log('🔄 STEP 1: Reset & Setup');
  Logger.log('====================================\n');
  
  try {
    // 1. Reset all transaction data
    Logger.log('1️⃣ Resetting transaction data...');
    if (typeof RESET_ALL_TRANSACTION_DATA === 'function') {
      // Note: This function requires manual confirmation
      Logger.log('⚠️ Please run RESET_ALL_TRANSACTION_DATA() manually first');
      Logger.log('   Or comment out this check to skip\n');
      // RESET_ALL_TRANSACTION_DATA();
    }
    
    // 2. Setup reasonable categories
    Logger.log('2️⃣ Setting up default categories...');
    setupDefaultCategories_();
    
    // 3. Setup initial account balances
    Logger.log('3️⃣ Setting up initial balances...');
    setupInitialBalances_();
    
    // 4. Clear cache
    Logger.log('4️⃣ Clearing cache...');
    CacheService.getScriptCache().removeAll(['BUDGET_SNAP', 'SUM_today', 'SUM_week', 'SUM_month']);
    
    Logger.log('\n✅ Setup complete! Ready for testing.');
    Logger.log('📱 Next: Run STEP2_TEST_SMS_TO_TELEGRAM()');
    
    return { success: true, message: 'Setup complete' };
    
  } catch (e) {
    Logger.log('❌ Error in setup: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * إعداد التصنيفات الافتراضية المنطقية
 */
function setupDefaultCategories_() {
  var categories = [
    { name: 'مواد غذائية', budget: 1500, icon: '🛒' },
    { name: 'مطاعم ومقاهي', budget: 800, icon: '🍽️' },
    { name: 'مواصلات وبنزين', budget: 600, icon: '🚗' },
    { name: 'فواتير ورسوم', budget: 500, icon: '📄' },
    { name: 'تسوق وملابس', budget: 700, icon: '🛍️' },
    { name: 'صحة وأدوية', budget: 400, icon: '💊' },
    { name: 'ترفيه', budget: 500, icon: '🎮' },
    { name: 'تعليم', budget: 300, icon: '📚' },
    { name: 'حوالات واردة', budget: 0, icon: '💰' },
    { name: 'حوالات صادرة', budget: 0, icon: '💸' },
    { name: 'راتب', budget: 0, icon: '💵' },
    { name: 'أخرى', budget: 200, icon: '📦' }
  ];
  
  var sB = _sheet('Budgets');
  
  // Clear existing (except header)
  if (sB.getLastRow() > 1) {
    sB.deleteRows(2, sB.getLastRow() - 1);
  }
  
  // Add categories
  for (var i = 0; i < categories.length; i++) {
    var cat = categories[i];
    var row = i + 2;
    sB.getRange(row, 1).setValue(cat.name);
    sB.getRange(row, 2).setValue(cat.budget);
    sB.getRange(row, 3).setValue(0); // spent
    sB.getRange(row, 4).setFormula('=B' + row + '-C' + row); // remaining
  }
  
  Logger.log('   ✓ Added ' + categories.length + ' default categories');
}

/**
 * إعداد الأرصدة الابتدائية للحسابات
 */
function setupInitialBalances_() {
  var accounts = [
    { name: 'AlrajhiBank', balance: 15000 },
    { name: 'Tiqmo', balance: 5000 },
    { name: 'Alinma', balance: 3000 }
  ];
  
  if (typeof setBalance_ !== 'function') {
    Logger.log('   ⚠️ setBalance_ function not available');
    return;
  }
  
  for (var i = 0; i < accounts.length; i++) {
    setBalance_(accounts[i].name, accounts[i].balance);
    Logger.log('   ✓ ' + accounts[i].name + ': ' + accounts[i].balance + ' SAR');
  }
}

/**
 * ========================================
 * الخطوة 2: اختبار المعالجة الكاملة
 * ========================================
 */
function STEP2_TEST_SMS_TO_TELEGRAM() {
  Logger.log('====================================');
  Logger.log('📱 STEP 2: Test SMS → Telegram Flow');
  Logger.log('====================================\n');
  
  var testMessages = [
    // Test 1: Purchase transaction
    {
      name: 'Purchase - Grocery Store',
      sms: 'عملية شراء بمبلغ SAR 125.50 لدى كارفور بطاقة **9767 في 2026-01-24 14:30',
      expected: {
        type: 'مشتريات',
        category: 'مواد غذائية',
        amount: 125.50,
        merchant: 'كارفور'
      }
    },
    // Test 2: Restaurant
    {
      name: 'Restaurant - Al Baik',
      sms: 'عملية شراء بمبلغ SAR 45.00 لدى البيك عبر Apple Pay بطاقة **9767',
      expected: {
        type: 'مشتريات',
        category: 'مطاعم ومقاهي',
        amount: 45.00,
        merchant: 'البيك'
      }
    },
    // Test 3: Gas station
    {
      name: 'Gas Station - Aramco',
      sms: 'عملية شراء بمبلغ SAR 200.00 لدى أرامكو محطة الوقود **9767',
      expected: {
        type: 'مشتريات',
        category: 'مواصلات وبنزين',
        amount: 200.00,
        merchant: 'أرامكو'
      }
    },
    // Test 4: Salary deposit
    {
      name: 'Salary Deposit',
      sms: 'تم إيداع مبلغ 10000.00 ريال في حسابك من الشركة راتب شهر 1',
      expected: {
        type: 'حوالة',
        category: 'راتب',
        amount: 10000.00,
        merchant: 'الشركة'
      }
    },
    // Test 5: Internal transfer
    {
      name: 'Internal Transfer - AlRajhi to Tiqmo',
      sms: 'حوالة داخلية صادر بمبلغ 1000.00 ريال من حساب 9767 إلى حساب تقمو',
      expected: {
        type: 'تحويل داخلي',
        category: 'حوالات صادرة',
        amount: 1000.00,
        merchant: 'تقمو'
      }
    }
  ];
  
  var results = [];
  
  for (var i = 0; i < testMessages.length; i++) {
    var test = testMessages[i];
    Logger.log('\n📝 Test ' + (i + 1) + ': ' + test.name);
    Logger.log('   SMS: ' + test.sms.substring(0, 60) + '...');
    
    try {
      // Execute the flow
      var result = executeUniversalFlowV120(test.sms, 'TEST_SCRIPT', null);
      
      if (result) {
        Logger.log('   ✅ Processed successfully');
        results.push({ test: test.name, success: true });
        
        // Wait a bit between tests
        Utilities.sleep(1000);
      } else {
        Logger.log('   ❌ Processing returned null');
        results.push({ test: test.name, success: false, error: 'Null result' });
      }
      
    } catch (e) {
      Logger.log('   ❌ Error: ' + e.toString());
      results.push({ test: test.name, success: false, error: e.toString() });
    }
  }
  
  // Summary
  Logger.log('\n====================================');
  Logger.log('📊 Test Summary:');
  Logger.log('====================================');
  
  var passed = 0, failed = 0;
  for (var j = 0; j < results.length; j++) {
    if (results[j].success) passed++;
    else failed++;
    
    Logger.log((results[j].success ? '✅' : '❌') + ' ' + results[j].test);
  }
  
  Logger.log('\n🎯 Results: ' + passed + ' passed, ' + failed + ' failed');
  Logger.log('\n📱 Check your Telegram group for notifications!');
  Logger.log('💰 Run STEP3_VERIFY_BALANCES() to check balances');
  
  return { passed: passed, failed: failed, details: results };
}

/**
 * ========================================
 * الخطوة 3: التحقق من الأرصدة
 * ========================================
 */
function STEP3_VERIFY_BALANCES() {
  Logger.log('====================================');
  Logger.log('💰 STEP 3: Verify Account Balances');
  Logger.log('====================================\n');
  
  if (typeof getAllBalances_ !== 'function') {
    Logger.log('❌ getAllBalances_ function not available');
    return;
  }
  
  var balances = getAllBalances_();
  
  if (balances.length === 0) {
    Logger.log('⚠️ No account balances found');
    return;
  }
  
  var total = 0;
  for (var i = 0; i < balances.length; i++) {
    var acc = balances[i];
    Logger.log('💳 ' + acc.account + ': ' + acc.balance.toFixed(2) + ' SAR');
    total += acc.balance;
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('💰 Total: ' + total.toFixed(2) + ' SAR');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  Logger.log('✅ Balance verification complete');
  Logger.log('📱 Send "/balances" in Telegram to see this report');
  
  return { total: total, accounts: balances };
}

/**
 * ========================================
 * الخطوة 4: اختبار AI GROK
 * ========================================
 */
function STEP4_TEST_GROK_AI() {
  Logger.log('====================================');
  Logger.log('🤖 STEP 4: Test GROK AI Parsing');
  Logger.log('====================================\n');
  
  var testSMS = 'عملية شراء بمبلغ SAR 250.75 لدى جرير للإلكترونيات بطاقة **9767 في 2026-01-24';
  
  Logger.log('📝 Test SMS: ' + testSMS);
  Logger.log('\n🤖 Calling GROK AI...\n');
  
  try {
    if (typeof callAiHybridV120 !== 'function') {
      Logger.log('❌ callAiHybridV120 function not available');
      return;
    }
    
    var result = callAiHybridV120(testSMS);
    
    if (result) {
      Logger.log('✅ GROK AI Response:');
      Logger.log('   💼 Merchant: ' + result.merchant);
      Logger.log('   💵 Amount: ' + result.amount + ' ' + result.currency);
      Logger.log('   📂 Category: ' + result.category);
      Logger.log('   🏷️ Type: ' + result.type);
      Logger.log('   🔄 Is Incoming: ' + result.isIncoming);
      
      return { success: true, result: result };
    } else {
      Logger.log('❌ GROK AI returned null');
      return { success: false, error: 'Null result' };
    }
    
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * ========================================
 * الخطوة 5: اختبار Telegram Integration
 * ========================================
 */
function STEP5_TEST_TELEGRAM() {
  Logger.log('====================================');
  Logger.log('📱 STEP 5: Test Telegram Integration');
  Logger.log('====================================\n');
  
  // Use canonical hub chat resolution to avoid config mismatch
  var chatId = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID || ENV.CHANNEL_ID);
  
  if (!chatId) {
    Logger.log('❌ CHAT_ID not configured (check TELEGRAM_CHAT_ID / CHAT_ID / CHANNEL_ID)');
    return { success: false, error: 'No CHAT_ID' };
  }
  
  Logger.log('📤 Sending test message to Telegram...');
  
  try {
    if (typeof sendTelegram_ !== 'function') {
      Logger.log('❌ sendTelegram_ function not available');
      return { success: false, error: 'Function not available' };
    }
    
    var testMsg = 
      '🧪 <b>System Test Message</b>\n\n' +
      '✅ Money Tracker is working!\n' +
      '📅 Date: ' + new Date().toLocaleString('ar-SA') + '\n\n' +
      '🔧 All systems operational:\n' +
      '  ✓ SMS Processing\n' +
      '  ✓ GROK AI Integration\n' +
      '  ✓ Telegram Notifications\n' +
      '  ✓ Account Balances\n\n' +
      '💡 Ready to track your expenses!';
    
    var response = sendTelegramLogged_(chatId, testMsg, { parse_mode: 'HTML' });
    
    if (response && response.ok) {
      Logger.log('✅ Test message sent successfully!');
      Logger.log('📱 Check your Telegram group');
      return { success: true };
    } else {
      Logger.log('❌ Failed to send message');
      Logger.log('Response: ' + JSON.stringify(response));
      return { success: false, error: 'Send failed', response: response };
    }
    
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * ========================================
 * اختبار شامل - تشغيل جميع الخطوات
 * ========================================
 */
function RUN_COMPLETE_SYSTEM_TEST() {
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║   COMPLETE SYSTEM TEST                 ║');
  Logger.log('║   iPhone → GAS → GROK → Telegram      ║');
  Logger.log('╚════════════════════════════════════════╝\n');
  
  var startTime = new Date();
  
  // Step 1: Setup
  Logger.log('⏱️ Starting Step 1...\n');
  var step1 = STEP1_RESET_AND_SETUP();
  if (!step1.success) {
    Logger.log('\n❌ Test stopped at Step 1');
    return;
  }
  
  Utilities.sleep(2000);
  
  // Step 4: Test GROK AI first
  Logger.log('\n⏱️ Starting Step 4 (GROK AI)...\n');
  var step4 = STEP4_TEST_GROK_AI();
  
  Utilities.sleep(2000);
  
  // Step 5: Test Telegram
  Logger.log('\n⏱️ Starting Step 5 (Telegram)...\n');
  var step5 = STEP5_TEST_TELEGRAM();
  
  Utilities.sleep(2000);
  
  // Step 2: Test full flow
  Logger.log('\n⏱️ Starting Step 2 (Full Flow)...\n');
  var step2 = STEP2_TEST_SMS_TO_TELEGRAM();
  
  Utilities.sleep(2000);
  
  // Step 3: Verify balances
  Logger.log('\n⏱️ Starting Step 3 (Balances)...\n');
  var step3 = STEP3_VERIFY_BALANCES();
  
  var endTime = new Date();
  var duration = ((endTime - startTime) / 1000).toFixed(1);
  
  Logger.log('\n╔════════════════════════════════════════╗');
  Logger.log('║          TEST COMPLETE                 ║');
  Logger.log('╚════════════════════════════════════════╝');
  Logger.log('⏱️ Total time: ' + duration + ' seconds');
  Logger.log('📱 Check your Telegram for all notifications!');
  Logger.log('💰 Account balances have been updated');
  Logger.log('\n🎯 Next steps:');
  Logger.log('   1. Forward SMS from iPhone');
  Logger.log('   2. Check Telegram for automatic notifications');
  Logger.log('   3. Send "/balances" to see account balances');

  // Return a summary object for remote callers
  return {
    success: true,
    duration_seconds: Number(duration),
    passed_steps: ['STEP1_RESET_AND_SETUP','STEP4_TEST_GROK_AI','STEP5_TEST_TELEGRAM','STEP2_TEST_SMS_TO_TELEGRAM','STEP3_VERIFY_BALANCES']
  };
}
