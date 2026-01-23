/**
 * TRANSACTION_MANAGEMENT.js - Complete Transaction CRUD
 * Provides edit and enhanced delete functionality
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
        date: data[0],
        uuid: data[1],
        merchant: data[2],
        category: data[3],
        amount: data[7],
        type: data[10],
        notes: data[12]
      }
    };
  } catch (e) {
    Logger.log('Error getting transaction: ' + e);
    return { success: false, error: e.message };
  }
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
    
    // Get current data
    var currentRow = sheet.getRange(rowId, 1, 1, 13).getValues()[0];
    
    // Update fields if provided
    if (newData.merchant !== undefined) {
      sheet.getRange(rowId, 3).setValue(newData.merchant);
    }
    
    if (newData.category !== undefined) {
      sheet.getRange(rowId, 4).setValue(newData.category);
      
      // Update budget if category changed
      var oldCategory = currentRow[3];
      var oldAmount = Number(currentRow[7]) || 0;
      
      if (oldCategory && oldCategory !== newData.category) {
        // Reverse old budget
        reverseBudgetAmount_(oldCategory, oldAmount);
        // Apply to new budget
        applyBudgetAmount_(newData.category, oldAmount);
      }
    }
    
    if (newData.amount !== undefined) {
      var newAmount = Number(newData.amount);
      var oldAmount = Number(currentRow[7]) || 0;
      var category = currentRow[3];
      
      sheet.getRange(rowId, 8).setValue(newAmount);
      
      // Update budget with difference
      if (category) {
        var diff = newAmount - oldAmount;
        applyBudgetAmount_(category, diff);
      }
    }
    
    if (newData.notes !== undefined) {
      sheet.getRange(rowId, 13).setValue(newData.notes);
    }
    
    return { success: true, message: 'تم تحديث العملية بنجاح' };
  } catch (e) {
    Logger.log('Error updating transaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete transaction by row ID
 */
function SOV1_UI_deleteTransaction_(rowId) {
  try {
    if (!rowId || rowId < 2) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var sheet = _sheet('Sheet1');
    
    if (rowId > sheet.getLastRow()) {
      return { success: false, error: 'العملية غير موجودة' };
    }
    
    // Get transaction data before deleting
    var data = sheet.getRange(rowId, 1, 1, 13).getValues()[0];
    var category = data[3];
    var amount = Number(data[7]) || 0;
    var type = String(data[10] || '');
    var isIncoming = /(وارد|إيداع|استلام|راتب)/i.test(type);
    
    // Reverse budget entry
    if (category && !isIncoming) {
      reverseBudgetAmount_(category, amount);
    }
    
    // Delete row
    sheet.deleteRow(rowId);
    
    return { success: true, message: 'تم حذف العملية بنجاح' };
  } catch (e) {
    Logger.log('Error deleting transaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Helper: Apply amount to budget
 */
function applyBudgetAmount_(category, amount) {
  try {
    var ss = SpreadsheetApp.getActive();
    var budgetSheet = ss.getSheetByName('Budgets');
    
    if (!budgetSheet) return;
    
    var data = budgetSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(category).toLowerCase()) {
        var currentSpent = Number(data[i][2]) || 0;
        var newSpent = currentSpent + amount;
        budgetSheet.getRange(i + 1, 3).setValue(newSpent);
        
        // Update remaining
        var budgeted = Number(data[i][1]) || 0;
        budgetSheet.getRange(i + 1, 4).setValue(budgeted - newSpent);
        break;
      }
    }
  } catch (e) {
    Logger.log('Error applying budget amount: ' + e);
  }
}

/**
 * Helper: Reverse budget amount (for deletions/edits)
 */
function reverseBudgetAmount_(category, amount) {
  try {
    var ss = SpreadsheetApp.getActive();
    var budgetSheet = ss.getSheetByName('Budgets');
    
    if (!budgetSheet) return;
    
    var data = budgetSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(category).toLowerCase()) {
        var currentSpent = Number(data[i][2]) || 0;
        var newSpent = Math.max(0, currentSpent - amount);
        budgetSheet.getRange(i + 1, 3).setValue(newSpent);
        
        // Update remaining
        var budgeted = Number(data[i][1]) || 0;
        budgetSheet.getRange(i + 1, 4).setValue(budgeted - newSpent);
        break;
      }
    }
  } catch (e) {
    Logger.log('Error reversing budget amount: ' + e);
  }
}
