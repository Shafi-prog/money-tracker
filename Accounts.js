/**
 * Accounts.js - Complete Account Management (Shafi Jahz Almutiry)
 * Sheet operations + UI CRUD + Pattern seeding
 * Updated to support Unified Accounts Schema (10 columns)
 */

// ═══════════════════════════════════════════════════════════════════════
// SHEET SETUP & CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Ensures the Accounts sheet exists with the correct 10-column structure.
 * Schema: Name, Type, Number, Bank, Balance, LastUpdate, isMine, isInternal, Aliases, Notes
 */
function ensureAccountsSheet_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    // Format Balance
    sh.getRange('E:E').setNumberFormat('#,##0.00');
    // Format Date
    sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm');
    // Set widths
    sh.setColumnWidth(1, 150); // Name
    sh.setColumnWidth(5, 100); // Balance
    sh.setColumnWidth(9, 200); // Aliases
  }
  return sh;
}

/**
 * Loads accounts index for fast lookup
 * Returns object with { byLast: {}, byAlias: {} }
 */
function loadAccountsIndex_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('ACCOUNTS_INDEX_V2');
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  var idx = { byLast: {}, byAlias: {} };

  if (last >= 2) {
    // Read 10 columns
    var rows = sh.getRange(2, 1, last - 1, 10).getValues();
    rows.forEach(function (r) {
      // 0:Name, 1:Type, 2:Num, 3:Bank, 4:Balance, 5:LastUpdate, 6:isMine, 7:isInternal, 8:Aliases, 9:Notes
      var obj = {
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        num: String(r[2] || ''),
        bank: String(r[3] || ''),
        balance: Number(r[4] || 0),
        lastUpdate: r[5],
        isMine: String(r[6] || '').toLowerCase() === 'true',
        isInternal: String(r[7] || '').toLowerCase() === 'true',
        aliases: String(r[8] || ''),
        notes: String(r[9] || '')
      };

      // Index by Account Number (Last 4)
      if (obj.num) idx.byLast[obj.num] = obj;

      // Index by Aliases
      String(obj.aliases).split(',')
        .map(function (x) { return x.trim().toLowerCase(); })
        .filter(Boolean)
        .forEach(function (a) { idx.byAlias[a] = obj; });
    });
  }

  cache.put('ACCOUNTS_INDEX_V2', JSON.stringify(idx), 300);
  return idx;
}

function classifyAccountFromText_(text, cardLast) {
  var idx = loadAccountsIndex_();
  var t = String(text || '').toLowerCase();

  if (cardLast && idx.byLast[cardLast]) return { hit: idx.byLast[cardLast], isInternal: !!idx.byLast[cardLast].isInternal };

  var keys = Object.keys(idx.byAlias);
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) >= 0) return { hit: idx.byAlias[keys[i]], isInternal: !!idx.byAlias[keys[i]].isInternal };
  }

  return { hit: null, isInternal: false };
}

/**
 * Legacy Seeding Function (Updated to new schema)
 */
function seedAccounts_() {
  Logger.log('Deprecation Warning: Use SETUP_MY_ACCOUNTS instead.');
  return SETUP_MY_ACCOUNTS();
}

/**
 * ✅ Main Setup Function - Populates with default accounts
 */
function SETUP_MY_ACCOUNTS() {
  var sh = ensureAccountsSheet_();
  
  // Clean start if requested, but better to append if not empty or just warn
  if (sh.getLastRow() > 1) {
    Logger.log('⚠️ Accounts sheet already has data. Skipping seed.');
    return { success: true, message: 'يوجد بيانات مسبقة', skipped: true };
  }
  
  // Name, Type, Number, Bank, Balance, LastUpdate, isMine, isInternal, Aliases, Notes
  var myAccounts = [
    // 🏦 SAIB - ساب
    ['ساب - رئيسي', 'بنك', '8001', 'ساب', 0, new Date(), 'TRUE', 'FALSE', 'SAIB,البنك السعودي البريطاني,saib', 'الحساب الرئيسي'],
    ['ساب - مدى', 'بطاقة', '3474', 'ساب', 0, new Date(), 'TRUE', 'FALSE', '*3474,مدى ابل,mada', 'بطاقة الصراف'],
    
    // 🏦 الراجحي
    ['الراجحي - رئيسي', 'بنك', '9767', 'الراجحي', 0, new Date(), 'TRUE', 'FALSE', 'الراجحي,alrajhi,alrajhibank', 'حوالات'],
    ['الراجحي - بطاقة', 'بطاقة', '3449', 'الراجحي', 0, new Date(), 'TRUE', 'FALSE', '9767,X9767', 'بطاقة الراجحي'],
    ['الراجحي - فيزا', 'بطاقة', '4495', 'الراجحي', 0, new Date(), 'TRUE', 'FALSE', 'platinum,فيزا', 'بطاقة فيزا'],

    // 📱 Wallets
    ['STC Pay', 'محفظة', '', 'STC Pay', 0, new Date(), 'TRUE', 'TRUE', 'stc pay,stcpay,إس تي سي', 'محفظة رقمية'],
    ['tiqmo', 'محفظة', '3281', 'tiqmo', 0, new Date(), 'TRUE', 'TRUE', 'tiqmo,تيقمو,TGMO', 'محفظة رقمية'],
    ['urpay', 'محفظة', '', 'urpay', 0, new Date(), 'TRUE', 'TRUE', 'urpay,يوربي', 'محفظة رقمية'],

    // 💳 Credit Services
    ['Tamara', 'ائتمان', 'tamara', 'Tamara', 0, new Date(), 'TRUE', 'FALSE', 'Tamara,تمارا', 'اشتر الآن ادفع لاحقاً'],
  ];
  
  myAccounts.forEach(function(acc) {
    sh.appendRow(acc);
  });
  
  Logger.log('✅ Created ' + myAccounts.length + ' accounts.');
  CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
  
  return { success: true, accounts: myAccounts.length };
}

/**
 * Manually update a balance helper
 */
function UPDATE_ACCOUNT_BALANCE(accountNumber, newBalance) {
  if (typeof setBalance_ === 'function') {
    setBalance_(accountNumber, Number(newBalance) || 0);
    Logger.log('✅ Balance updated for ' + accountNumber + ': ' + newBalance);
    return { success: true };
  }
  return { success: false, error: 'setBalance_ not found' };
}

// ═══════════════════════════════════════════════════════════════════════
// UI CRUD FUNCTIONS (Frontend API)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get all accounts for UI
 */
function SOV1_UI_getAllAccounts_() {
  try {
    var sh = ensureAccountsSheet_();
    var last = sh.getLastRow();
    
    if (last < 2) return [];
    
    // Read 10 columns
    var rows = sh.getRange(2, 1, last - 1, 10).getValues();
    var accounts = [];
    
    rows.forEach(function(r, idx) {
      accounts.push({
        id: idx + 2, // Row number
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        number: String(r[2] || ''),
        bank: String(r[3] || ''),
        balance: Number(r[4] || 0),       // Added
        lastUpdate: r[5],                 // Added
        isMine: String(r[6] || '').toLowerCase() === 'true',
        isInternal: String(r[7] || '').toLowerCase() === 'true', // Corrected index
        aliases: String(r[8] || ''),      // Corrected index
        notes: String(r[9] || '')         // Added
      });
    });
    
    return accounts;
  } catch (e) {
    Logger.log('Error getting accounts: ' + e);
    return [];
  }
}

/**
 * Add new account from UI
 */
function SOV1_UI_addAccount_(accountData) {
  try {
    if (!accountData || !accountData.name || !accountData.type) {
      return { success: false, error: 'الاسم والنوع مطلوبان' };
    }
    
    var sh = ensureAccountsSheet_();
    
    var initialBalance = Number(accountData.balance);
    if (isNaN(initialBalance)) initialBalance = 0;

    sh.appendRow([
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || '',
      initialBalance,
      new Date(), // Last Update
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false',
      accountData.aliases || '',
      accountData.notes || ''
    ]);
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    
    return { success: true, message: 'تم إضافة الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error adding account: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update existing account from UI
 */
function SOV1_UI_updateAccount_(rowId, accountData) {
  try {
    if (!rowId || rowId < 2) return { success: false, error: 'معرف غير صالح' };
    
    var sh = ensureAccountsSheet_();
    if (rowId > sh.getLastRow()) return { success: false, error: 'الحساب غير موجود' };
    
    // Name (1), Type (2), Number (3), Bank (4)
    sh.getRange(rowId, 1, 1, 4).setValues([[
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || ''
    ]]);

    // Balance (5) + LastUpdate (6)
    if (accountData.balance !== undefined && accountData.balance !== null && accountData.balance !== '') {
      var newBalance = Number(accountData.balance);
      if (!isNaN(newBalance)) {
        sh.getRange(rowId, 5).setValue(newBalance);
        sh.getRange(rowId, 6).setValue(new Date());
      }
    }
    
    // isMine (7), isInternal (8), Aliases (9), Notes (10)
    sh.getRange(rowId, 7, 1, 4).setValues([[
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false',
      accountData.aliases || '',
      accountData.notes || ''
    ]]);
    
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    
    return { success: true, message: 'تم تحديث الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error updating account: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete account
 */
function SOV1_UI_deleteAccount_(rowId) {
  try {
    if (!rowId || rowId < 2) return { success: false, error: 'معرف غير صالح' };
    
    var sh = ensureAccountsSheet_();
    sh.deleteRow(rowId);
    
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    return { success: true, message: 'تم حذف الحساب بنجاح' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Get account info by number (last 4 digits) - Helper
 */
function getAccountByNumber_(number) {
  if (!number) return null;
  var numStr = String(number).trim();
  
  // Use the cached index for speed
  var idx = loadAccountsIndex_();
  if (idx.byLast[numStr]) return idx.byLast[numStr];
  
  return null;
}

/**
 * Determine if a transaction is internal (between user's own accounts)
 */
function isInternalTransfer_(fromAccount, toAccount) {
  var fromInfo = getAccountByNumber_(fromAccount);
  var toInfo = getAccountByNumber_(toAccount);
  
  if (!fromInfo || !toInfo) return false;
  
  return fromInfo.isMine && toInfo.isMine;
}
