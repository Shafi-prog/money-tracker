
/*
 * FIX_BACKEND_V3.js
 * 
 * Comprehensive backend fix script.
 * 
 * TASKS:
 * 1. Force Update 9765 in Accounts (Aliases + Opening Balance).
 * 2. Fully rebuild Categories with all defaults.
 * 3. Truncate Ingress_Debug (>50 rows).
 * 4. Clean Budgets sheet (remove ALL test/invalid data).
 * 5. Clean Debt_Ledger (remove invalid data).
 * 6. Protect backend sheets from accidental changes.
 * 7. Clean Queue.
 * 8. FIX Dashboard sheet (rebuild with proper structure).
 * 9. Verify Classifier_Map.
 * 
 * SHEET LINKAGE:
 * - Sheet1: Main transactions (UUID as primary key)
 * - Dashboard: Mirror of recent transactions for charts (UUID linked)
 * - Budgets: Category spending (updated via UUID tracking)
 * - Debt_Ledger: Debt tracking for transfers (UUID linked)
 * - Accounts: Balance tracking (updated per transaction)
 */

function FIX_BACKEND_AND_CLEANUP_V3() {
  var log = [];
  function addLog(msg) {
    Logger.log(msg);
    log.push(msg);
  }

  addLog('🚀 Starting Backend Fix V3 (Full)...');

  var ss = SpreadsheetApp.openById(ENV.SHEET_ID);
  
  // ----------------------------------------------------
  // TASK 1: FIX ACCOUNTS SHEET (AlRajhi 9765 specific)
  // ----------------------------------------------------
  try {
    var accSheet = ss.getSheetByName('Accounts');
    if (!accSheet) {
      addLog('❌ Accounts sheet missing!');
    } else {
        // Ensure header 11 exists (Opening Balance)
        if (accSheet.getLastColumn() < 11) {
            accSheet.getRange(1, 11).setValue('الرصيد_الافتتاحي');
            addLog('🔧 Added Opening Balance column.');
        }
        
        var data = accSheet.getDataRange().getValues();

        for (var i = 1; i < data.length; i++) {
            var rowNum = String(data[i][2]).trim(); // Column C
            if (rowNum === '9765') {
                // Direct write to cells for 9765
                var rowIdx = i + 1;
                
                // Name
                accSheet.getRange(rowIdx, 1).setValue('AlrajhiBank-9765');
                // Type
                accSheet.getRange(rowIdx, 2).setValue('بنك');
                // Number (already correct)
                // Bank
                accSheet.getRange(rowIdx, 4).setValue('Alrajhi');
                // IsMine
                accSheet.getRange(rowIdx, 7).setValue('TRUE');
                // IsInternal
                accSheet.getRange(rowIdx, 8).setValue('TRUE');
                // Aliases - CRITICAL for matching
                accSheet.getRange(rowIdx, 9).setValue('Alrajhi-9765, Alrajhi, من9765, الى9765');
                // Notes
                accSheet.getRange(rowIdx, 10).setValue('restored');
                // Opening Balance (keep current or set 0)
                var currentOpening = data[i][10];
                if (!currentOpening && currentOpening !== 0) {
                    accSheet.getRange(rowIdx, 11).setValue(0);
                }
                
                addLog('✅ Fully repaired Account 9765 (all fields).');
                break;
            }
        }
    }
  } catch (e) {
    addLog('❌ Error fixing ACCOUNTS: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 2: FULLY REBUILD CATEGORIES
  // ----------------------------------------------------
  try {
    var catSheet = ss.getSheetByName('Categories');
    if (!catSheet) {
        catSheet = ss.insertSheet('Categories');
    }
    
    // Always rebuild to ensure completeness
    catSheet.clear();
    var defaultCats = [
        ['Category ID', 'Category Name', 'Parent Category', 'Type', 'Icon', 'Color', 'Description', 'Active'],
        ['food', 'طعام', '', 'expense', '🍔', '#FF5722', 'الطعام والمطاعم', true],
        ['groceries', 'بقالة', 'food', 'expense', '🛒', '#4CAF50', 'البقالة والسوبرماركت', true],
        ['restaurants', 'مطاعم ومقاهي', 'food', 'expense', '☕', '#FF9800', 'المطاعم والمقاهي', true],
        ['transport', 'نقل', '', 'expense', '🚗', '#2196F3', 'المواصلات والتنقل', true],
        ['fuel', 'وقود', 'transport', 'expense', '⛽', '#607D8B', 'البنزين والوقود', true],
        ['bills', 'فواتير', '', 'expense', '💡', '#9C27B0', 'الفواتير والخدمات', true],
        ['shopping', 'تسوق', '', 'expense', '🛍️', '#E91E63', 'التسوق والملابس', true],
        ['health', 'صحة', '', 'expense', '🏥', '#F44336', 'الصحة والأدوية', true],
        ['entertainment', 'ترفيه', '', 'expense', '🎮', '#3F51B5', 'الترفيه والتسلية', true],
        ['education', 'تعليم', '', 'expense', '📚', '#009688', 'التعليم والدورات', true],
        ['housing', 'سكن', '', 'expense', '🏠', '#795548', 'الإيجار والسكن', true],
        ['transfers_in', 'حوالات واردة', '', 'income', '📥', '#4CAF50', 'الحوالات الواردة', true],
        ['transfers_out', 'حوالات صادرة', '', 'expense', '📤', '#F44336', 'الحوالات الصادرة', true],
        ['salary', 'راتب', '', 'income', '💰', '#4CAF50', 'الراتب والدخل', true],
        ['transfer', 'تحويل', '', 'transfer', '🔄', '#9E9E9E', 'تحويل بين الحسابات', true],
        ['other', 'أخرى', '', 'expense', '📝', '#9E9E9E', 'مصروفات أخرى', true],
        ['income_other', 'دخل آخر', '', 'income', '💵', '#4CAF50', 'دخل آخر', true]
    ];
    catSheet.getRange(1, 1, defaultCats.length, 8).setValues(defaultCats);
    catSheet.setFrozenRows(1);
    catSheet.getRange('A1:H1').setFontWeight('bold').setBackground('#2196F3').setFontColor('#FFFFFF');
    addLog('✅ Rebuilt Categories with ' + (defaultCats.length - 1) + ' categories.');
    
  } catch (e) {
    addLog('❌ Error rebuilding Categories: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 3: TRUNCATE INGRESS_DEBUG
  // ----------------------------------------------------
  try {
    var debugSheet = ss.getSheetByName('Ingress_Debug');
    if (debugSheet) {
        var lr = debugSheet.getLastRow();
        if (lr > 50) {
            var rowsToDelete = lr - 50;
            debugSheet.deleteRows(2, rowsToDelete);
            addLog('🧹 Truncated Ingress_Debug (Removed ' + rowsToDelete + ' rows).');
        } else {
            addLog('ℹ️ Ingress_Debug OK (' + lr + ' rows).');
        }
    }
  } catch (e) {
      addLog('❌ Error cleaning Ingress_Debug: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 4: CLEAN BUDGETS SHEET (Remove test + invalid)
  // ----------------------------------------------------
  try {
      var bugSheet = ss.getSheetByName('Budgets');
      if (bugSheet) {
          var data = bugSheet.getDataRange().getValues();
          var rowsToDelete = [];
          
          // Valid budget categories (match new Categories)
          var validCats = ['طعام', 'نقل', 'فواتير', 'تسوق', 'سكن', 'ترفيه', 'صحة', 'تعليم', 'راتب', 'تحويل', 'أخرى', 'بقالة', 'مطاعم ومقاهي', 'وقود', 'حوالات واردة', 'حوالات صادرة', 'دخل آخر'];
          
          // Iterate bottom up
          for (var i = data.length - 1; i >= 1; i--) {
              var catName = String(data[i][0]).trim();
              var catLower = catName.toLowerCase();
              
              // Delete if: test data OR not in valid list
              var isTest = catLower.includes('اختبار') || catLower.includes('dummy') || catLower.includes('حذف') || catLower.includes('بحث') || catLower.includes('test');
              var isInvalid = !validCats.some(function(v) { return v.toLowerCase() === catLower; });
              
              if (isTest || (isInvalid && catName !== '')) {
                  rowsToDelete.push(i + 1);
              }
          }
          
          // Delete rows (already sorted desc)
          rowsToDelete.forEach(function(r) {
             bugSheet.deleteRow(r);
          });
          
          addLog('🧹 Cleaned Budgets: removed ' + rowsToDelete.length + ' invalid/test rows.');
      }
  } catch (e) {
      addLog('❌ Error cleaning Budgets: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 5: FIX & CLEAN DEBT_LEDGER
  // ----------------------------------------------------
  try {
      var debtSheet = ss.getSheetByName('Debt_Ledger');
      if (!debtSheet) {
          debtSheet = ss.insertSheet('Debt_Ledger');
      }
      
      // Fix headers first - based on Integrity.js SCHEMA
      // ['UUID', 'Date', 'Party', 'Debit', 'Credit', 'Balance', 'Description', 'ParentUUID']
      var expectedHeaders = ['UUID', 'التاريخ', 'الطرف', 'مدين (+)', 'دائن (-)', 'الرصيد', 'الوصف', 'ParentUUID'];
      
      // Clear and rebuild with correct structure
      debtSheet.clear();
      debtSheet.appendRow(expectedHeaders);
      debtSheet.setFrozenRows(1);
      debtSheet.getRange('A1:H1').setFontWeight('bold').setBackground('#FF5722').setFontColor('#FFFFFF');
      
      // Set RTL for Arabic
      debtSheet.setRightToLeft(true);
      
      addLog('✅ Rebuilt Debt_Ledger with correct 8-column schema.');
  } catch (e) {
      addLog('❌ Error fixing Debt_Ledger: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 6: CLEAN QUEUE
  // ----------------------------------------------------
  try {
      var qSheet = ss.getSheetByName('Queue');
      if (qSheet) {
          var lr = qSheet.getLastRow();
          if (lr > 1) {
              qSheet.deleteRows(2, lr - 1);
              addLog('🧹 Cleared Queue sheet.');
          } else {
              addLog('ℹ️ Queue already empty.');
          }
      }
  } catch (e) {
      addLog('❌ Error cleaning Queue: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 7: FIX DASHBOARD SHEET (Rebuild from Sheet1)
  // ----------------------------------------------------
  try {
      var dashSheet = ss.getSheetByName('Dashboard');
      if (!dashSheet) {
          dashSheet = ss.insertSheet('Dashboard');
      }
      
      // Clear and rebuild Dashboard from Sheet1
      dashSheet.clear();
      
      // Headers: UUID, Date, Merchant, Amount, Category, Source
      dashSheet.appendRow(['UUID', 'التاريخ', 'التاجر', 'المبلغ', 'التصنيف', 'المصدر']);
      dashSheet.setFrozenRows(1);
      dashSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4CAF50').setFontColor('#FFFFFF');
      
      // Copy recent transactions from Sheet1 (last 100)
      var s1 = ss.getSheetByName('Sheet1');
      if (s1 && s1.getLastRow() > 1) {
          var txData = s1.getDataRange().getValues();
          var dashRows = [];
          
          // Start from row 1 (skip header), get last 100 transactions
          var startIdx = Math.max(1, txData.length - 100);
          for (var i = startIdx; i < txData.length; i++) {
              var uuid = txData[i][0];       // Column A
              var date = txData[i][1];       // Column B
              var merchant = txData[i][9];   // Column J
              var amount = txData[i][8];     // Column I
              var category = txData[i][10];  // Column K (THIS IS THE FIX - use category not UUID)
              var source = txData[i][5];     // Column F
              
              if (uuid && String(uuid).startsWith('TXN-')) {
                  dashRows.push([uuid, date, merchant, amount, category, source]);
              }
          }
          
          if (dashRows.length > 0) {
              dashSheet.getRange(2, 1, dashRows.length, 6).setValues(dashRows);
          }
          
          addLog('✅ Rebuilt Dashboard with ' + dashRows.length + ' transactions (Categories fixed).');
      } else {
          addLog('⚠️ Sheet1 is empty - Dashboard has headers only.');
      }
      
  } catch (e) {
      addLog('❌ Error fixing Dashboard: ' + e.message);
  }

  // ----------------------------------------------------
  // TASK 8: VERIFY CLASSIFIER_MAP
  // ----------------------------------------------------
  try {
      var cmSheet = ss.getSheetByName('Classifier_Map');
      if (cmSheet) {
          var lr = cmSheet.getLastRow();
          addLog('ℹ️ Classifier_Map has ' + lr + ' rows.');
          // Optionally clean test entries
          if (lr > 1) {
              var data = cmSheet.getDataRange().getValues();
              var rowsToDelete = [];
              for (var i = data.length - 1; i >= 1; i--) {
                  var pattern = String(data[i][0] || '').toLowerCase();
                  if (pattern.includes('test') || pattern.includes('اختبار') || pattern.includes('dummy')) {
                      rowsToDelete.push(i + 1);
                  }
              }
              rowsToDelete.forEach(function(r) { cmSheet.deleteRow(r); });
              if (rowsToDelete.length > 0) addLog('🧹 Removed ' + rowsToDelete.length + ' test entries from Classifier_Map.');
          }
      } else {
          addLog('⚠️ Classifier_Map sheet not found.');
      }
  } catch (e) {
      addLog('❌ Error checking Classifier_Map: ' + e.message);
  }
  
  // ----------------------------------------------------
  // TASK 9: PROTECT BACKEND SHEETS
  // ----------------------------------------------------
  try {
      var backendSheets = ['Categories', 'Classifier_Map', 'Queue', 'Ingress_Debug', 'AutoTestResults'];
      backendSheets.forEach(function(sheetName) {
          var sh = ss.getSheetByName(sheetName);
          if (sh) {
              // Remove existing protections first
              var protections = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
              protections.forEach(function(p) { p.remove(); });
              
              // Add new protection
              var protection = sh.protect().setDescription('Backend: ' + sheetName);
              protection.setWarningOnly(true); // Allow edits but show warning
          }
      });
      addLog('🔒 Protected backend sheets (warning mode).');
  } catch (e) {
      addLog('⚠️ Could not protect sheets: ' + e.message);
  }

  addLog('✅ Backend Fix V3 Complete.');
  return { log: log };
}
