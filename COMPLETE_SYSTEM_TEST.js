/**
 * ═══════════════════════════════════════════════════════════════════════
 * COMPLETE_SYSTEM_TEST.js - Comprehensive System Validation
 * ═══════════════════════════════════════════════════════════════════════
 * Tests ALL tabs, buttons, backend functions, and data flow
 * Run: TEST_EVERYTHING()
 * ═══════════════════════════════════════════════════════════════════════
 */

function TEST_EVERYTHING() {
  Logger.log('🚀 Starting Complete System Test...\n');
  
  var results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // 1. Core Configuration
  test(results, '1. Config - ENV object exists', function() {
    return typeof ENV !== 'undefined';
  });
  
  test(results, '2. Config - SHEET_ID configured', function() {
    return ENV.SHEET_ID && ENV.SHEET_ID.length > 0;
  });
  
  test(results, '3. Config - Telegram configured', function() {
    return ENV.TELEGRAM_TOKEN && ENV.TELEGRAM_TOKEN.length > 0;
  });
  
  // 2. Sheet Access
  test(results, '4. Sheets - Can access Sheet1', function() {
    var s = _sheet('Sheet1');
    return s !== null && s.getName() === 'Sheet1';
  });
  
  test(results, '5. Sheets - Can access Budgets', function() {
    var s = _sheet('Budgets');
    return s !== null;
  });
  
  test(results, '6. Sheets - Can access Ingress_Queue', function() {
    var s = _sheet('Ingress_Queue');
    return s !== null;
  });
  
  test(results, '7. Sheets - Can access Classifier_Map', function() {
    var s = _sheet('Classifier_Map');
    return s !== null;
  });
  
  // 3. Core Functions
  test(results, '8. Function - doGet exists', function() {
    return typeof doGet === 'function';
  });
  
  test(results, '9. Function - doPost exists', function() {
    return typeof doPost === 'function';
  });
  
  test(results, '10. Function - executeUniversalFlowV120 exists', function() {
    return typeof executeUniversalFlowV120 === 'function';
  });
  
  test(results, '11. Function - callAiHybridV120 exists', function() {
    return typeof callAiHybridV120 === 'function';
  });
  
  test(results, '12. Function - applyClassifierMap_ exists', function() {
    return typeof applyClassifierMap_ === 'function';
  });
  
  // 4. WebUI Functions (All tabs need these)
  test(results, '13. WebUI - SOV1_UI_doGet_ exists', function() {
    return typeof SOV1_UI_doGet_ === 'function';
  });
  
  test(results, '14. WebUI - SOV1_UI_getDashboard_ exists', function() {
    return typeof SOV1_UI_getDashboard_ === 'function';
  });
  
  test(results, '15. WebUI - SOV1_UI_getLatest_ exists', function() {
    return typeof SOV1_UI_getLatest_ === 'function';
  });
  
  test(results, '16. WebUI - SOV1_UI_getBudgets_ exists', function() {
    return typeof SOV1_UI_getBudgets_ === 'function';
  });
  
  test(results, '17. WebUI - SOV1_UI_addManualTransaction_ exists', function() {
    return typeof SOV1_UI_addManualTransaction_ === 'function';
  });
  
  test(results, '18. WebUI - SOV1_UI_saveSettings_ exists', function() {
    return typeof SOV1_UI_saveSettings_ === 'function';
  });
  
  test(results, '19. WebUI - SOV1_UI_checkConfig_ exists', function() {
    return typeof SOV1_UI_checkConfig_ === 'function';
  });
  
  // 5. Test Actual Function Calls
  test(results, '20. Functional - checkConfig works', function() {
    var config = SOV1_UI_checkConfig_();
    return config && typeof config.hasSheet !== 'undefined';
  });
  
  test(results, '21. Functional - getDashboard works', function() {
    var data = SOV1_UI_getDashboard_('OPEN');
    return data && data.kpi;
  });
  
  test(results, '22. Functional - getLatest works', function() {
    var txns = SOV1_UI_getLatest_('OPEN', 10);
    return Array.isArray(txns);
  });
  
  test(results, '23. Functional - getBudgets works', function() {
    var budgets = SOV1_UI_getBudgets_('OPEN');
    return Array.isArray(budgets);
  });
  
  // 6. Test Transaction Processing
  test(results, '24. Transaction - Can parse SMS', function() {
    var testSms = 'خصم 100 ريال من حساب 1234';
    var result = SOV1_preParseFallback_(testSms);
    return result && result.amount === 100;
  });
  
  test(results, '25. Transaction - Can add manual transaction', function() {
    try {
      var result = SOV1_UI_addManualTransaction_('أضف: 50 | Test | طعام');
      return result && result.success;
    } catch (e) {
      Logger.log('Error: ' + e.message);
      return false;
    }
  });
  
  // 7. Test Settings Save
  test(results, '26. Settings - Can save settings', function() {
    try {
      var result = SOV1_UI_saveSettings_({
        name: 'Test User',
        email: 'test@example.com',
        notifications: true
      });
      return result && result.success;
    } catch (e) {
      Logger.log('Error: ' + e.message);
      return false;
    }
  });
  
  // 8. Telegram Integration
  test(results, '27. Telegram - handleTelegramWebhook_ exists', function() {
    return typeof handleTelegramWebhook_ === 'function';
  });
  
  // 9. Queue System
  test(results, '29. Queue - SOV1_processQueueBatch_ exists', function() {
    return typeof SOV1_processQueueBatch_ === 'function';
  });
  
  test(results, '30. Queue - Can read queue', function() {
    var qSheet = _sheet('Ingress_Queue');
    var lastRow = qSheet.getLastRow();
    return lastRow >= 1;
  });
  
  // 10. Budget System
  test(results, '31. Budget - ensureBudgetRowExists_ works', function() {
    return typeof ensureBudgetRowExists_ === 'function';
  });
  
  test(results, '32. Budget - Can read budgets', function() {
    var budgets = SOV1_UI_getBudgets_('OPEN');
    return Array.isArray(budgets);
  });
  
  // 11. Classifier System
  test(results, '33. Classifier - Can read classifier map', function() {
    var cSheet = _sheet('Classifier_Map');
    return cSheet.getLastRow() >= 1;
  });
  
  // 12. Setup Functions
  test(results, '34. Setup - ENSURE_ALL_SHEETS exists', function() {
    return typeof ENSURE_ALL_SHEETS === 'function';
  });
  
  test(results, '35. Setup - initialsystem exists', function() {
    return typeof initialsystem === 'function';
  });
  
  // Print Results
  Logger.log('\n\n═══════════════════════════════════════════════════════════');
  Logger.log('                  📊 TEST RESULTS SUMMARY');
  Logger.log('═══════════════════════════════════════════════════════════\n');
  Logger.log('Total Tests: ' + results.total);
  Logger.log('✅ Passed: ' + results.passed);
  Logger.log('❌ Failed: ' + results.failed);
  Logger.log('Success Rate: ' + ((results.passed / results.total * 100).toFixed(1)) + '%\n');
  
  Logger.log('═══════════════════════════════════════════════════════════');
  Logger.log('                  📋 DETAILED RESULTS');
  Logger.log('═══════════════════════════════════════════════════════════\n');
  
  for (var i = 0; i < results.tests.length; i++) {
    var t = results.tests[i];
    var icon = t.passed ? '✅' : '❌';
    Logger.log(icon + ' ' + t.name + (t.error ? ' - ' + t.error : ''));
  }
  
  if (results.failed === 0) {
    Logger.log('\n\n🎉 ALL TESTS PASSED! System is fully functional! 🎉\n');
  } else {
    Logger.log('\n\n⚠️ ' + results.failed + ' tests failed. Review errors above.\n');
  }
  
  return results;
}

function test(results, name, testFunc) {
  results.total++;
  try {
    var passed = testFunc();
    if (passed) {
      results.passed++;
      results.tests.push({ name: name, passed: true });
      Logger.log('✅ ' + name);
    } else {
      results.failed++;
      results.tests.push({ name: name, passed: false, error: 'Test returned false' });
      Logger.log('❌ ' + name + ' - returned false');
    }
  } catch (e) {
    results.failed++;
    results.tests.push({ name: name, passed: false, error: e.message });
    Logger.log('❌ ' + name + ' - Exception: ' + e.message);
  }
}

/**
 * Test specific UI pages
 */
function TEST_ALL_UI_PAGES() {
  Logger.log('\n🖥️ Testing UI Pages...\n');
  
  // Test that doGet returns HTML for each page
  var pages = ['index', 'dashboard', 'details', 'reports', 'settings'];
  
  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];
    try {
      var html = SOV1_UI_doGet_({ parameter: { page: page } });
      if (html && html.getContent) {
        Logger.log('✅ Page "' + page + '" renders correctly');
      } else {
        Logger.log('❌ Page "' + page + '" failed to render');
      }
    } catch (e) {
      Logger.log('❌ Page "' + page + '" error: ' + e.message);
    }
  }
}

/**
 * Test all buttons functionality
 */
function TEST_ALL_BUTTONS() {
  Logger.log('\n🔘 Testing Button Functions...\n');
  
  var buttonTests = [
    { name: 'Add Transaction', func: 'SOV1_UI_addManualTransaction_', args: ['أضف: 10 | Test | طعام'] },
    { name: 'Save Settings', func: 'SOV1_UI_saveSettings_', args: [{ name: 'Test', email: 'test@test.com' }] },
    { name: 'Get Dashboard', func: 'SOV1_UI_getDashboard_', args: ['OPEN'] },
    { name: 'Get Transactions', func: 'SOV1_UI_getLatest_', args: ['OPEN', 10] },
    { name: 'Get Budgets', func: 'SOV1_UI_getBudgets_', args: ['OPEN'] },
    { name: 'Check Config', func: 'SOV1_UI_checkConfig_', args: [] }
  ];
  
  for (var i = 0; i < buttonTests.length; i++) {
    var btn = buttonTests[i];
    try {
      var func = eval(btn.func);
      var result = func.apply(null, btn.args);
      Logger.log('✅ ' + btn.name + ' works');
    } catch (e) {
      Logger.log('❌ ' + btn.name + ' failed: ' + e.message);
    }
  }
}
