/**
 * TRANSACTION_MANAGEMENT.js - Complete Transaction CRUD
 * Provides edit and enhanced delete functionality
 * Synced with Flow.js schema: 
 * [UUID, Date, Tag, Day, Week, Source, AccNum, CardNum, Amount, Merchant, Category, Type, Notes]
 */

/**
 * Get transaction by row ID for editing
 */
function SOV1_UI_getTransaction_(rowId) {
  try {
    var sheet = _sheet('Sheet1');
    
    if (rowId < 2 || rowId > sheet.getLastRow()) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var data = sheet.getRange(rowId, 1, 1, 13).getValues()[0];
    
    return {
      success: true,
      transaction: {
        rowId: rowId,
        date: data[1],      // Index 1: Date
        uuid: data[0],      // Index 0: UUID
        merchant: data[9],  // Index 9: Merchant
        category: data[10], // Index 10: Category
        amount: data[8],    // Index 8: Amount
        type: data[11],     // Index 11: Type
        notes: data[12]     // Index 12: Notes/Raw
      }
    };
  } catch (e) {
    Logger.log('Error getting transaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Create new transaction directly (bypassing text parsing)
 */
function SOV1_UI_createTransaction_(data) {
  try {
    if (!data.amount) throw new Error('المبلغ مطلوب');
    
    var s1 = _sheet('Sheet1');
    
    var now = new Date();
    var uuid = (typeof generateShortUUID_ === 'function') ? generateShortUUID_() : 'WEB-' + Date.now();
    var dateVal = data.date ? new Date(data.date) : now;
    
    var amount = Math.abs(Number(data.amount));
    var type = data.type || 'expense';
    var merchant = data.merchant || 'غير محدد';
    var categoryRaw = data.category || '';
    
    // Only auto-detect category if truly empty/undefined (not if user selected "أخرى")
    var category = categoryRaw;
    if (!category || category.trim() === '') {
      category = detectCategoryFromMerchant_(merchant) || 'أخرى';
    }
    category = normalizeCategoryForBudget_(category);
    
    var notes = data.notes || '';
    var account = data.account || 'نقدي';
    
    // Schema: [UUID, Date, Tag, Day, Week, Source, AccNum, CardNum, Amount, Merchant, Category, Type, Raw]
    s1.appendRow([
      uuid,
      dateVal,
      'WEB_UI', // Tag
      'اليوم', // Placeholder for day formula
      'الأسبوع', // Placeholder for week formula
      'Web',    // Source
      account,  // AccNum/Account Name
      '',       // CardNum
      amount,
      merchant,
      category,
      type,
      notes
    ]);
    
    // Update Budget Logic
    var isIncoming = (type === 'income' || type === 'دخل');
    var isInternal = isInternalTransferForBudget_(categoryRaw, type);
    
    if (!isInternal) {
      applyBudgetAmount_(category, isIncoming ? -amount : amount);
    }
    
    // ✅ UPDATE ACCOUNT BALANCE
    if (typeof updateBalancesAfterTransaction_ === 'function') {
      try {
        updateBalancesAfterTransaction_({
          accNum: account,
          cardNum: '',
          merchant: merchant,
          amount: amount,
          isIncoming: isIncoming,
          category: category,
          type: type
        });
      } catch (eB) {
        Logger.log('Balance update error: ' + eB.message);
      }
    }
    
    return { success: true, message: 'تم إضافة العملية بنجاح', uuid: uuid };
    
  } catch (e) {
    Logger.log('Error creating transaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Detect category from merchant name using pattern matching
 */
function detectCategoryFromMerchant_(merchant) {
  if (!merchant) return null;
  var m = String(merchant).toLowerCase();
  
  // Food & Restaurants
  if (/starbucks|coffee|قهوة|كافيه|cafe|مطعم|restaurant|برجر|burger|بيتزا|pizza|kfc|mcd|ماكدونالدز|هرفي|البيك|شاورما|فطور|غداء|عشاء|مخبز|bakery|حلويات|sweets/.test(m)) {
    return 'طعام';
  }
  
  // Fuel/Gas
  if (/naft|نافت|بنزين|petrol|gas|fuel|محطة|station|وقود/.test(m)) {
    return 'وقود';
  }
  
  // Transport
  if (/uber|careem|كريم|jeeny|جيني|taxi|تاكسي|مواصلات/.test(m)) {
    return 'نقل';
  }
  
  // Bills/Utilities
  if (/electricity|كهرباء|water|مياه|stc|زين|zain|mobily|موبايلي|اتصالات|telecom|انترنت|internet/.test(m)) {
    return 'فواتير';
  }
  
  // Shopping
  if (/amazon|امازون|noon|نون|jarir|جرير|extra|اكسترا|ikea|ايكيا|mall|مول|hypermarket|هايبر|carrefour|كارفور|panda|بنده|danube|الدانوب|tamimi|التميمي/.test(m)) {
    return 'تسوق';
  }
  
  // Entertainment
  if (/netflix|نتفلكس|spotify|cinema|سينما|game|العاب|playstation|xbox|اشتراك/.test(m)) {
    return 'ترفيه';
  }
  
  // Health
  if (/pharmacy|صيدلية|hospital|مستشفى|clinic|عيادة|doctor|دكتور|طبيب|nahdi|نهدي|dawa|دواء/.test(m)) {
    return 'صحة';
  }
  
  // Education
  if (/university|جامعة|school|مدرسة|institute|معهد|course|دورة|تعليم|education/.test(m)) {
    return 'تعليم';
  }
  
  // Housing
  if (/rent|إيجار|ايجار|maintenance|صيانة|عقار/.test(m)) {
    return 'سكن';
  }
  
  // ATM/Withdrawal
  if (/atm|صراف|سحب|withdrawal/.test(m)) {
    return 'سحب نقدي';
  }
  
  return null;
}

/**
 * Update existing transaction
 */
function SOV1_UI_updateTransaction_(rowId, newData) {
  try {
    if (!rowId || rowId < 2) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var sheet = _sheet('Sheet1');
    
    if (rowId > sheet.getLastRow()) {
      return { success: false, error: 'العملية غير موجودة' };
    }
    
    var currentRange = sheet.getRange(rowId, 1, 1, 13);
    var currentRow = currentRange.getValues()[0];
    
    var oldCategoryRaw = currentRow[10]; // Index 10
    var oldCategory = normalizeCategoryForBudget_(oldCategoryRaw);
    var oldAmount = Number(currentRow[8]) || 0; // Index 8
    var oldType = currentRow[11]; // Index 11
    
    // Update fields if provided
    var changes = {};
    if (newData.merchant !== undefined) changes[10] = newData.merchant; // Col 10
    if (newData.category !== undefined) changes[11] = newData.category; // Col 11
    if (newData.amount !== undefined) changes[9] = Number(newData.amount); // Col 9
    if (newData.notes !== undefined) changes[13] = newData.notes; // Col 13
    if (newData.type !== undefined) changes[12] = newData.type; // Col 12
    
    // Apply changes
    Object.keys(changes).forEach(function(col) {
      sheet.getRange(rowId, parseInt(col)).setValue(changes[col]);
    });

    // Budget Update Logic
    var categoryChanged = (newData.category !== undefined && newData.category !== oldCategoryRaw);
    var amountChanged = (newData.amount !== undefined && Number(newData.amount) !== oldAmount);
    var typeChanged = (newData.type !== undefined && newData.type !== oldType);
    
    if (categoryChanged || amountChanged || typeChanged) {
       // Reverse old (only if not internal transfer)
       var oldIsInternal = isInternalTransferForBudget_(oldCategoryRaw, oldType);
       if (!oldIsInternal) {
         var oldIsIncoming = (oldType === 'income' || oldType === 'دخل');
         var oldDelta = oldIsIncoming ? -oldAmount : oldAmount;
         applyBudgetAmount_(oldCategory, -oldDelta);
       }
       
       // Apply new (only if not internal transfer)
       var newCategoryRaw = (newData.category !== undefined) ? newData.category : oldCategoryRaw;
       var newCategory = normalizeCategoryForBudget_(newCategoryRaw);
       var newAmount = (newData.amount !== undefined) ? Number(newData.amount) : oldAmount;
       var newType = (newData.type !== undefined) ? newData.type : oldType;
       var newIsInternal = isInternalTransferForBudget_(newCategoryRaw, newType);
       if (!newIsInternal) {
         var newIsIncoming = (newType === 'income' || newType === 'دخل');
         var newDelta = newIsIncoming ? -newAmount : newAmount;
         applyBudgetAmount_(newCategory, newDelta);
       }
    }
    
    return { success: true, message: 'تم تحديث العملية بنجاح' };
  } catch (e) {
    Logger.log('Error updating transaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteTransaction_(rowId) {
   try {
    var sheet = _sheet('Sheet1');
    var maxRows = sheet.getLastRow();
     
    if (!rowId || rowId < 2 || rowId > maxRows) {
      return { success: false, error: 'معرف غير صالح' };
    }
     
    var currentRow = sheet.getRange(rowId, 1, 1, 13).getValues()[0];
    var categoryRaw = currentRow[10]; // Index 10
    var amount = Number(currentRow[8]) || 0; // Index 8
    var type = currentRow[11]; // Index 11
    
    var isInternal = isInternalTransferForBudget_(categoryRaw, type);
    if (!isInternal) {
      var category = normalizeCategoryForBudget_(categoryRaw);
      var isIncoming = (type === 'income' || type === 'دخل');
      var delta = isIncoming ? -amount : amount;
      applyBudgetAmount_(category, -delta);
    }
     
    sheet.deleteRow(rowId);
    return { success: true, message: 'تم حذف العملية' };
   } catch(e) {
     return { success: false, error: e.message };
   }
}

function applyBudgetAmount_(category, amount) {
    try {
      var sB = _sheet('Budgets');
      if (!sB) return;

      var data = sB.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]||'').trim().toLowerCase() === String(category).trim().toLowerCase()) {
          var currentSpent = Number(data[i][2]) || 0;
          var newSpent = currentSpent + amount;
          sB.getRange(i + 1, 3).setValue(newSpent);      
          break;
        }
      }
    } catch (e) { Logger.log(e); }
}

function normalizeCategoryForBudget_(category) {
  var c = String(category || '').trim();
  if (!c) return 'أخرى';
  var lc = c.toLowerCase();
  if (lc === 'pos' || lc === 'unknown') return 'أخرى';
  return c;
}

function isInternalTransferForBudget_(category, type) {
  var cat = String(category || '');
  var typ = String(type || '');
  return /(حوالة داخلية|تحويل داخلي|internal)/i.test(cat) ||
         /(حوالة داخلية|تحويل داخلي|internal)/i.test(typ) ||
         typ.toLowerCase() === 'transfer';
}

function reverseBudgetAmount_(category, amount) {
    applyBudgetAmount_(category, -amount);
}

/**
 * Remove test transactions for a specific year only
 * Matches: test, تجريب, تجربة, dummy, fake in Merchant/Category/Raw
 * @param {number} year - target year (e.g., 2025). Defaults to current year.
 */
function SOV1_CLEAN_TEST_TRANSACTIONS_BY_YEAR_(year) {
  try {
    var targetYear = Number(year) || new Date().getFullYear();
    var sheet = _sheet('Sheet1');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, removed: 0, year: targetYear };

    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
    var toDelete = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var dateVal = row[1]; // Date column
      if (!(dateVal instanceof Date)) continue;
      if (dateVal.getFullYear() !== targetYear) continue;

      var merchant = String(row[9] || '');
      var category = String(row[10] || '');
      var raw = String(row[12] || '');
      var hay = (merchant + ' ' + category + ' ' + raw).toLowerCase();

      if (/\btest\b|تجريب|تجربة|dummy|fake/i.test(hay)) {
        // Budget reversal
        var amount = Number(row[8]) || 0;
        var type = String(row[11] || '');
        var isIncoming = (type === 'income' || type === 'دخل');
        var delta = isIncoming ? -amount : amount;
        applyBudgetAmount_(category, -delta);

        toDelete.push(i + 2);
      }
    }

    toDelete.sort(function(a, b) { return b - a; }).forEach(function(r) {
      sheet.deleteRow(r);
    });

    return { success: true, removed: toDelete.length, year: targetYear };
  } catch (e) {
    Logger.log('Error cleaning test transactions: ' + e);
    return { success: false, error: e.message };
  }
}
