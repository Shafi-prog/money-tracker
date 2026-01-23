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
    
    var ss = SpreadsheetApp.getActive();
    var sheet = ss.getSheetByName('Budgets');
    
    if (!sheet) {
      sheet = ss.insertSheet('Budgets');
      sheet.appendRow(['Category', 'Budgeted', 'Spent', 'Remaining', '% Used', 'Alert Threshold', 'Status', 'Auto-Budget', 'Period']);
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
      sheet.appendRow([category, Number(limit), 0, Number(limit), 0, 80, '', true, 'monthly']);
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
    
    var ss = SpreadsheetApp.getActive();
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
    
    var ss = SpreadsheetApp.getActive();
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
