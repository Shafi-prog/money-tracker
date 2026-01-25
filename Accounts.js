/**
 * Accounts.js - Complete Account Management (Shafi Jahz Almutiry)
 * Sheet operations + UI CRUD + Pattern seeding
 */

// ═══════════════════════════════════════════════════════════════════════
// SHEET SETUP & CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function ensureAccountsSheet_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }
  return sh;
}

function loadAccountsIndex_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('ACCOUNTS_INDEX');
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  var idx = { byLast: {}, byAlias: {} };

  if (last >= 2) {
    var rows = sh.getRange(2, 1, last - 1, 7).getValues();
    rows.forEach(function (r) {
      var obj = {
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        num: String(r[2] || ''),
        org: String(r[3] || ''),
        isMine: String(r[5] || '').toLowerCase() === 'true',
        isInternal: String(r[6] || '').toLowerCase() === 'true'
      };

      if (obj.num) idx.byLast[obj.num] = obj;

      String(r[4] || '').split(',')
        .map(function (x) { return x.trim().toLowerCase(); })
        .filter(Boolean)
        .forEach(function (a) { idx.byAlias[a] = obj; });
    });
  }

  cache.put('ACCOUNTS_INDEX', JSON.stringify(idx), 300);
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

function seedAccounts_() {
  var sh = ensureAccountsSheet_();
  
  // ✅ تعديل هذه البيانات لحساباتك الفعلية
  // ['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']
  var rows = [
    // === حساباتك الأساسية ===
    ['الراجحي - رئيسي', 'بنك', '9767', 'الراجحي', 'الراجحي,alrajhi,alrajhibank', 'TRUE', 'FALSE'],
    ['الراجحي - بطاقة', 'بطاقة', '3449', 'الراجحي', 'mada,مدى', 'TRUE', 'FALSE'],
    
    // === المحافظ الرقمية ===
    ['STC Pay', 'محفظة', '', 'STC Pay', 'stc pay,stcpay,إس تي سي', 'TRUE', 'TRUE'],
    ['tiqmo', 'محفظة', '', 'tiqmo', 'tiqmo,تيقمو', 'TRUE', 'TRUE'],
    ['urpay', 'محفظة', '', 'urpay', 'urpay,يوربي', 'TRUE', 'TRUE'],
    
    // === أشخاص يتعاملون معك (للديون) ===
    // أضف الأشخاص الذين تحول لهم أو يحولون لك بشكل متكرر
    // ['اسم الشخص', 'شخص', 'رقم حسابه', 'البنك', 'أسماء بديلة', 'FALSE', 'FALSE']
  ];
  
  // التحقق من عدم وجود تكرار
  var existingNumbers = {};
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var existing = sh.getRange(2, 3, lastRow - 1, 1).getValues();
    existing.forEach(function(r) {
      if (r[0]) existingNumbers[String(r[0]).trim()] = true;
    });
  }
  
  var added = 0;
  rows.forEach(function(row) {
    var num = row[2];
    if (num && existingNumbers[num]) return; // تجاوز المكرر
    sh.appendRow(row);
    added++;
  });
  
  safeNotify('✅ تم إضافة ' + added + ' حساب. عدّلها من Google Sheets.');
}

/**
 * ✅ إضافة حساباتك الفعلية - شغّل هذه الدالة مرة واحدة
 * ثم عدّل الأرصدة يدوياً في Google Sheets
 */
function SETUP_MY_ACCOUNTS() {
  var sh = ensureAccountsSheet_();
  
  // التحقق من عدم وجود بيانات مسبقة
  if (sh.getLastRow() > 1) {
    Logger.log('⚠️ يوجد بيانات مسبقة. لإعادة الإعداد، احذف الصفوف يدوياً أولاً.');
    return { success: false, error: 'يوجد بيانات مسبقة' };
  }
  
  // إعداد Headers
  sh.getRange(1, 1, 1, 10).setValues([[
    'الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'SMS_Pattern', 'أسماء_بديلة', 'ملاحظات'
  ]]);
  sh.setFrozenRows(1);
  sh.setRightToLeft(true);
  
  // === حساباتك الفعلية من Banks SMS.txt ===
  var myAccounts = [
    // 🏦 SAIB - ساب
    ['ساب - رئيسي', 'بنك', '8001', 'ساب', 0, new Date(), 'TRUE', 'saib|ساب', 'SAIB,البنك السعودي البريطاني', 'الحساب الرئيسي'],
    ['ساب - مدى', 'بطاقة', '3474', 'ساب', 0, new Date(), 'TRUE', 'مدى|mada|X3474', '*3474,مدى ابل', 'بطاقة الصراف'],
    
    // 🏦 الراجحي
    ['الراجحي', 'بنك', '9767', 'الراجحي', 0, new Date(), 'TRUE', 'alrajhi|الراجحي|مصرف الراجحي', 'AlrajhiBank', 'حوالات'],
    
    // 📱 tiqmo
    ['tiqmo', 'محفظة', 'tiqmo', 'tiqmo', 0, new Date(), 'TRUE', 'tiqmo', 'تيقمو', 'محفظة رقمية'],
    
    // 💳 Tamara - تمارا (اشتر الآن وادفع لاحقاً)
    ['Tamara', 'ائتمان', 'tamara', 'Tamara', 0, new Date(), 'TRUE', 'tamara|تمارا', 'Tamara,تمارا', 'اشتر الآن ادفع لاحقاً'],
  ];
  
  // إضافة الحسابات
  myAccounts.forEach(function(acc) {
    sh.appendRow(acc);
  });
  
  // تنسيق الأعمدة
  sh.getRange('E:E').setNumberFormat('#,##0.00');
  sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm');
  sh.setColumnWidth(1, 150); // الاسم
  sh.setColumnWidth(5, 100); // الرصيد
  
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('✅ تم إنشاء ' + myAccounts.length + ' حساب');
  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log('');
  Logger.log('📝 الخطوة التالية:');
  Logger.log('   1. افتح Google Sheets');
  Logger.log('   2. اذهب إلى ورقة "Accounts"');
  Logger.log('   3. أدخل الأرصدة الفعلية في عمود "الرصيد" (E)');
  Logger.log('   4. عدّل أرقام الحسابات في عمود "الرقم" (C)');
  Logger.log('');
  Logger.log('═══════════════════════════════════════════════════════════════');
  
  return { success: true, accounts: myAccounts.length };
}

/**
 * تحديث رصيد حساب معين
 * استخدم هذه الدالة من Apps Script لتحديث الأرصدة يدوياً
 */
function UPDATE_ACCOUNT_BALANCE(accountNumber, newBalance) {
  if (typeof setBalance_ === 'function') {
    setBalance_(accountNumber, Number(newBalance) || 0);
    Logger.log('✅ تم تحديث رصيد ' + accountNumber + ' إلى ' + newBalance);
    return { success: true };
  }
  return { success: false, error: 'دالة setBalance_ غير متاحة' };
}

/**
 * عرض جميع الأرصدة الحالية
 */
function SHOW_ALL_BALANCES() {
  if (typeof getAccountsWithBalances_ === 'function') {
    var balances = getAccountsWithBalances_();
    Logger.log('═══════════════════════════════════════════════════════════════');
    Logger.log('💳 الأرصدة الحالية');
    Logger.log('═══════════════════════════════════════════════════════════════');
    
    var total = 0;
    balances.forEach(function(b) {
      total += b.balance;
      Logger.log(b.name + ': ' + b.balance.toFixed(2) + ' SAR');
    });
    
    Logger.log('───────────────────────────────────────────────────────────────');
    Logger.log('💰 الإجمالي: ' + total.toFixed(2) + ' SAR');
    Logger.log('═══════════════════════════════════════════════════════════════');
    
    return balances;
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════════
// UI CRUD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Get all accounts with balances
 */
function SOV1_UI_getAllAccounts_() {
  try {
    var sh = ensureAccountsSheet_();
    var last = sh.getLastRow();
    
    if (last < 2) {
      return [];
    }
    
    var rows = sh.getRange(2, 1, last - 1, 7).getValues();
    var accounts = [];
    
    rows.forEach(function(r, idx) {
      accounts.push({
        id: idx + 2, // Row number for editing/deleting
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        number: String(r[2] || ''),
        bank: String(r[3] || ''),
        aliases: String(r[4] || ''),
        isMine: String(r[5] || '').toLowerCase() === 'true',
        isInternal: String(r[6] || '').toLowerCase() === 'true'
      });
    });
    
    return accounts;
  } catch (e) {
    Logger.log('Error getting accounts: ' + e);
    return [];
  }
}

/**
 * Add new account
 */
function SOV1_UI_addAccount_(accountData) {
  try {
    if (!accountData || !accountData.name || !accountData.type) {
      return { success: false, error: 'الاسم والنوع مطلوبان' };
    }
    
    var sh = ensureAccountsSheet_();
    
    sh.appendRow([
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || '',
      accountData.aliases || '',
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false'
    ]);
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX');
    
    return { success: true, message: 'تم إضافة الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error adding account: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update existing account
 */
function SOV1_UI_updateAccount_(rowId, accountData) {
  try {
    if (!rowId || rowId < 2) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    if (!accountData || !accountData.name || !accountData.type) {
      return { success: false, error: 'الاسم والنوع مطلوبان' };
    }
    
    var sh = ensureAccountsSheet_();
    
    if (rowId > sh.getLastRow()) {
      return { success: false, error: 'الحساب غير موجود' };
    }
    
    sh.getRange(rowId, 1, 1, 7).setValues([[
      accountData.name,
      accountData.type,
      accountData.number || '',
      accountData.bank || '',
      accountData.aliases || '',
      accountData.isMine ? 'true' : 'false',
      accountData.isInternal ? 'true' : 'false'
    ]]);
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX');
    
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
    if (!rowId || rowId < 2) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var sh = ensureAccountsSheet_();
    
    if (rowId > sh.getLastRow()) {
      return { success: false, error: 'الحساب غير موجود' };
    }
    
    sh.deleteRow(rowId);
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX');
    
    return { success: true, message: 'تم حذف الحساب بنجاح' };
  } catch (e) {
    Logger.log('Error deleting account: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Populate Accounts sheet from KNOWN_ACCOUNTS and KNOWN_CARDS
 * defined in BankSMS_Patterns.js
 * Call this to seed accounts from discovered SMS patterns
 */
function SOV1_SEED_ACCOUNTS_FROM_PATTERNS() {
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║     🏦 SEEDING ACCOUNTS FROM SMS PATTERNS                  ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    var sh = ensureAccountsSheet_();
    
    // Get existing accounts to avoid duplicates
    var existingNumbers = {};
    var lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      var existing = sh.getRange(2, 3, lastRow - 1, 1).getValues();
      existing.forEach(function(r) {
        if (r[0]) existingNumbers[String(r[0]).trim()] = true;
      });
    }
    
    var added = 0;
    var skipped = 0;
    
    // Add from KNOWN_ACCOUNTS (from BankSMS_Patterns.js)
    if (typeof KNOWN_ACCOUNTS !== 'undefined') {
      for (var accNum in KNOWN_ACCOUNTS) {
        if (existingNumbers[accNum]) {
          Logger.log('⏭️ Skipping existing account: ' + accNum);
          skipped++;
          continue;
        }
        
        var acc = KNOWN_ACCOUNTS[accNum];
        var name = acc.owner || 'حساب ' + acc.bank;
        
        sh.appendRow([
          name,                        // الاسم
          'حساب',                      // النوع
          accNum,                      // الرقم/آخر4
          acc.bank || '',             // الجهة
          '',                         // أسماء بديلة
          acc.isMine ? 'true' : 'false', // هل حسابي؟
          'false'                     // تحويل داخلي؟
        ]);
        
        existingNumbers[accNum] = true;
        added++;
        Logger.log('✅ Added account: ' + accNum + ' - ' + name + ' (' + acc.bank + ')');
      }
    }
    
    // Add from KNOWN_CARDS
    if (typeof KNOWN_CARDS !== 'undefined') {
      for (var cardNum in KNOWN_CARDS) {
        if (existingNumbers[cardNum]) {
          Logger.log('⏭️ Skipping existing card: ' + cardNum);
          skipped++;
          continue;
        }
        
        var card = KNOWN_CARDS[cardNum];
        var cardName = (card.owner || '') + ' - ' + card.type + ' ' + card.bank;
        
        sh.appendRow([
          cardName.trim(),             // الاسم
          card.type || 'بطاقة',       // النوع
          cardNum,                     // الرقم/آخر4
          card.bank || '',            // الجهة
          '',                         // أسماء بديلة
          card.isMine ? 'true' : 'false', // هل حسابي؟
          'false'                     // تحويل داخلي؟
        ]);
        
        existingNumbers[cardNum] = true;
        added++;
        Logger.log('✅ Added card: ' + cardNum + ' - ' + cardName + ' (' + card.bank + ')');
      }
    }
    
    // Clear cache
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX');
    
    Logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Logger.log('📊 SUMMARY');
    Logger.log('   ✅ Added: ' + added + ' accounts/cards');
    Logger.log('   ⏭️ Skipped: ' + skipped + ' (already exist)');
    Logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { 
      success: true, 
      added: added, 
      skipped: skipped,
      message: 'تم إضافة ' + added + ' حساب/بطاقة'
    };
  } catch (e) {
    Logger.log('❌ Error seeding accounts: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get account info by number (last 4 digits)
 * Used for transaction linkage
 */
function getAccountByNumber_(number) {
  if (!number) return null;
  
  var numStr = String(number).trim();
  
  // Check KNOWN_ACCOUNTS first
  if (typeof KNOWN_ACCOUNTS !== 'undefined' && KNOWN_ACCOUNTS[numStr]) {
    return KNOWN_ACCOUNTS[numStr];
  }
  
  // Check KNOWN_CARDS
  if (typeof KNOWN_CARDS !== 'undefined' && KNOWN_CARDS[numStr]) {
    return KNOWN_CARDS[numStr];
  }
  
  // Check Accounts sheet
  var sh = ensureAccountsSheet_();
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return null;
  
  var data = sh.getRange(2, 1, lastRow - 1, 7).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][2]).trim() === numStr) {
      return {
        name: data[i][0],
        type: data[i][1],
        number: data[i][2],
        bank: data[i][3],
        aliases: data[i][4],
        isMine: String(data[i][5]).toLowerCase() === 'true',
        isInternal: String(data[i][6]).toLowerCase() === 'true'
      };
    }
  }
  
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
