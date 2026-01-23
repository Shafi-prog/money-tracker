/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * DataIntegrity.js - نظام سلامة البيانات (Primary Keys + Cascade Operations)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🔑 المميزات:
 * - UUID فريد لكل معاملة
 * - ربط تلقائي بين الأوراق (Foreign Keys)
 * - حذف متتالي (Cascade Delete)
 * - تحديث متتالي (Cascade Update)
 * - فهرسة سريعة باستخدام CacheService
 * - تدقيق سلامة البيانات (Integrity Check)
 * 
 * 📊 هيكل الأوراق:
 * - Sheet1: [UUID, Date, Tag, Day, Week, Source, AccNum, CardNum, Amount, Merchant, Category, Type, Raw]
 * - Budgets: [Category, Budget, Spent, Remaining, LinkedUUIDs]
 * - Debt_Ledger: [UUID, Date, Party, Debit, Credit, Balance, Description, ParentUUID]
 * - Dashboard: [UUID, Date, Merchant, Amount, Category, Source]
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🔑 UUID Generation
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * توليد UUID فريد (v4-like)
 */
function generateUUID_() {
  var template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * توليد UUID قصير (للعرض)
 */
function generateShortUUID_() {
  return 'TXN-' + Date.now().toString(36).toUpperCase() + '-' + 
         Math.random().toString(36).substring(2, 6).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 Schema Definition - تعريف هيكل الأوراق
// ═══════════════════════════════════════════════════════════════════════════════

var SCHEMA = {
  Sheet1: {
    name: 'Sheet1',
    primaryKey: 'UUID',
    columns: ['UUID', 'Date', 'Tag', 'Day', 'Week', 'Source', 'AccNum', 'CardNum', 'Amount', 'Merchant', 'Category', 'Type', 'Raw'],
    indexes: { UUID: 0, Date: 1, Amount: 8, Merchant: 9, Category: 10 }
  },
  Budgets: {
    name: 'Budgets',
    primaryKey: 'Category',
    columns: ['Category', 'Budget', 'Spent', 'Remaining', 'LinkedUUIDs'],
    indexes: { Category: 0, Budget: 1, Spent: 2, Remaining: 3, LinkedUUIDs: 4 }
  },
  Debt_Ledger: {
    name: 'Debt_Ledger',
    primaryKey: 'UUID',
    foreignKey: 'ParentUUID',
    columns: ['UUID', 'Date', 'Party', 'Debit', 'Credit', 'Balance', 'Description', 'ParentUUID'],
    indexes: { UUID: 0, Date: 1, Party: 2, ParentUUID: 7 }
  },
  Dashboard: {
    name: 'Dashboard',
    primaryKey: 'UUID',
    foreignKey: 'UUID',
    columns: ['UUID', 'Date', 'Merchant', 'Amount', 'Category', 'Source'],
    indexes: { UUID: 0 }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 Core CRUD Operations with Integrity
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * إدراج معاملة جديدة مع UUID وربط تلقائي
 * @param {Object} data - بيانات المعاملة
 * @param {string} source - مصدر البيانات
 * @param {string} raw - النص الخام
 * @returns {Object} - نتيجة الإدراج مع UUID
 */
function insertTransaction_(data, source, raw) {
  var uuid = generateShortUUID_();
  var now = new Date();
  
  var ss = _ss();
  var s1 = ss.getSheetByName('Sheet1') || ss.insertSheet('Sheet1');
  var sDash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  var sDebt = ss.getSheetByName('Debt_Ledger') || ss.insertSheet('Debt_Ledger');
  var sBudgets = ss.getSheetByName('Budgets') || ss.insertSheet('Budgets');
  
  // 1️⃣ إضافة لـ Sheet1
  var row1 = [
    uuid,                           // A: UUID
    now,                            // B: Date
    'V120_AUTO',                    // C: Tag
    getDayName_(now),               // D: Day
    getWeekNumber_(now),            // E: Week
    source || 'unknown',            // F: Source
    data.accNum || '',              // G: AccNum
    data.cardNum || '',             // H: CardNum
    Number(data.amount) || 0,       // I: Amount
    data.merchant || '',            // J: Merchant
    data.category || '',            // K: Category
    data.type || '',                // L: Type
    raw || ''                       // M: Raw
  ];
  s1.appendRow(row1);
  
  // 2️⃣ إضافة لـ Dashboard
  sDash.appendRow([
    uuid,
    now,
    data.merchant || '',
    Number(data.amount) || 0,
    data.category || '',
    source || ''
  ]);
  
  // 3️⃣ تحديث Budgets (مع ربط UUID)
  var isInternal = SOV1_isInternalTransfer_(data);
  var budgetResult = { remaining: 0 };
  
  if (!isInternal && data.category) {
    budgetResult = updateBudgetWithUUID_(sBudgets, data.category, data.amount, data.isIncoming, uuid);
  }
  
  // 4️⃣ إضافة لـ Debt_Ledger إذا تحويل داخلي
  var debtResult = { balance: 0 };
  if (isInternal) {
    debtResult = insertDebtEntry_(sDebt, data, uuid, now);
  }
  
  // 5️⃣ تحديث الفهرس في Cache
  updateUUIDIndex_(uuid, s1.getLastRow());
  
  return {
    uuid: uuid,
    sheet1Row: s1.getLastRow(),
    budget: budgetResult,
    debt: debtResult,
    internal: isInternal
  };
}

/**
 * حذف معاملة مع Cascade Delete
 * @param {string} uuid - UUID المعاملة
 * @returns {Object} - نتيجة الحذف
 */
function deleteTransaction_(uuid) {
  if (!uuid) return { success: false, error: 'UUID مطلوب' };
  
  var ss = _ss();
  var results = {
    uuid: uuid,
    deleted: [],
    errors: []
  };
  
  try {
    // 1️⃣ حذف من Sheet1
    var s1Result = deleteRowByUUID_(ss, 'Sheet1', uuid, 0);
    if (s1Result.deleted) {
      results.deleted.push('Sheet1');
      
      // استرجاع بيانات الصف قبل الحذف لتحديث Budgets
      if (s1Result.rowData) {
        var category = s1Result.rowData[10]; // Column K
        var amount = Number(s1Result.rowData[8]) || 0; // Column I
        var typ = String(s1Result.rowData[11] || '');
        var raw = String(s1Result.rowData[12] || '');
        var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
        
        // 2️⃣ تحديث Budgets (إرجاع المبلغ)
        var sBudgets = ss.getSheetByName('Budgets');
        if (sBudgets && category) {
          reverseBudgetEntry_(sBudgets, category, amount, uuid, incoming);
          results.deleted.push('Budgets (updated)');
        }
      }
    }
    
    // 3️⃣ حذف من Dashboard
    var dashResult = deleteRowByUUID_(ss, 'Dashboard', uuid, 0);
    if (dashResult.deleted) results.deleted.push('Dashboard');
    
    // 4️⃣ حذف من Debt_Ledger (بما في ذلك الإدخالات المرتبطة)
    var debtResult = deleteDebtEntriesByUUID_(ss, uuid);
    if (debtResult.deleted > 0) results.deleted.push('Debt_Ledger (' + debtResult.deleted + ')');
    
    // 5️⃣ حذف من Cache
    removeFromUUIDIndex_(uuid);
    
    results.success = true;
    
  } catch (e) {
    results.success = false;
    results.errors.push(e.message);
  }
  
  return results;
}

/**
 * حذف صف بناءً على UUID
 */
function deleteRowByUUID_(ss, sheetName, uuid, uuidColumn) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { deleted: false };
  
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][uuidColumn]) === String(uuid)) {
      var rowData = data[i];
      sheet.deleteRow(i + 1);
      return { deleted: true, row: i + 1, rowData: rowData };
    }
  }
  return { deleted: false };
}

/**
 * حذف إدخالات الدين المرتبطة
 */
function deleteDebtEntriesByUUID_(ss, uuid) {
  var sheet = ss.getSheetByName('Debt_Ledger');
  if (!sheet) return { deleted: 0 };
  
  var data = sheet.getDataRange().getValues();
  var deletedCount = 0;
  
  // حذف من الأسفل للأعلى لتجنب تغيير الـ index
  for (var i = data.length - 1; i >= 1; i--) {
    var rowUUID = String(data[i][0] || '');
    var parentUUID = String(data[i][7] || '');
    
    if (rowUUID === uuid || parentUUID === uuid) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  // إعادة حساب الأرصدة
  if (deletedCount > 0) {
    recalculateDebtBalances_(sheet);
  }
  
  return { deleted: deletedCount };
}

/**
 * إعادة حساب أرصدة Debt_Ledger
 */
function recalculateDebtBalances_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  var balance = 0;
  for (var i = 2; i <= lastRow; i++) {
    var debit = Number(sheet.getRange(i, 4).getValue()) || 0;
    var credit = Number(sheet.getRange(i, 5).getValue()) || 0;
    balance = balance + debit - credit;
    sheet.getRange(i, 6).setValue(balance);
  }
}

/**
 * تحديث Budgets مع ربط UUID
 */
function updateBudgetWithUUID_(sheet, category, amount, isIncoming, uuid) {
  if (!category) return { remaining: 0 };
  
  var data = sheet.getDataRange().getValues();
  var rowIdx = -1;
  
  // البحث عن التصنيف
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(category)) {
      rowIdx = i + 1;
      break;
    }
  }
  
  // إنشاء صف جديد إذا لم يوجد
  if (rowIdx === -1) {
    rowIdx = sheet.getLastRow() + 1;
    sheet.getRange(rowIdx, 1, 1, 5).setValues([[category, 0, 0, '=B' + rowIdx + '-C' + rowIdx, uuid]]);
  }
  
  // تحديث المصروف
  var currentSpent = Number(sheet.getRange(rowIdx, 3).getValue()) || 0;
  var delta = isIncoming ? -Number(amount) : Number(amount);
  sheet.getRange(rowIdx, 3).setValue(currentSpent + delta);
  
  // إضافة UUID للقائمة
  var linkedUUIDs = String(sheet.getRange(rowIdx, 5).getValue() || '');
  if (linkedUUIDs) linkedUUIDs += ',';
  linkedUUIDs += uuid;
  sheet.getRange(rowIdx, 5).setValue(linkedUUIDs);
  
  SpreadsheetApp.flush();
  
  return {
    remaining: Number(sheet.getRange(rowIdx, 4).getValue()) || 0,
    row: rowIdx
  };
}

/**
 * إرجاع مبلغ من Budgets عند الحذف
 */
function reverseBudgetEntry_(sheet, category, amount, uuid, isIncoming) {
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(category)) {
      var rowIdx = i + 1;
      var currentSpent = Number(sheet.getRange(rowIdx, 3).getValue()) || 0;
      var delta = (typeof isIncoming === 'boolean') ? (isIncoming ? -Number(amount) : Number(amount)) : Number(amount);
      sheet.getRange(rowIdx, 3).setValue(currentSpent - delta);
      
      // إزالة UUID من القائمة
      var linkedUUIDs = String(sheet.getRange(rowIdx, 5).getValue() || '');
      linkedUUIDs = linkedUUIDs.split(',').filter(function(u) { return u !== uuid; }).join(',');
      sheet.getRange(rowIdx, 5).setValue(linkedUUIDs);
      
      break;
    }
  }
}

/**
 * إدراج إدخال في Debt_Ledger
 */
function insertDebtEntry_(sheet, data, parentUUID, date) {
  var debtUUID = generateShortUUID_();
  var amt = Number(data.amount) || 0;
  var party = data.merchant || 'تحويل داخلي';
  var debit = data.isIncoming ? amt : 0;
  var credit = data.isIncoming ? 0 : amt;
  var desc = (data.isIncoming ? 'حوالة داخلية واردة' : 'حوالة داخلية صادرة') + ' - ' + party;
  
  sheet.appendRow([debtUUID, date, party, debit, credit, '', desc, parentUUID]);
  
  var lastRow = sheet.getLastRow();
  
  // حساب الرصيد
  if (lastRow === 2) {
    sheet.getRange(lastRow, 6).setFormula('=D2-E2');
  } else {
    sheet.getRange(lastRow, 6).setFormulaR1C1('=R[-1]C + RC[-3] - RC[-2]');
  }
  
  SpreadsheetApp.flush();
  
  return {
    uuid: debtUUID,
    balance: Number(sheet.getRange(lastRow, 6).getValue()) || 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📇 UUID Index (Cache-based)
// ═══════════════════════════════════════════════════════════════════════════════

function updateUUIDIndex_(uuid, row) {
  try {
    var cache = CacheService.getScriptCache();
    cache.put('UUID_' + uuid, String(row), 21600); // 6 hours
  } catch (e) {}
}

function removeFromUUIDIndex_(uuid) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove('UUID_' + uuid);
  } catch (e) {}
}

function getRowByUUID_(uuid) {
  try {
    var cache = CacheService.getScriptCache();
    var row = cache.get('UUID_' + uuid);
    if (row) return Number(row);
  } catch (e) {}
  
  // Fallback: search in sheet
  var data = _sheet('Sheet1').getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(uuid)) {
      updateUUIDIndex_(uuid, i + 1);
      return i + 1;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 Query Functions
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * البحث عن معاملة بالـ UUID
 */
function findTransactionByUUID_(uuid) {
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(uuid)) {
      var result = {};
      for (var j = 0; j < headers.length; j++) {
        result[headers[j] || ('col' + j)] = data[i][j];
      }
      result._row = i + 1;
      return result;
    }
  }
  return null;
}

/**
 * الحصول على جميع المعاملات مع pagination
 */
function getTransactions_(options) {
  options = options || {};
  var limit = options.limit || 50;
  var offset = options.offset || 0;
  var sortBy = options.sortBy || 'Date';
  var sortOrder = options.sortOrder || 'desc';
  
  var sheet = _sheet('Sheet1');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var transactions = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j] || ('col' + j)] = data[i][j];
    }
    row._row = i + 1;
    transactions.push(row);
  }
  
  // Sort
  var sortIdx = SCHEMA.Sheet1.indexes[sortBy] || 1;
  transactions.sort(function(a, b) {
    var va = a[headers[sortIdx]] || '';
    var vb = b[headers[sortIdx]] || '';
    if (sortOrder === 'desc') return va > vb ? -1 : 1;
    return va < vb ? -1 : 1;
  });
  
  // Pagination
  var total = transactions.length;
  transactions = transactions.slice(offset, offset + limit);
  
  return {
    data: transactions,
    total: total,
    limit: limit,
    offset: offset,
    hasMore: (offset + limit) < total
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ Integrity Check
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * فحص سلامة البيانات بين الأوراق
 */
function checkDataIntegrity_() {
  var ss = _ss();
  var issues = [];
  var stats = { sheet1: 0, dashboard: 0, debt: 0, budgets: 0 };
  
  // 1. جمع UUIDs من Sheet1
  var s1 = ss.getSheetByName('Sheet1');
  var s1Data = s1 ? s1.getDataRange().getValues() : [];
  var s1UUIDs = new Set();
  
  for (var i = 1; i < s1Data.length; i++) {
    var uuid = String(s1Data[i][0] || '');
    if (uuid && uuid !== 'UUID') {
      s1UUIDs.add(uuid);
      stats.sheet1++;
    }
  }
  
  // 2. فحص Dashboard
  var dash = ss.getSheetByName('Dashboard');
  var dashData = dash ? dash.getDataRange().getValues() : [];
  
  for (var i = 1; i < dashData.length; i++) {
    var uuid = String(dashData[i][0] || '');
    if (uuid && uuid !== 'UUID') {
      stats.dashboard++;
      if (!s1UUIDs.has(uuid)) {
        issues.push({
          type: 'ORPHAN',
          sheet: 'Dashboard',
          row: i + 1,
          uuid: uuid,
          message: 'UUID موجود في Dashboard لكن غير موجود في Sheet1'
        });
      }
    }
  }
  
  // 3. فحص Debt_Ledger
  var debt = ss.getSheetByName('Debt_Ledger');
  var debtData = debt ? debt.getDataRange().getValues() : [];
  
  for (var i = 1; i < debtData.length; i++) {
    var parentUUID = String(debtData[i][7] || '');
    if (parentUUID && parentUUID !== 'ParentUUID') {
      stats.debt++;
      if (!s1UUIDs.has(parentUUID)) {
        issues.push({
          type: 'ORPHAN',
          sheet: 'Debt_Ledger',
          row: i + 1,
          uuid: parentUUID,
          message: 'ParentUUID غير موجود في Sheet1'
        });
      }
    }
  }
  
  // 4. فحص Budgets LinkedUUIDs
  var budgets = ss.getSheetByName('Budgets');
  var budgetsData = budgets ? budgets.getDataRange().getValues() : [];
  
  for (var i = 1; i < budgetsData.length; i++) {
    var linkedStr = String(budgetsData[i][4] || '');
    if (linkedStr) {
      var linked = linkedStr.split(',').filter(function(u) { return u.trim(); });
      stats.budgets += linked.length;
      
      linked.forEach(function(uuid) {
        if (!s1UUIDs.has(uuid.trim())) {
          issues.push({
            type: 'ORPHAN_LINK',
            sheet: 'Budgets',
            row: i + 1,
            uuid: uuid.trim(),
            category: budgetsData[i][0],
            message: 'LinkedUUID غير موجود في Sheet1'
          });
        }
      });
    }
  }
  
  return {
    healthy: issues.length === 0,
    issues: issues,
    stats: stats,
    timestamp: new Date().toISOString()
  };
}

/**
 * إصلاح مشاكل السلامة (حذف الـ orphans)
 */
function repairDataIntegrity_() {
  var check = checkDataIntegrity_();
  if (check.healthy) return { repaired: 0, message: 'لا توجد مشاكل' };
  
  var ss = _ss();
  var repaired = 0;
  
  // ترتيب من الأكبر للأصغر لتجنب تغيير الـ index
  check.issues.sort(function(a, b) { return b.row - a.row; });
  
  check.issues.forEach(function(issue) {
    try {
      if (issue.type === 'ORPHAN') {
        var sheet = ss.getSheetByName(issue.sheet);
        if (sheet) {
          sheet.deleteRow(issue.row);
          repaired++;
        }
      } else if (issue.type === 'ORPHAN_LINK') {
        var sheet = ss.getSheetByName(issue.sheet);
        if (sheet) {
          var linked = String(sheet.getRange(issue.row, 5).getValue() || '');
          linked = linked.split(',').filter(function(u) { return u.trim() !== issue.uuid; }).join(',');
          sheet.getRange(issue.row, 5).setValue(linked);
          repaired++;
        }
      }
    } catch (e) {}
  });
  
  return {
    repaired: repaired,
    total: check.issues.length,
    message: 'تم إصلاح ' + repaired + ' من ' + check.issues.length + ' مشكلة'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📅 Helper Functions
// ═══════════════════════════════════════════════════════════════════════════════

function getDayName_(date) {
  var days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

function getWeekNumber_(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
