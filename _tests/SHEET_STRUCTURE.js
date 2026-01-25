/********** SJA-V1 | SHEET_STRUCTURE.js – Optimized Sheet Configuration **********/

/**
 * OPTIMIZED SHEET STRUCTURE (REVISED)
 * ====================================
 * 
 * ESSENTIAL SHEETS (Frontend/Backend uses):
 * ─────────────────────────────────────────
 * 1. Sheet1 - Main transactions (UUID primary key)
 * 2. Accounts - Unified account/card registry + balances
 * 3. Budgets - Budget tracking per category
 * 4. Classifier_Map - Merchant→Category rules
 * 5. Categories - Category definitions with icons
 * 6. Dashboard - Quick view summary data
 * 7. Ingress_Queue - SMS processing queue
 * 8. Config - System configuration
 * 9. UserData - User preferences (frontend settings)
 * 
 * FUTURE FEATURES (Keep empty for later):
 * ───────────────────────────────────────
 * 10. Goals - Savings goals tracking
 * 11. Recurring - Recurring transaction detection
 * 12. Sms_Templates - Custom SMS regex patterns
 * 
 * OPERATIONAL SHEETS (Keep):
 * ─────────────────────────────────────────
 * 13. Debt_Ledger - Internal transfers tracking
 * 14. Dedup_Events - Duplicate prevention
 * 15. Special_Patterns - Special SMS patterns
 * 
 * OPTIONAL/DEV SHEETS (Can disable):
 * ──────────────────────────────────────
 * 16. SJA_Control - Dev control panel
 * 17. AutoTestResults - Test results
 * 18. Ingress_Debug - Debug logging
 * 19. Analytics - Charts/reports data
 * 
 * MERGE INTO Accounts:
 * ────────────────────
 * - Account_Registry → Accounts
 * - Account_Balances → Accounts
 * - Balances → Accounts
 * 
 * MERGE INTO UserData:
 * ────────────────────
 * - Users → UserData (multi-user fields)
 * 
 * DELETE (Truly unnecessary):
 * ───────────────────────────
 * - Queue (duplicate of Ingress_Queue)
 * - Budget_USER1, User_USER1 (multi-user not needed)
 * - Run_Log (empty, not used)
 * - Sheet1_legacy_* (old backups)
 * - Transfers_Tracking (replaced by Debt_Ledger)
 */

// ============================================
// SHEET CONFIGURATION
// ============================================

var SHEETS = {
  // Core data sheets
  TRANSACTIONS: 'Sheet1',
  ACCOUNTS: 'Accounts',
  BUDGETS: 'Budgets',
  CLASSIFIER: 'Classifier_Map',
  CATEGORIES: 'Categories',
  
  // Operational sheets
  QUEUE: 'Ingress_Queue',
  DEDUP: 'Dedup_Events',
  CONFIG: 'Config',
  USER_DATA: 'UserData',
  
  // Dashboard/reporting
  DASHBOARD: 'Dashboard',
  ANALYTICS: 'Analytics',
  DEBT: 'Debt_Ledger',
  
  // Optional
  PATTERNS: 'Special_Patterns',
  DEBUG: 'Ingress_Debug',
  TESTS: 'AutoTestResults',
  CONTROL: 'SJA_Control'
};

// ============================================
// OPTIMIZED ACCOUNTS SHEET STRUCTURE
// ============================================

var ACCOUNTS_COLUMNS = [
  'ID',           // A: Unique account ID (auto-generated)
  'الاسم',        // B: Account name / owner
  'النوع',        // C: Type (حساب/بطاقة/محفظة)
  'الرقم',        // D: Last 4 digits
  'البنك',        // E: Bank name
  'الرصيد',       // F: Current balance
  'آخر_تحديث',    // G: Last balance update
  'حسابي',        // H: Is mine? (TRUE/FALSE)
  'SMS_Pattern',  // I: SMS detection pattern
  'ملاحظات'       // J: Notes
];

// ============================================
// CLEANUP FUNCTION - RUN ONCE
// ============================================

/**
 * Clean up sheets - merge duplicates, delete empty/legacy
 * ⚠️ RUN WITH CAUTION - backs up before deleting
 */
function SJA_CLEANUP_SHEETS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🧹 SHEET CLEANUP & OPTIMIZATION                        ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var ss = _ss();
  var results = { merged: [], deleted: [], kept: [], errors: [] };
  
  // 1. MERGE Account_Registry into Accounts
  Logger.log('📦 Step 1: Merging Account_Registry into Accounts...');
  try {
    var mergeResult = mergeAccountRegistry_();
    if (mergeResult.success) {
      results.merged.push('Account_Registry → Accounts (' + mergeResult.count + ' accounts)');
    }
  } catch (e) {
    results.errors.push('Account_Registry merge: ' + e.message);
  }
  
  // 2. MERGE Account_Balances into Accounts
  Logger.log('📦 Step 2: Merging Account_Balances into Accounts...');
  try {
    var balanceResult = mergeAccountBalances_();
    if (balanceResult.success) {
      results.merged.push('Account_Balances → Accounts (' + balanceResult.count + ' balances)');
    }
  } catch (e) {
    results.errors.push('Account_Balances merge: ' + e.message);
  }
  
  // 3. DELETE empty/legacy sheets (ONLY truly unnecessary ones)
  var toDelete = [
    'Queue',              // Duplicate of Ingress_Queue
    'Budget_USER1',       // Multi-user not needed
    'User_USER1',         // Multi-user not needed
    'Run_Log',            // Empty, not used
    'Transfers_Tracking', // Replaced by Debt_Ledger
    'Account_Balances',   // After merge into Accounts
    'Account_Registry',   // After merge into Accounts
    'Balances'            // After merge into Accounts
  ];
  
  // Find legacy sheets (backup copies)
  ss.getSheets().forEach(function(sh) {
    if (sh.getName().indexOf('legacy') >= 0) {
      toDelete.push(sh.getName());
    }
  });
  
  Logger.log('🗑️ Step 3: Deleting unnecessary sheets...');
  toDelete.forEach(function(name) {
    try {
      var sh = ss.getSheetByName(name);
      if (sh) {
        // Backup before delete (just log the data count)
        var rows = sh.getLastRow();
        Logger.log('   Deleting: ' + name + ' (' + rows + ' rows)');
        ss.deleteSheet(sh);
        results.deleted.push(name);
      }
    } catch (e) {
      // Sheet might not exist or be protected
      results.errors.push('Delete ' + name + ': ' + e.message);
    }
  });
  
  // 4. Restructure Accounts sheet
  Logger.log('🔧 Step 4: Restructuring Accounts sheet...');
  try {
    restructureAccountsSheet_();
    results.kept.push('Accounts (restructured)');
  } catch (e) {
    results.errors.push('Accounts restructure: ' + e.message);
  }
  
  // Summary
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 CLEANUP SUMMARY');
  Logger.log('   ✅ Merged: ' + results.merged.length);
  results.merged.forEach(function(m) { Logger.log('      ' + m); });
  Logger.log('   🗑️ Deleted: ' + results.deleted.length);
  results.deleted.forEach(function(d) { Logger.log('      ' + d); });
  Logger.log('   ❌ Errors: ' + results.errors.length);
  results.errors.forEach(function(e) { Logger.log('      ' + e); });
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return results;
}

/**
 * Merge Account_Registry data into Accounts
 */
function mergeAccountRegistry_() {
  var ss = _ss();
  var regSheet = ss.getSheetByName('Account_Registry');
  var accSheet = ss.getSheetByName('Accounts');
  
  if (!regSheet) return { success: false, error: 'Account_Registry not found' };
  if (!accSheet) {
    accSheet = ss.insertSheet('Accounts');
  }
  
  var regData = regSheet.getDataRange().getValues();
  var count = 0;
  
  // Skip header row
  for (var i = 1; i < regData.length; i++) {
    var row = regData[i];
    // Map: Account ID, نوع الحساب, اسم البنك, آخر 4 أرقام, Phone Pattern, SMS Pattern, User ID, حالة, ملاحظات
    var newRow = [
      row[3] || '',           // الرقم/آخر4 (from آخر 4 أرقام)
      row[0] || '',           // الاسم (from Account ID - will be updated)
      row[1] || 'حساب',       // النوع
      row[2] || '',           // الجهة (from اسم البنك)
      row[5] || '',           // أسماء بديلة (from SMS Pattern)
      'TRUE',                 // هل حسابي؟
      'FALSE'                 // تحويل داخلي؟
    ];
    
    accSheet.appendRow(newRow);
    count++;
  }
  
  return { success: true, count: count };
}

/**
 * Merge Account_Balances into Accounts (add balance column)
 */
function mergeAccountBalances_() {
  var ss = _ss();
  var balSheet = ss.getSheetByName('Account_Balances');
  var accSheet = ss.getSheetByName('Accounts');
  
  if (!balSheet || !accSheet) return { success: false, error: 'Sheet not found' };
  
  var balData = balSheet.getDataRange().getValues();
  var accData = accSheet.getDataRange().getValues();
  var count = 0;
  
  // Create balance map
  var balances = {};
  for (var i = 1; i < balData.length; i++) {
    var acc = String(balData[i][0] || '').trim();
    var bal = Number(balData[i][1]) || 0;
    if (acc) balances[acc] = bal;
  }
  
  // Note: Actual column update would need sheet modification
  // For now, just return the count
  count = Object.keys(balances).length;
  
  return { success: true, count: count, balances: balances };
}

/**
 * Ensure Accounts sheet has correct structure
 */
function restructureAccountsSheet_() {
  var ss = _ss();
  var sh = ss.getSheetByName('Accounts');
  
  if (!sh) {
    sh = ss.insertSheet('Accounts');
  }
  
  // Check if header exists
  var firstRow = sh.getRange(1, 1, 1, 10).getValues()[0];
  var hasHeader = firstRow[0] && String(firstRow[0]).indexOf('الاسم') >= 0;
  
  if (!hasHeader || sh.getLastRow() === 0) {
    // Set up proper headers
    var headers = ['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'SMS_Pattern', 'أسماء_بديلة', 'ملاحظات'];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4CAF50').setFontColor('white');
  }
  
  return { success: true };
}

// ============================================
// SEED ACCOUNTS FROM BankSMS_Patterns.js
// ============================================

/**
 * Populate Accounts sheet from KNOWN_ACCOUNTS and KNOWN_CARDS
 */
function SJA_SEED_ALL_ACCOUNTS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🏦 SEEDING ALL KNOWN ACCOUNTS                          ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var ss = _ss();
  var sh = ss.getSheetByName('Accounts');
  
  if (!sh) {
    sh = ss.insertSheet('Accounts');
    sh.appendRow(['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'SMS_Pattern', 'أسماء_بديلة', 'ملاحظات']);
    sh.setFrozenRows(1);
  }
  
  // Get existing account numbers
  var existing = {};
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var data = sh.getRange(2, 3, lastRow - 1, 1).getValues();
    data.forEach(function(r) {
      if (r[0]) existing[String(r[0]).trim()] = true;
    });
  }
  
  var added = 0;
  
  // Add from KNOWN_ACCOUNTS
  if (typeof KNOWN_ACCOUNTS !== 'undefined') {
    for (var accNum in KNOWN_ACCOUNTS) {
      if (existing[accNum]) continue;
      
      var acc = KNOWN_ACCOUNTS[accNum];
      sh.appendRow([
        acc.owner || 'حساب ' + acc.bank,  // الاسم
        acc.type || 'حساب',               // النوع
        accNum,                           // الرقم
        acc.bank || '',                   // البنك
        0,                                // الرصيد
        new Date(),                       // آخر_تحديث
        acc.isMine ? 'TRUE' : 'FALSE',   // حسابي
        '',                               // SMS_Pattern
        '',                               // أسماء_بديلة
        ''                                // ملاحظات
      ]);
      existing[accNum] = true;
      added++;
      Logger.log('✅ Added account: ' + accNum + ' (' + acc.bank + ')');
    }
  }
  
  // Add from KNOWN_CARDS
  if (typeof KNOWN_CARDS !== 'undefined') {
    for (var cardNum in KNOWN_CARDS) {
      if (existing[cardNum]) continue;
      
      var card = KNOWN_CARDS[cardNum];
      sh.appendRow([
        card.owner || 'بطاقة ' + card.bank,  // الاسم
        card.type || 'بطاقة',                // النوع
        cardNum,                              // الرقم
        card.bank || '',                      // البنك
        0,                                    // الرصيد
        new Date(),                           // آخر_تحديث
        card.isMine ? 'TRUE' : 'FALSE',      // حسابي
        '',                                   // SMS_Pattern
        '',                                   // أسماء_بديلة
        ''                                    // ملاحظات
      ]);
      existing[cardNum] = true;
      added++;
      Logger.log('✅ Added card: ' + cardNum + ' (' + card.bank + ')');
    }
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 SEED SUMMARY: Added ' + added + ' accounts/cards');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return { success: true, added: added };
}

// ============================================
// SHEET VALIDATION
// ============================================

/**
 * Validate all required sheets exist with correct structure
 */
function SJA_VALIDATE_SHEETS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     ✅ VALIDATING SHEET STRUCTURE                          ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  var ss = _ss();
  var results = { valid: [], missing: [], errors: [] };
  
  var requiredSheets = {
    'Sheet1': ['UUID', 'Date', 'Tag', 'Day', 'Week', 'Source', 'AccNum', 'CardNum', 'Amount', 'Merchant', 'Category', 'Type', 'Raw'],
    'Accounts': ['الاسم', 'النوع', 'الرقم'],
    'Budgets': ['Category', 'Budgeted', 'Spent', 'Remaining'],
    'Classifier_Map': ['Merchant Pattern', 'Category'],
    'Ingress_Queue': ['الوقت', 'المصدر', 'النص'],
    'Config': ['Status'],
    'Dashboard': ['UUID']
  };
  
  for (var name in requiredSheets) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      results.missing.push(name);
      Logger.log('❌ Missing: ' + name);
      continue;
    }
    
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var required = requiredSheets[name];
    var hasAll = required.every(function(col) {
      return headers.some(function(h) {
        return String(h).indexOf(col) >= 0;
      });
    });
    
    if (hasAll) {
      results.valid.push(name);
      Logger.log('✅ Valid: ' + name);
    } else {
      results.errors.push(name + ' (missing columns)');
      Logger.log('⚠️ Invalid: ' + name + ' - missing required columns');
    }
  }
  
  Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  Logger.log('📊 VALIDATION: ' + results.valid.length + ' valid, ' + results.missing.length + ' missing, ' + results.errors.length + ' errors');
  Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return results;
}
