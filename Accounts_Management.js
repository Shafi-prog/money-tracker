/**
 * ACCOUNTS_MANAGEMENT.js - Complete Accounts CRUD
 * User can add, edit, delete accounts from UI
 */

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
