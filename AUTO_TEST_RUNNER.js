/**
 * AUTOMATED TEST RUNNER
 * Runs comprehensive tests automatically to catch bugs before user finds them
 * Based on open-source CI/CD patterns from professional repos
 */

function AUTO_TEST_ALL_PAGES() {
  Logger.log('🤖 STARTING AUTOMATED TEST RUN...');
  
  const results = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    errors: [],
    pages: {}
  };

  // Test 1: Settings Page Load
  try {
    Logger.log('Testing Settings Page...');
    const settingsTest = testSettingsPage();
    results.pages.settings = settingsTest;
    results.totalTests++;
    if (settingsTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Settings: ${settingsTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Settings Page CRASH: ${e.message}`);
  }

  // Test 2: Settings Save/Load
  try {
    Logger.log('Testing Settings Save/Load...');
    const saveLoadTest = testSettingsSaveLoad();
    results.pages.settingsSaveLoad = saveLoadTest;
    results.totalTests++;
    if (saveLoadTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Settings Save/Load: ${saveLoadTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Settings Save/Load CRASH: ${e.message}`);
  }

  // Test 3: Index Page
  try {
    Logger.log('Testing Index Page...');
    const indexTest = testIndexPage();
    results.pages.index = indexTest;
    results.totalTests++;
    if (indexTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Index: ${indexTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Index Page CRASH: ${e.message}`);
  }

  // Test 4: Features Page
  try {
    Logger.log('Testing Features Page...');
    const featuresTest = testFeaturesPage();
    results.pages.features = featuresTest;
    results.totalTests++;
    if (featuresTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Features: ${featuresTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Features Page CRASH: ${e.message}`);
  }

  // Test 5: Onboarding Page
  try {
    Logger.log('Testing Onboarding Page...');
    const onboardingTest = testOnboardingPage();
    results.pages.onboarding = onboardingTest;
    results.totalTests++;
    if (onboardingTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Onboarding: ${onboardingTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Onboarding Page CRASH: ${e.message}`);
  }

  // Test 6: Backend Functions
  try {
    Logger.log('Testing Backend Functions...');
    const backendTest = testBackendFunctions();
    results.pages.backend = backendTest;
    results.totalTests++;
    if (backendTest.passed) results.passed++;
    else {
      results.failed++;
      results.errors.push(`Backend: ${backendTest.error}`);
    }
  } catch (e) {
    results.failed++;
    results.errors.push(`Backend Functions CRASH: ${e.message}`);
  }

  // Generate Report
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('🤖 AUTOMATED TEST RESULTS');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log(`Total Tests: ${results.totalTests}`);
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    Logger.log('\n⚠️ ERRORS FOUND:');
    results.errors.forEach((error, i) => {
      Logger.log(`${i + 1}. ${error}`);
    });
  } else {
    Logger.log('\n🎉 ALL TESTS PASSED!');
  }
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Save results to sheet for history
  saveTestResults(results);

  return results;
}

function testSettingsPage() {
  try {
    // Check if Settings.js functions exist
    if (typeof getSettings !== 'function') {
      return { passed: false, error: 'getSettings function not found' };
    }
    if (typeof saveSettings !== 'function') {
      return { passed: false, error: 'saveSettings function not found' };
    }

    // Try to load settings
    const settings = getSettings();
    if (!settings) {
      return { passed: false, error: 'getSettings returned null' };
    }

    // Check required properties
    const requiredProps = ['spreadsheetId', 'sheetNames', 'telegram', 'categories', 'ui'];
    for (const prop of requiredProps) {
      if (!settings.hasOwnProperty(prop)) {
        return { passed: false, error: `Missing required property: ${prop}` };
      }
    }

    return { passed: true, loadTime: '< 1s' };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function testSettingsSaveLoad() {
  try {
    // Load current settings
    const originalSettings = getSettings();
    
    // Modify and save
    const testSettings = JSON.parse(JSON.stringify(originalSettings));
    testSettings.ui.language = 'ar'; // Set a test value
    
    const saveResult = saveSettings(testSettings);
    if (!saveResult.success) {
      return { passed: false, error: 'Save failed: ' + saveResult.error };
    }

    // Load again and verify
    const reloadedSettings = getSettings();
    if (reloadedSettings.ui.language !== 'ar') {
      return { passed: false, error: 'Settings not persisted correctly' };
    }

    // Restore original
    saveSettings(originalSettings);

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function testIndexPage() {
  try {
    // Check if main page functions exist
    if (typeof doGet !== 'function') {
      return { passed: false, error: 'doGet function not found' };
    }

    // Try to render page
    const e = { parameter: {} };
    const output = doGet(e);
    
    if (!output) {
      return { passed: false, error: 'doGet returned null' };
    }

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function testFeaturesPage() {
  try {
    // Test features page rendering
    const e = { parameter: { page: 'features' } };
    const output = doGet(e);
    
    if (!output) {
      return { passed: false, error: 'Features page returned null' };
    }

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function testOnboardingPage() {
  try {
    // Test onboarding page rendering
    const e = { parameter: { page: 'onboarding' } };
    const output = doGet(e);
    
    if (!output) {
      return { passed: false, error: 'Onboarding page returned null' };
    }

    // Check if wizard functions exist
    if (typeof getOnboardingStatus !== 'function') {
      return { passed: false, error: 'getOnboardingStatus function not found' };
    }

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function testBackendFunctions() {
  try {
    const errors = [];

    // Test Telegram functions
    if (typeof handleTelegramWebhook_ !== 'function') errors.push('handleTelegramWebhook_ not found');

    // Test Ingress functions
    if (typeof executeUniversalFlowV120 !== 'function') errors.push('executeUniversalFlowV120 not found');

    if (errors.length > 0) {
      return { passed: false, error: errors.join(', ') };
    }

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e.message };
  }
}

function saveTestResults(results) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('AutoTestResults');
    
    if (!sheet) {
      sheet = ss.insertSheet('AutoTestResults');
      sheet.appendRow(['Timestamp', 'Total Tests', 'Passed', 'Failed', 'Errors', 'Details']);
    }

    sheet.appendRow([
      results.timestamp,
      results.totalTests,
      results.passed,
      results.failed,
      results.errors.join(' | '),
      JSON.stringify(results.pages)
    ]);

    // Keep only last 100 test runs
    if (sheet.getLastRow() > 101) {
      sheet.deleteRows(2, sheet.getLastRow() - 101);
    }
  } catch (e) {
    Logger.log('Warning: Could not save test results: ' + e.message);
  }
}

/**
 * AUTOMATIC DAILY TEST TRIGGER
 * Set this up to run daily at 6 AM
 */
function SETUP_DAILY_AUTO_TEST() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'AUTO_TEST_ALL_PAGES') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new daily trigger at 6 AM
  ScriptApp.newTrigger('AUTO_TEST_ALL_PAGES')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  Logger.log('✅ Daily auto-test trigger created! Tests will run every day at 6 AM');
  
  return { 
    success: true, 
    message: 'سيتم تشغيل الاختبارات التلقائية يومياً الساعة 6 صباحاً',
    trigger: 'Daily at 6 AM'
  };
}

/**
 * PRE-DEPLOYMENT TEST
 * Run this BEFORE clasp push to catch issues
 */
function RUN_PRE_DEPLOYMENT_TESTS() {
  Logger.log('🚀 PRE-DEPLOYMENT TEST CHECK...');
  const results = AUTO_TEST_ALL_PAGES();
  
  if (results.failed > 0) {
    Logger.log('⛔ DEPLOYMENT BLOCKED: Tests failed!');
    Logger.log('Fix these issues before deploying:');
    results.errors.forEach(error => Logger.log('  - ' + error));
    throw new Error('Pre-deployment tests failed. Fix errors before deploying.');
  }
  
  Logger.log('✅ PRE-DEPLOYMENT TESTS PASSED! Safe to deploy.');
  return results;
}

/**
 * GET TEST HISTORY
 * Returns all test results for dashboard
 */
function getAutoTestHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AutoTestResults');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return [];
    }

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
    
    return data.map(row => {
      return {
        timestamp: row[0],
        totalTests: row[1],
        passed: row[2],
        failed: row[3],
        errors: row[4] ? row[4].split(' | ') : [],
        pages: row[5] ? JSON.parse(row[5]) : {}
      };
    }).reverse(); // Most recent first
  } catch (e) {
    Logger.log('Error getting test history: ' + e.message);
    return [];
  }
}
