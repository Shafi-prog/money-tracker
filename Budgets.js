/**
 * BUDGET_MANAGEMENT.js - Complete Budget CRUD Operations
 * Provides full create, read, update, delete for budgets
 */

/**
 * Save or Create new budget
 */
function SOV1_UI_saveBudget_(category, limit) {
  try {
    if (!category || !limit) {
      return { success: false, error: 'التصنيف والحد المطلوبان' };
    }
    
    var ss = _ss();
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet) {
      sheet = ss.insertSheet('Budgets');
      sheet.appendRow(['Category', 'Budgeted', 'Spent', 'Remaining', '% Used', 'Alert Threshold', 'Status']);
      sheet.setFrozenRows(1);
    }
    
    var data = sheet.getDataRange().getValues();
    var found = false;
    var row = -1;
    
    // Check if category exists
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(category).toLowerCase()) {
        found = true;
        row = i + 1;
        break;
      }
    }
    
    if (found) {
      // Update existing
      sheet.getRange(row, 2).setValue(Number(limit));
      // Recalculate remaining
      var spent = Number(sheet.getRange(row, 3).getValue()) || 0;
      sheet.getRange(row, 4).setValue(Number(limit) - spent);
    } else {
      // Add new
      sheet.appendRow([category, Number(limit), 0, Number(limit), 0, 80, '']);
    }
    
    return { success: true, message: 'تم حفظ الميزانية بنجاح' };
  } catch (e) {
    Logger.log('Error saving budget: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update existing budget limit
 */
function SOV1_UI_updateBudget_(category, newLimit) {
  try {
    if (!category || !newLimit) {
      return { success: false, error: 'التصنيف والحد الجديد مطلوبان' };
    }
    
    var ss = _ss();
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet) {
      return { success: false, error: 'لا توجد ميزانيات' };
    }
    
    var data = sheet.getDataRange().getValues();
    var found = false;
    var row = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(category).toLowerCase()) {
        found = true;
        row = i + 1;
        break;
      }
    }
    
    if (!found) {
      return { success: false, error: 'الميزانية غير موجودة' };
    }
    
    // Update limit
    sheet.getRange(row, 2).setValue(Number(newLimit));
    
    // Recalculate remaining
    var spent = Number(data[row - 1][2]) || 0;
    sheet.getRange(row, 4).setValue(Number(newLimit) - spent);
    
    return { success: true, message: 'تم تحديث الميزانية بنجاح' };
  } catch (e) {
    Logger.log('Error updating budget: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete budget category
 */
function SOV1_UI_deleteBudget_(category) {
  try {
    if (!category) {
      return { success: false, error: 'التصنيف مطلوب' };
    }
    
    var ss = _ss();
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet) {
      return { success: false, error: 'لا توجد ميزانيات' };
    }
    
    var data = sheet.getDataRange().getValues();
    var row = -1;
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(category).toLowerCase()) {
        row = i + 1;
        break;
      }
    }
    
    if (row === -1) {
      return { success: false, error: 'الميزانية غير موجودة' };
    }
    
    sheet.deleteRow(row);
    
    return { success: true, message: 'تم حذف الميزانية بنجاح' };
  } catch (e) {
    Logger.log('Error deleting budget: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get salary period date range based on user settings
 * @returns {Object} {start: Date, end: Date}
 */
function getSalaryPeriod_() {
  try {
    var settings = getSettings();
    var salaryDay = (settings && settings.settings && settings.settings.salary_day) || 1;
    
    var now = new Date();
    var start, end;
    
    if (now.getDate() >= salaryDay) {
      // We're past salary day this month
      start = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay, 0, 0, 0);
    } else {
      // We're before salary day this month
      start = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
    }
    
    return { start: start, end: end };
  } catch (e) {
    Logger.log('Error getting salary period: ' + e);
    // Fallback to calendar month
    var now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    };
  }
}

/**
 * Recalculate budget spent amounts using salary period
 * Optimized: Can skip if recently calculated
 */
function recalculateBudgetSpent_() {
  try {
    // Performance optimization: Skip if recalculated in last 5 minutes
    var cache = CacheService.getScriptCache();
    var lastRecalc = cache.get('budget_last_recalc');
    var now = new Date().getTime();
    
    if (lastRecalc && (now - Number(lastRecalc)) < 300000) {
      Logger.log('Budget recalc skipped - last run was ' + Math.round((now - Number(lastRecalc))/1000) + 's ago');
      return { success: true, message: 'Skipped - recently calculated', cached: true };
    }
    
    var ss = _ss();
    var budgetSheet = ss.getSheetByName('Budgets');
    var transSheet = ss.getSheetByName('Sheet1');
    
    if (!budgetSheet || !transSheet) {
      return { success: false, error: 'Required sheets not found' };
    }
    
    var period = getSalaryPeriod_();
    var budgets = budgetSheet.getDataRange().getValues();
    var transactions = transSheet.getDataRange().getValues();
    
    // Calculate spent for each category
    for (var i = 1; i < budgets.length; i++) {
      var category = String(budgets[i][0]).toLowerCase();
      var budgeted = Number(budgets[i][1]) || 0;
      var threshold = Number(budgets[i][5]) || 80;
      var spent = 0;
      
      // Sum transactions in this category within salary period
      for (var j = 1; j < transactions.length; j++) {
        var txDate = new Date(transactions[j][1]);
        var txCategory = String(transactions[j][10] || '').toLowerCase();
        var txAmount = Math.abs(Number(transactions[j][8]) || 0);
        
        if (txCategory === category && txDate >= period.start && txDate < period.end) {
          spent += txAmount;
        }
      }
      
      // Update budget sheet
      var row = i + 1;
      budgetSheet.getRange(row, 3).setValue(spent); // Spent
      budgetSheet.getRange(row, 4).setValue(budgeted - spent); // Remaining
      budgetSheet.getRange(row, 5).setValue(budgeted > 0 ? (spent / budgeted * 100) : 0); // % Used
      
      // Status
      var percentUsed = budgeted > 0 ? (spent / budgeted * 100) : 0;
      var status = '';
      if (percentUsed >= 100) status = '🔴 تجاوز';
      else if (percentUsed >= threshold) status = '⚠️ تحذير';
      else if (percentUsed >= threshold * 0.7) status = '🟡 قريب';
      else status = '✅ آمن';
      
      budgetSheet.getRange(row, 7).setValue(status);
    }
    
    // Cache the recalculation time
    cache.put('budget_last_recalc', String(now), 600); // Cache for 10 minutes
    
    return { success: true, message: 'Budget spent recalculated using salary period' };
  } catch (e) {
    Logger.log('Error recalculating budget spent: ' + e);
    return { success: false, error: e.message };
  }
}

