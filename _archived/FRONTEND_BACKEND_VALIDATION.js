/**
 * COMPREHENSIVE FRONTEND & BACKEND VALIDATION
 * Run this in Google Apps Script to validate all backend functions
 */

function RUN_COMPREHENSIVE_VALIDATION() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };
  
  function test(name, fn) {
    try {
      fn();
      results.tests.push({ name, status: 'PASS' });
      results.passed++;
      Logger.log(`✅ ${name}`);
    } catch (e) {
      results.tests.push({ name, status: 'FAIL', error: e.message });
      results.failed++;
      Logger.log(`❌ ${name}: ${e.message}`);
    }
  }
  
  Logger.log('=== BACKEND FUNCTION VALIDATION ===\n');
  
  // Test all public API wrappers
  test('SOV1_UI_getSettings', () => {
    if (typeof SOV1_UI_getSettings !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getSettings();
    if (!result) throw new Error('Returned null');
  });
  
  test('SOV1_UI_getDashboard', () => {
    if (typeof SOV1_UI_getDashboard !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getDashboard('OPEN');
    if (!result || !result.kpi) throw new Error('Invalid structure');
  });
  
  test('SOV1_UI_getLatest', () => {
    if (typeof SOV1_UI_getLatest !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getLatest('OPEN', 10);
    if (!Array.isArray(result)) throw new Error(`Expected array, got ${typeof result}`);
  });
  
  test('SOV1_UI_getBudgets', () => {
    if (typeof SOV1_UI_getBudgets !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getBudgets('OPEN');
    if (!Array.isArray(result)) throw new Error(`Expected array, got ${typeof result}`);
  });
  
  test('SOV1_UI_getAccounts', () => {
    if (typeof SOV1_UI_getAccounts !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getAccounts();
    if (!Array.isArray(result)) throw new Error(`Expected array, got ${typeof result}`);
  });
  
  test('SOV1_UI_checkConfig', () => {
    if (typeof SOV1_UI_checkConfig !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_checkConfig();
    if (!result || typeof result.hasSheet === 'undefined') throw new Error('Invalid structure');
  });
  
  test('SOV1_UI_getReportData', () => {
    if (typeof SOV1_UI_getReportData !== 'function') throw new Error('Function not defined');
    const result = SOV1_UI_getReportData('OPEN', 'monthly');
    if (!result) throw new Error('Returned null');
  });
  
  // Test Settings module
  test('Settings.getSettings', () => {
    if (typeof getSettings !== 'function') throw new Error('Function not defined');
    const result = getSettings();
    if (!result || !result.settings) throw new Error('Invalid structure');
  });
  
  // Test sheet access
  test('Sheet1 exists', () => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    if (!sheet) throw new Error('Sheet1 not found');
  });
  
  test('Config sheet exists', () => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
    if (!sheet) throw new Error('Config sheet not found');
  });
  
  test('Budgets sheet exists', () => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Budgets');
    if (!sheet) throw new Error('Budgets sheet not found');
  });
  
  Logger.log(`\n=== VALIDATION COMPLETE ===`);
  Logger.log(`✅ Passed: ${results.passed}`);
  Logger.log(`❌ Failed: ${results.failed}`);
  
  return results;
}
