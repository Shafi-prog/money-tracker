
/*
 * FIX_BACKEND.js
 * 
 * Auto-generated script to fix specific backend issues requested by the user.
 * 
 * TASKS:
 * 1. Update Accounts sheet (Fix 9765 info).
 * 2. Sanitize AutoTestResults.
 * 3. Verify and fix Categories sheet structure (matching CategoryManager.js schema).
 * 4. Verify Dashboard sheet access/existence.
 */

function FIX_BACKEND_AND_CLEANUP_V2() {
  var log = [];
  function addLog(msg) {
    Logger.log(msg);
    log.push(msg);
  }

  addLog('🚀 Starting Backend Fix & Cleanup...');

  var ss = SpreadsheetApp.openById(ENV.SHEET_ID);
  
  // ----------------------------------------------------
  // TASK 1: FIX ACCOUNTS SHEET (AlRajhi 9765)
  // ----------------------------------------------------
  try {
    var accSheet = ss.getSheetByName('Accounts');
    if (!accSheet) {
      accSheet = ss.insertSheet('Accounts');
      addLog('⚠️ Created new Accounts sheet.');
    }

    // Ensure headers
    var headers = accSheet.getRange(1, 1, 1, 10).getValues()[0];
    var expectedHeaders = ['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات'];
    
    // Simple header fix if empty
    if (accSheet.getLastRow() === 0) {
      accSheet.appendRow(expectedHeaders);
      accSheet.setFrozenRows(1);
    }

    var data = accSheet.getDataRange().getValues();
    var foundStart = false;
    
    // Look for 9765
    for (var i = 1; i < data.length; i++) {
        var rowNum = data[i][2]; // Column C is 'الرقم'
        if (String(rowNum).trim() === '9765') {
            // Found it, update missing info
            var range = accSheet.getRange(i + 1, 1, 1, 10);
            var currentRow = data[i];
            var newRow = [...currentRow];
            
            // Name: الراجحي-9765, Type: بنك, Bank: Alrajhi
            if (!newRow[0]) newRow[0] = 'الراجحي-9765';
            if (!newRow[1]) newRow[1] = 'بنك';
            if (!newRow[3]) newRow[3] = 'Alrajhi';
            // IsMine: TRUE, IsInternal: TRUE (Critical for transfers)
            if (String(newRow[6]) === '') newRow[6] = 'TRUE'; 
            if (String(newRow[7]) === '') newRow[7] = 'TRUE'; 
            
            // Force 10 columns
            newRow = newRow.slice(0, 10);
            while (newRow.length < 10) newRow.push('');

            range.setValues([newRow]);
            addLog('✅ Updated Account 9765 details.');
            foundStart = true;
            break;
        }
    }

    if (!foundStart) {
        // If 9765 doesn't exist, append it
        accSheet.appendRow(['الراجحي-9765', 'بنك', '9765', 'Alrajhi', 0, new Date(), 'TRUE', 'TRUE', 'Alrajhi-9765, Alrajhi', 'Added by Fix Script']);
        addLog('✅ Created missing Account 9765.');
    }

  } catch (e) {
    addLog('❌ Error fixing ACCOUNTS: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 2: CLEAN DATA IN AutoTestResults
  // ----------------------------------------------------
  try {
    var resultSheet = ss.getSheetByName('AutoTestResults');
    if (resultSheet) {
      var lastRow = resultSheet.getLastRow();
      if (lastRow > 1) {
        resultSheet.deleteRows(2, lastRow - 1);
        addLog('🧹 Processed AutoTestResults (Cleared old data).');
      } else {
        addLog('ℹ️ AutoTestResults is already clean.');
      }
    } else {
       addLog('ℹ️ AutoTestResults sheet not found (skipping).');
    }
  } catch (e) {
    addLog('❌ Error cleaning AutoTestResults: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 3: FIX CATEGORIES SHEET
  // ----------------------------------------------------
  try {
    var catSheet = ss.getSheetByName('Categories');
    if (!catSheet) {
       catSheet = ss.insertSheet('Categories');
       addLog('⚠️ Created new Categories sheet.');
    }

    // Check header integrity based on CategoryManager.js schema:
    // ['Category ID', 'Category Name', 'Parent Category', 'Type', 'Icon', 'Color', 'Description', 'Active']
    var lastCol = catSheet.getLastColumn();
    var firstRow = (lastCol > 0) ? catSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    // If empty or headers mismatch significantly, rebuild headers
    if (lastCol < 2 || firstRow[0] !== 'Category ID') {
        catSheet.clear();
        catSheet.appendRow(['Category ID', 'Category Name', 'Parent Category', 'Type', 'Icon', 'Color', 'Description', 'Active']);
        catSheet.setFrozenRows(1);
        catSheet.getRange('A1:H1').setFontWeight('bold').setBackground('#2196F3').setFontColor('#FFFFFF');
        
        // Add minimal default if absolutely empty
        catSheet.appendRow(['food', 'طعام', '', 'expense', '🍔', '#FF5722', 'Default Category', true]);
        
        addLog('🔧 Rebuilt Categories sheet headers (Schema v2).');
    } else {
        addLog('✅ Categories sheet verified (Schema v2).');
    }
    
  } catch (e) {
    addLog('❌ Error fixing Categories: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 4: CHECK DASHBOARD SHEET
  // ----------------------------------------------------
  try {
     var dashSheet = ss.getSheetByName('Dashboard');
     if (dashSheet) {
         addLog('ℹ️ "Dashboard" sheet exists.');
     } else {
         addLog('ℹ️ "Dashboard" sheet does not exist (Note: Dashboard is primarily HTML-based).');
     }
  } catch (e) {
      addLog('❌ Error checking Dashboard: ' + e.message);
  }

  return { log: log };
}
