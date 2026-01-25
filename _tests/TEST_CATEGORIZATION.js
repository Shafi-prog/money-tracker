/********** SJA-V1 | TEST_CATEGORIZATION.js – AI Categorization Accuracy Test **********/

/**
 * Comprehensive test suite for SMS categorization accuracy
 * Tests AI parsing against known expected results
 * Target: 100% accuracy
 */

// Test cases with real Saudi bank SMS formats and expected results
var TEST_CASES = [
  // ===== PURCHASES (مشتريات) =====
  {
    id: 1,
    sms: 'عملية شراء بمبلغ SAR 250.75 لدى جرير للإلكترونيات بطاقة **9767 في 2026-01-24',
    expected: {
      category: 'مشتريات',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 250,
      amountMax: 251
    }
  },
  {
    id: 2,
    sms: 'تم خصم مبلغ 89.00 ريال من حسابك عبر نقاط البيع POS لدى STARBUCKS',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 89,
      amountMax: 89
    }
  },
  {
    id: 3,
    sms: 'Apple Pay: تم الدفع بمبلغ 156.50 SAR لدى NOON EXPRESS',
    expected: {
      category: 'تسوق',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 156,
      amountMax: 157
    }
  },
  {
    id: 4,
    sms: 'مدى: عملية شراء 45.00 ريال في AMAZON.SA بطاقة ****1234',
    expected: {
      category: 'تسوق',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 45,
      amountMax: 45
    }
  },
  
  // ===== TRANSFERS OUTGOING (حوالات صادرة) =====
  {
    id: 5,
    sms: 'تم تحويل مبلغ 5000.00 ريال من حسابك رقم 1234567890 إلى محمد أحمد',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amountMin: 5000,
      amountMax: 5000
    }
  },
  {
    id: 6,
    sms: 'حوالة صادرة بمبلغ 1500 SAR من حسابك إلى حساب 9876543210',
    expected: {
      category: 'حوالات صادرة',
      type: 'حوالة',
      isIncoming: false,
      amountMin: 1500,
      amountMax: 1500
    }
  },
  
  // ===== TRANSFERS INCOMING (حوالات واردة) =====
  {
    id: 7,
    sms: 'تم إيداع مبلغ 8500.00 ريال في حسابك من شركة الاتصالات السعودية - راتب',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amountMin: 8500,
      amountMax: 8500
    }
  },
  {
    id: 8,
    sms: 'حوالة واردة: تم استلام 2000.00 SAR في حسابك رقم 5555666677',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amountMin: 2000,
      amountMax: 2000
    }
  },
  {
    id: 9,
    sms: 'إضافة مبلغ 3500 ريال لحسابك - تحويل من عبدالله محمد',
    expected: {
      category: 'حوالات واردة',
      type: 'حوالة',
      isIncoming: true,
      amountMin: 3500,
      amountMax: 3500
    }
  },
  
  // ===== BILLS (فواتير) =====
  {
    id: 10,
    sms: 'سداد: تم دفع فاتورة STC بمبلغ 299.00 ريال من حسابك',
    expected: {
      category: 'فواتير',
      type: 'سداد',
      isIncoming: false,
      amountMin: 299,
      amountMax: 299
    }
  },
  {
    id: 11,
    sms: 'تم سداد فاتورة الكهرباء بمبلغ 450.50 SAR - شركة الكهرباء السعودية',
    expected: {
      category: 'فواتير',
      type: 'سداد',
      isIncoming: false,
      amountMin: 450,
      amountMax: 451
    }
  },
  {
    id: 12,
    sms: 'دفع فاتورة المياه 125.00 ريال - سداد',
    expected: {
      category: 'فواتير',
      type: 'سداد',
      isIncoming: false,
      amountMin: 125,
      amountMax: 125
    }
  },
  {
    id: 13,
    sms: 'سداد فاتورة MOBILY بمبلغ 180.00 SAR',
    expected: {
      category: 'فواتير',
      type: 'سداد',
      isIncoming: false,
      amountMin: 180,
      amountMax: 180
    }
  },
  
  // ===== TRANSPORTATION (نقل) =====
  {
    id: 14,
    sms: 'تم خصم 35.50 SAR من بطاقتك لدى UBER TRIP',
    expected: {
      category: 'نقل',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 35,
      amountMax: 36
    }
  },
  {
    id: 15,
    sms: 'عملية شراء 28.00 ريال CAREEM بطاقة ****5678',
    expected: {
      category: 'نقل',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 28,
      amountMax: 28
    }
  },
  
  // ===== FOOD (طعام) =====
  {
    id: 16,
    sms: 'POS: خصم 75.00 SAR لدى MCDONALDS بطاقة مدى',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 75,
      amountMax: 75
    }
  },
  {
    id: 17,
    sms: 'عملية شراء بمبلغ 120.00 ريال لدى HUNGERSTATION',
    expected: {
      category: 'طعام',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 120,
      amountMax: 120
    }
  },
  
  // ===== ATM WITHDRAWAL (سحب) =====
  {
    id: 18,
    sms: 'تم سحب مبلغ 1000.00 ريال من الصراف الآلي ATM',
    expected: {
      category: 'سحب نقدي',
      type: 'سحب',
      isIncoming: false,
      amountMin: 1000,
      amountMax: 1000
    }
  },
  {
    id: 19,
    sms: 'سحب نقدي 500 SAR من ATM فرع الملك فهد',
    expected: {
      category: 'سحب نقدي',
      type: 'سحب',
      isIncoming: false,
      amountMin: 500,
      amountMax: 500
    }
  },
  
  // ===== INTERNATIONAL (مشتريات خارجية) =====
  {
    id: 20,
    sms: 'International purchase: USD 50.00 at NETFLIX.COM card **9999',
    expected: {
      category: 'مشتريات خارجية',
      type: 'مشتريات',
      isIncoming: false,
      amountMin: 50,
      amountMax: 50
    }
  }
];

/**
 * Run full categorization test suite
 * Call this function from Google Apps Script
 */
function TEST_CATEGORIZATION_ACCURACY() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🧪 CATEGORIZATION ACCURACY TEST SUITE                  ║');
  Logger.log('║     Target: 100% Accuracy                                  ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var passed = 0;
  var failed = 0;
  var failures = [];
  
  for (var i = 0; i < TEST_CASES.length; i++) {
    var tc = TEST_CASES[i];
    var result = runSingleTest_(tc);
    
    if (result.passed) {
      passed++;
      Logger.log('✅ Test #' + tc.id + ' PASSED');
    } else {
      failed++;
      failures.push(result);
      Logger.log('❌ Test #' + tc.id + ' FAILED: ' + result.reason);
    }
  }
  
  var accuracy = Math.round((passed / TEST_CASES.length) * 100);
  
  Logger.log('\n' + '═'.repeat(60));
  Logger.log('📊 RESULTS SUMMARY');
  Logger.log('═'.repeat(60));
  Logger.log('Total Tests: ' + TEST_CASES.length);
  Logger.log('Passed: ' + passed + ' ✅');
  Logger.log('Failed: ' + failed + ' ❌');
  Logger.log('Accuracy: ' + accuracy + '%');
  Logger.log('═'.repeat(60));
  
  if (failures.length > 0) {
    Logger.log('\n⚠️ FAILURE DETAILS:');
    Logger.log('─'.repeat(60));
    
    for (var j = 0; j < failures.length; j++) {
      var f = failures[j];
      Logger.log('\n❌ Test #' + f.testId);
      Logger.log('   SMS: ' + f.sms.substring(0, 50) + '...');
      Logger.log('   Reason: ' + f.reason);
      Logger.log('   Expected: ' + JSON.stringify(f.expected));
      Logger.log('   Got: ' + JSON.stringify(f.actual));
    }
  }
  
  if (accuracy === 100) {
    Logger.log('\n🎉 PERFECT SCORE! All categorizations are correct!');
  } else if (accuracy >= 90) {
    Logger.log('\n👍 Good accuracy, but room for improvement.');
  } else {
    Logger.log('\n⚠️ Accuracy needs significant improvement.');
  }
  
  return {
    total: TEST_CASES.length,
    passed: passed,
    failed: failed,
    accuracy: accuracy,
    failures: failures
  };
}

/**
 * Run a single test case
 */
function runSingleTest_(tc) {
  try {
    // Call the AI hybrid function
    var ai = callAiHybridV120(tc.sms);
    
    // Apply classifier rules
    ai = applyClassifierMap_(tc.sms, ai);
    
    var reasons = [];
    
    // Check category (flexible matching)
    if (!categoryMatches_(ai.category, tc.expected.category)) {
      reasons.push('category: expected "' + tc.expected.category + '", got "' + ai.category + '"');
    }
    
    // Check type (flexible matching)
    if (tc.expected.type && !typeMatches_(ai.type, tc.expected.type)) {
      reasons.push('type: expected "' + tc.expected.type + '", got "' + ai.type + '"');
    }
    
    // Check isIncoming
    if (tc.expected.isIncoming !== undefined && ai.isIncoming !== tc.expected.isIncoming) {
      reasons.push('isIncoming: expected ' + tc.expected.isIncoming + ', got ' + ai.isIncoming);
    }
    
    // Check amount range
    var amt = Number(ai.amount) || 0;
    if (amt < tc.expected.amountMin || amt > tc.expected.amountMax) {
      reasons.push('amount: expected ' + tc.expected.amountMin + '-' + tc.expected.amountMax + ', got ' + amt);
    }
    
    if (reasons.length === 0) {
      return { passed: true, testId: tc.id };
    } else {
      return {
        passed: false,
        testId: tc.id,
        sms: tc.sms,
        reason: reasons.join('; '),
        expected: tc.expected,
        actual: {
          category: ai.category,
          type: ai.type,
          isIncoming: ai.isIncoming,
          amount: amt
        }
      };
    }
    
  } catch (e) {
    return {
      passed: false,
      testId: tc.id,
      sms: tc.sms,
      reason: 'Error: ' + e.toString(),
      expected: tc.expected,
      actual: null
    };
  }
}

/**
 * Flexible category matching
 */
function categoryMatches_(actual, expected) {
  var a = String(actual || '').toLowerCase();
  var e = String(expected || '').toLowerCase();
  
  // Exact match
  if (a === e) return true;
  
  // Partial matches
  var categoryGroups = {
    'مشتريات': ['مشتريات', 'مشتريات عامة', 'تسوق', 'شراء'],
    'تسوق': ['تسوق', 'مشتريات', 'مشتريات عامة'],
    'طعام': ['طعام', 'مطاعم', 'مشتريات'],
    'نقل': ['نقل', 'مواصلات', 'مشتريات'],
    'فواتير': ['فواتير', 'سداد', 'bills'],
    'حوالات واردة': ['حوالات واردة', 'وارد', 'إيداع', 'راتب'],
    'حوالات صادرة': ['حوالات صادرة', 'صادر', 'تحويل'],
    'سحب نقدي': ['سحب نقدي', 'سحب', 'atm', 'صراف'],
    'مشتريات خارجية': ['مشتريات خارجية', 'international', 'خارجي']
  };
  
  var group = categoryGroups[expected];
  if (group) {
    for (var i = 0; i < group.length; i++) {
      if (a.indexOf(group[i]) >= 0 || group[i].indexOf(a) >= 0) return true;
    }
  }
  
  return false;
}

/**
 * Flexible type matching
 */
function typeMatches_(actual, expected) {
  var a = String(actual || '').toLowerCase();
  var e = String(expected || '').toLowerCase();
  
  if (a === e) return true;
  
  var typeGroups = {
    'مشتريات': ['مشتريات', 'شراء', 'pos', 'purchase'],
    'حوالة': ['حوالة', 'تحويل', 'transfer'],
    'سداد': ['سداد', 'فاتورة', 'bill', 'payment'],
    'سحب': ['سحب', 'atm', 'withdrawal']
  };
  
  var group = typeGroups[expected];
  if (group) {
    for (var i = 0; i < group.length; i++) {
      if (a.indexOf(group[i]) >= 0) return true;
    }
  }
  
  return false;
}

/**
 * Quick test - run just 5 tests for fast validation
 */
function TEST_CATEGORIZATION_QUICK() {
  Logger.log('🚀 Quick Categorization Test (5 samples)\n');
  
  var quickTests = [TEST_CASES[0], TEST_CASES[4], TEST_CASES[6], TEST_CASES[9], TEST_CASES[17]];
  var passed = 0;
  
  for (var i = 0; i < quickTests.length; i++) {
    var result = runSingleTest_(quickTests[i]);
    if (result.passed) {
      passed++;
      Logger.log('✅ #' + quickTests[i].id + ' OK');
    } else {
      Logger.log('❌ #' + quickTests[i].id + ' FAIL: ' + result.reason);
    }
  }
  
  Logger.log('\nQuick Test Result: ' + passed + '/5 (' + (passed * 20) + '%)');
  return passed === 5;
}

/**
 * Test specific category
 */
function TEST_CATEGORY_PURCHASES() {
  Logger.log('🛒 Testing Purchase Categorization\n');
  var purchaseTests = TEST_CASES.filter(function(tc) {
    return tc.expected.type === 'مشتريات';
  });
  return runTestSubset_(purchaseTests, 'Purchases');
}

function TEST_CATEGORY_TRANSFERS() {
  Logger.log('💸 Testing Transfer Categorization\n');
  var transferTests = TEST_CASES.filter(function(tc) {
    return tc.expected.type === 'حوالة';
  });
  return runTestSubset_(transferTests, 'Transfers');
}

function TEST_CATEGORY_BILLS() {
  Logger.log('📄 Testing Bills Categorization\n');
  var billTests = TEST_CASES.filter(function(tc) {
    return tc.expected.type === 'سداد';
  });
  return runTestSubset_(billTests, 'Bills');
}

function runTestSubset_(tests, name) {
  var passed = 0;
  for (var i = 0; i < tests.length; i++) {
    var result = runSingleTest_(tests[i]);
    if (result.passed) {
      passed++;
      Logger.log('✅ #' + tests[i].id);
    } else {
      Logger.log('❌ #' + tests[i].id + ': ' + result.reason);
    }
  }
  var accuracy = Math.round((passed / tests.length) * 100);
  Logger.log('\n' + name + ' Accuracy: ' + passed + '/' + tests.length + ' (' + accuracy + '%)');
  return accuracy === 100;
}

/**
 * Add custom test case (for debugging)
 */
function TEST_CUSTOM_SMS(smsText) {
  Logger.log('🔍 Testing Custom SMS\n');
  Logger.log('Input: ' + smsText + '\n');
  
  var ai = callAiHybridV120(smsText);
  Logger.log('AI Raw Result:');
  Logger.log(JSON.stringify(ai, null, 2));
  
  ai = applyClassifierMap_(smsText, ai);
  Logger.log('\nAfter Classifier:');
  Logger.log(JSON.stringify(ai, null, 2));
  
  return ai;
}

/**
 * List all test cases
 */
function LIST_TEST_CASES() {
  Logger.log('📋 All Test Cases:\n');
  for (var i = 0; i < TEST_CASES.length; i++) {
    var tc = TEST_CASES[i];
    Logger.log('#' + tc.id + ' [' + tc.expected.category + '] ' + tc.sms.substring(0, 40) + '...');
  }
  Logger.log('\nTotal: ' + TEST_CASES.length + ' test cases');
}
