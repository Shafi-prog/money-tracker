
/********** WebUI.gs — شافي المطيري (متابعة المصاريف المالية) **********/

/**
 * ⚠️ REQUIRED: Google Apps Script web app entry point
 * This function MUST exist for the web app to work
 */
function doGet(e) {
  return SOV1_UI_doGet_(e);
}

/**
 * Handle POST requests (allows larger payloads for CLI)
 * Acts as a router between CLI commands and Ingress (SMS/Telegram)
 */
function doPost(e) {
  // 1. CLI Backdoor (Debug/Deploy tools)
  if (e && e.parameter && e.parameter.mode === 'cli') {
    return SOV1_UI_doGet_(e);
  }
  
  // 2. Ingress (SMS / Telegram Webhook)
  if (typeof SOV1_INGRESS_doPost_ === 'function') {
    return SOV1_INGRESS_doPost_(e);
  }
  
  // 3. Fallback
  return ContentService.createTextOutput("Error: No handler found").setMimeType(ContentService.MimeType.TEXT);
}

function SOV1_UI_doGet_(e) {
  // --- CLI BACKDOOR (DEBUGGING) ---
  if (e && e.parameter && e.parameter.mode === 'cli') {
    var cmd = e.parameter.cmd;
    var result = "No command provided.";
    try {
      if (cmd === 'DEBUG_SHEETS_INFO') {
        result = (typeof DEBUG_SHEETS_INFO === 'function') ? JSON.stringify(DEBUG_SHEETS_INFO()) : "Function DEBUG_SHEETS_INFO not found.";
      } else if (cmd === 'DEBUG_TELEGRAM_STATUS') {
         result = (typeof DEBUG_TELEGRAM_STATUS === 'function') ? JSON.stringify(DEBUG_TELEGRAM_STATUS()) : "Function DEBUG_TELEGRAM_STATUS not found.";
      } else if (cmd === 'RUN_MASTER_TESTS') {
         result = (typeof RUN_MASTER_TESTS === 'function') ? JSON.stringify(RUN_MASTER_TESTS()) : "Function RUN_MASTER_TESTS not found.";
      } else if (cmd === 'RUN_FULL_SYSTEM_AUDIT') {
         result = (typeof RUN_FULL_SYSTEM_AUDIT === 'function') ? JSON.stringify(RUN_FULL_SYSTEM_AUDIT()) : "Function RUN_FULL_SYSTEM_AUDIT not found.";
      } else if (cmd === 'RUN_AUTOMATED_CHECKLIST') {
         result = (typeof RUN_AUTOMATED_CHECKLIST === 'function') ? JSON.stringify(RUN_AUTOMATED_CHECKLIST()) : "Function RUN_AUTOMATED_CHECKLIST not found.";
      } else if (cmd === 'ENSURE_ALL_SHEETS') {
         result = (typeof ENSURE_ALL_SHEETS === 'function') ? JSON.stringify(ENSURE_ALL_SHEETS()) : "Function ENSURE_ALL_SHEETS not found.";
      } else if (cmd === 'CLEAN_CATEGORIES_SHEET') {
         result = (typeof CLEAN_CATEGORIES_SHEET === 'function') ? JSON.stringify(CLEAN_CATEGORIES_SHEET()) : "Function CLEAN_CATEGORIES_SHEET not found.";
      } else if (cmd === 'FIX_BACKEND_AND_CLEANUP') {
         // Temporarily calling V3
         result = (typeof FIX_BACKEND_AND_CLEANUP_V3 === 'function') ? JSON.stringify(FIX_BACKEND_AND_CLEANUP_V3()) : "Function FIX_BACKEND_AND_CLEANUP_V3 not found.";
      } else if (cmd === 'SETUP_BOT_COMMANDS') {
         result = (typeof SETUP_BOT_COMMANDS === 'function') ? JSON.stringify(SETUP_BOT_COMMANDS()) : "Function SETUP_BOT_COMMANDS not found.";
      } else if (cmd === 'CLEAN_SYSTEM_SHEETS') {
         result = (typeof CLEAN_SYSTEM_SHEETS === 'function') ? JSON.stringify(CLEAN_SYSTEM_SHEETS()) : "Function CLEAN_SYSTEM_SHEETS not found.";
      } else if (cmd === 'WIPE_ALL_DATA') {
        result = (typeof SOV1_UI_wipeAllData === 'function') ? JSON.stringify(SOV1_UI_wipeAllData()) : "Function SOV1_UI_wipeAllData not found.";
      } else if (cmd === 'RESTORE_DEFAULTS') {
        result = (typeof SOV1_UI_restoreDefaults === 'function') ? JSON.stringify(SOV1_UI_restoreDefaults()) : "Function SOV1_UI_restoreDefaults not found.";
      } else if (cmd === 'CLEANUP_TX_CATEGORIES') {
        result = (typeof cleanupTransactionCategories_ === 'function') ? JSON.stringify(cleanupTransactionCategories_()) : "Function cleanupTransactionCategories_ not found.";
      } else if (cmd === 'REPAIR_TX_MERCHANTS') {
        result = (typeof repairMerchantsFromRaw_ === 'function') ? JSON.stringify(repairMerchantsFromRaw_()) : "Function repairMerchantsFromRaw_ not found.";
      } else if (cmd === 'PARSE_AI') {
        try {
          var smsText = e.parameter.smsText ? decodeURIComponent(e.parameter.smsText) : '';
          result = (typeof SOV1_UI_parseWithAI === 'function') ? JSON.stringify(SOV1_UI_parseWithAI(smsText)) : "Function SOV1_UI_parseWithAI not found.";
        } catch (ex) {
          result = "Error executing PARSE_AI: " + ex.message;
        }
      } else if (cmd === 'RUN_MASTER_VERIFICATION') {
         result = (typeof RUN_MASTER_VERIFICATION === 'function') ? JSON.stringify(RUN_MASTER_VERIFICATION()) : "Function RUN_MASTER_VERIFICATION not found.";
      } else if (cmd === 'RUN_COMPLETE_SYSTEM_TEST') {
         if (typeof RUN_COMPLETE_SYSTEM_TEST === 'function') {
           try {
             var r = RUN_COMPLETE_SYSTEM_TEST();
             result = (typeof r === 'undefined') ? "Started RUN_COMPLETE_SYSTEM_TEST (check Executions/Logs in Apps Script)" : JSON.stringify(r);
           } catch (ex) {
             result = "Error executing RUN_COMPLETE_SYSTEM_TEST: " + ex.message;
           }
         } else {
           result = "Function RUN_COMPLETE_SYSTEM_TEST not found.";
         }
      } else if (cmd === 'SETUP_TELEGRAM_WEBHOOK') {
         var newUrl = e.parameter.url;
         if (newUrl) {
           PropertiesService.getScriptProperties().setProperty('WEBAPP_URL', newUrl);
           if (typeof ENV !== 'undefined') {
             ENV.WEBAPP_URL = newUrl;
             ENV.WEBAPP_URL_DIRECT = newUrl;
           }
         }
         if (typeof setWebhook_DIRECT_no302 === 'function') {
           setWebhook_DIRECT_no302();
           result = "Webhook setup complete";
         } else {
           result = "Webhook setup function not found";
         }
      } else if (cmd === 'SETUP_QUEUE') {
         if (typeof SOV1_setupQueueTrigger_ === 'function') {
           SOV1_setupQueueTrigger_();
           result = "Trigger Setup Complete";
         } else {
           result = "Function SOV1_setupQueueTrigger_ not found.";
         }
      } else if (cmd === 'SETUP_ALL_TRIGGERS') {
         if (typeof setupTimeTriggers === 'function') {
           setupTimeTriggers();
           result = "All System Triggers Setup Complete (Queue + Reports)";
         } else {
           result = "Function setupTimeTriggers not found.";
         }
      } else if (cmd === 'DELETE_QUEUE_TRIGGER' || cmd === 'REMOVE_QUEUE_TRIGGER') {
         try {
           if (typeof SOV1_deleteQueueTrigger_ === 'function') {
             var deleted = SOV1_deleteQueueTrigger_();
             result = JSON.stringify({ success: true, deleted: deleted });
           } else {
             result = JSON.stringify({ success: false, error: 'SOV1_deleteQueueTrigger_ not found' });
           }
         } catch (e) {
           result = JSON.stringify({ success: false, error: e.message });
         }
      } else if (cmd === 'REPROCESS_TRANSACTIONS') {
         if (typeof SOV1_REPROCESS_LAST_TRANSACTIONS === 'function') {
           var count = e.parameter.count || 50;
           result = JSON.stringify(SOV1_REPROCESS_LAST_TRANSACTIONS(count));
         } else {
           result = "Function SOV1_REPROCESS_LAST_TRANSACTIONS not found.";
         }
      } else if (cmd === 'REPROCESS_TRANSACTIONS') {
         if (typeof SOV1_REPROCESS_LAST_TRANSACTIONS === 'function') {
           var count = e.parameter.count || 20;
           result = JSON.stringify(SOV1_REPROCESS_LAST_TRANSACTIONS(count));
         } else {
           result = "Function SOV1_REPROCESS_LAST_TRANSACTIONS not found.";
         }  
      } else if (cmd === 'TEST_SEND_BALANCES') {
         var cid = e.parameter.chatId; 
         if (!cid && typeof getHubChatId_ === 'function') cid = getHubChatId_();
         if (typeof sendAccountsBalanceReport_ === 'function') {
             sendAccountsBalanceReport_(cid);
             result = JSON.stringify({ sent: true, chatId: cid });
         } else {
             result = JSON.stringify({ error: "sendAccountsBalanceReport_ not found" });
         }
      } else if (cmd === 'TEST_SEND_BUDGETS') {
         var cid = e.parameter.chatId; 
         if (!cid && typeof getHubChatId_ === 'function') cid = getHubChatId_();
         if (typeof sendBudgetsSnapshotToTelegram_ === 'function') {
             sendBudgetsSnapshotToTelegram_(cid);
             result = JSON.stringify({ sent: true, chatId: cid });
         } else {
             result = JSON.stringify({ error: "sendBudgetsSnapshotToTelegram_ not found" });
         }
      } else if (cmd === 'SIMULATE_COMMAND') {
         var cid = e.parameter.chatId; 
         if (!cid && typeof getHubChatId_ === 'function') cid = getHubChatId_();
         var text = e.parameter.text || '/start';
         
         if (cid && typeof handleTelegramCommand_ === 'function') {
             var callRes = handleTelegramCommand_(cid, text, {}); // Now captures return value
             result = JSON.stringify({
                command: text,
                chatId: cid,
                output: callRes
             });
         } else {
             result = "Failed to simulate. ChatID: " + cid + ", Func: " + (typeof handleTelegramCommand_);
         }
      } else if (cmd === 'DEDUP_ACCOUNTS') {
         // Create a dedicated helper to merge duplicate rows in Accounts sheet
         var sh = _sheet('Accounts');
         var data = sh.getDataRange().getValues();
         if (data.length < 2) {
             result = "No accounts data found.";
         } else {
             var headers = data[0];
             var seen = {};
             var toDelete = [];
             var log = [];
             
             // Iterate data rows (skip header)
             // We go from bottom to top to keep the LATEST updated row if we decide to keep one? 
             // Or top to bottom to keep the first?
             // Actually, the issue is that "Alrajhi 976" appeared twice. One with 2022, one with 3785.
             // This suggests we want to KEEP both if they are distinct sub-accounts, but user said "Alrajhi 976" (singular).
             // But if they have the same "Number" (column 2, index 2), they are technically duplicates in our system unless we support sub-accounts.
             // The system indexes by Last4 digit. If 2 key collisions occur, one overwrites.
             // However, balances are calculated per row.
             // Strategy: Find rows with IDENTICAL Account Number. Merge them?
             // Actually, let's just REPORT them first, or merge safely (sum balances).
             
             for (var i = 1; i < data.length; i++) {
                 var num = String(data[i][2]); // Number column
                 var name = String(data[i][0]);
                 if (!num || num === 'undefined') continue;
                 
                 var key = num + "|" + name; // Composite key? Or just Number?
                 // Let's use Number as primary key for uniqueness test
                 var uKey = num; 
                 
                 if (seen[uKey]) {
                     // Found duplicate!
                     var originalIdx = seen[uKey];
                     var originalBal = Number(data[originalIdx][4] || 0); // Balance Col 4
                     var dupBal = Number(data[i][4] || 0);
                     
                     // Merge balance into original
                     data[originalIdx][4] = originalBal + dupBal;
                     log.push("Merged duplicate for " + uKey + ": Row " + (i+1) + " (" + dupBal + ") into Row " + (originalIdx+1));
                     toDelete.push(i + 1); // Store 1-based Row Index
                 } else {
                     seen[uKey] = i;
                 }
             }
             
             // Perform updates
             // 1. Update balances for preserved rows
             // 2. Delete duplicate rows (in reverse order to preserve indices)
             
             if (toDelete.length > 0) {
                 // Write back the merged balances FIRST
                 // Better: just write the whole array back? No, delete rows shifts things.
                 // Let's just update the specific cells of the 'keepers' first.
                 Object.keys(seen).forEach(function(k) {
                     var idx = seen[k];
                     var bal = data[idx][4];
                     sh.getRange(idx + 1, 5).setValue(bal); // Col 5 is Balance
                 });
                 
                 // Sort descending
                 toDelete.sort(function(a, b) { return b - a; });
                 toDelete.forEach(function(r) {
                     sh.deleteRow(r);
                 });
                 result = "Deduplicated " + toDelete.length + " accounts.\n" + log.join("\n");
             } else {
                result = "No exact duplicates found based on Account Number.";
             }
         }

      } else if (cmd === 'DEBUG_SHEETS_LIST') {
         var ss = SpreadsheetApp.getActiveSpreadsheet();
         var sheets = ss.getSheets();
         var names = sheets.map(function(s) { return s.getName() + " (" + s.getLastRow() + " rows)"; });
         result = JSON.stringify(names);

      } else if (cmd === 'FIX_ACCOUNT_BALANCE') {
         var accNum = e.parameter.num;
         var newBal = e.parameter.bal;
         if (typeof setBalance_ === 'function') {
             setBalance_(accNum, newBal);
             result = "Set balance of " + accNum + " to " + newBal;
         } else {
             result = "setBalance_ not found";
         }

      } else if (cmd === 'MERGE_ACCOUNTS') {
         var keepNum = String(e.parameter.keep).trim();
         var mergeNum = String(e.parameter.merge).trim();
         
         if (!keepNum || !mergeNum) {
             result = "Missing keep or merge parameters";
         } else {
             var sh = _sheet('Accounts');
             var data = sh.getDataRange().getValues();
             var keepIdx = -1;
             var mergeIdx = -1;
             
             for (var i = 1; i < data.length; i++) {
                 var rNum = String(data[i][2]);
                 if (rNum === keepNum) keepIdx = i;
                 if (rNum === mergeNum) mergeIdx = i;
             }
             
             if (keepIdx === -1 || mergeIdx === -1) {
                 result = "Could not find both accounts. Keep:" + keepIdx + " Merge:" + mergeIdx;
             } else {
                 // 1. Add alias
                 var currentAliases = String(data[keepIdx][8] || '');
                 // Check if already in alias to avoid spam
                 if (currentAliases.indexOf(mergeNum) === -1) {
                    if (currentAliases) currentAliases += ',';
                    currentAliases += mergeNum;
                    sh.getRange(keepIdx + 1, 9).setValue(currentAliases); // Col 9 is Aliases (Index 8)
                 }
                 
                 // 2. Delete merge row
                 sh.deleteRow(mergeIdx + 1);
                 
                 result = "Merged " + mergeNum + " into " + keepNum + ". Alias added.";
             }
         }

      } else if (cmd === 'ADD_ACCOUNT') {
         var sh = _sheet('Accounts');
         var name = e.parameter.name || '';
         var type = e.parameter.type || 'بنك';
         var num = e.parameter.num || '';
         var bank = e.parameter.bank || '';
         var bal = Number(e.parameter.bal) || 0;
         var isMine = e.parameter.isMine !== 'false';
         
         sh.appendRow([name, type, num, bank, bal, new Date(), isMine ? 'TRUE' : 'FALSE', '', '', '', 0]);
         result = "Added account: " + name + " (" + num + ") with balance " + bal;

      } else if (cmd === 'REMOVE_ALIAS') {
         var sh = _sheet('Accounts');
         var data = sh.getDataRange().getValues();
         var accNum = e.parameter.num;
         var aliasToRemove = e.parameter.alias;
         
         for (var i = 1; i < data.length; i++) {
             if (String(data[i][2]) === accNum) {
                 var aliases = String(data[i][8] || '');
                 var aliasList = aliases.split(',').filter(function(a) { return a.trim() !== aliasToRemove; });
                 sh.getRange(i + 1, 9).setValue(aliasList.join(','));
                 result = "Removed alias " + aliasToRemove + " from " + accNum;
                 break;
             }
         }
         if (!result) result = "Account not found: " + accNum;

      } else if (cmd === 'DEBUG_INGRESS_LOGS') {
         var sh = _sheet('Ingress_Debug');
         var data = sh.getDataRange().getValues();
         var logs = [];
         // Get last 20 entries
         for (var i = Math.max(1, data.length - 20); i < data.length; i++) {
           logs.push({
             row: i + 1,
             timestamp: data[i][0],
             level: data[i][1],
             function: data[i][2],
             details: data[i][3],
             message: data[i][4]
           });
         }
         result = JSON.stringify(logs);

      } else if (cmd === 'DEBUG_QUEUE_STATUS') {
         try {
           var sh = _sheet('Ingress_Queue');
           var data = sh.getDataRange().getValues();
           var queue = [];
           // Get last 20 entries
           for (var i = Math.max(1, data.length - 20); i < data.length; i++) {
             queue.push({
               row: i + 1,
               timestamp: data[i][0],
               source: data[i][1],
               text: String(data[i][2] || '').slice(0, 100),
               status: data[i][4],
               fingerprint: data[i][5]
             });
           }
           result = JSON.stringify({ success: true, queue: queue });
         } catch (e) {
           result = JSON.stringify({ success: false, error: e.message });
         }

      } else if (cmd === 'PROCESS_QUEUE') {
         try {
           if (typeof SOV1_processQueueBatch_ === 'function') {
             SOV1_processQueueBatch_();
             result = JSON.stringify({ success: true, message: 'Queue processing triggered' });
           } else {
             result = JSON.stringify({ success: false, error: 'SOV1_processQueueBatch_ function not found' });
           }
         } catch (e) {
           result = JSON.stringify({ success: false, error: e.message });
         }

      } else if (cmd === 'DEBUG_SHEET_STRUCTURE') {
         var ss = SpreadsheetApp.getActiveSpreadsheet();
         var sheets = ss.getSheets();
         var structure = [];
         
         sheets.forEach(function(s) {
           var name = s.getName();
           var lastCol = s.getLastColumn();
           var headers = [];
           if (lastCol > 0) {
             headers = s.getRange(1, 1, 1, lastCol).getValues()[0];
           }
           structure.push({
             name: name,
             headers: headers
           });
         });
         
         result = JSON.stringify(structure);

      } else if (cmd === 'FIX_CONFIG_SHEET') {
         var ss = SpreadsheetApp.getActiveSpreadsheet();
         var config = ss.getSheetByName('Config');
         if (!config) {
             config = ss.insertSheet('Config');
         }
         
         // Force set headers to A1:K1
         config.getRange('A1:K1').setValues([
             ['Status', 'Name', 'Email', 'Currency', 'Language', 'Salary_Day', 'Notifications', 'Auto_Apply_Rules', 'Telegram_Notifications', 'Budget_Alerts', 'Save_Temp_Codes']
         ]);
         config.getRange('A1:K1').setFontWeight('bold');
         config.setFrozenRows(1);
         
         result = JSON.stringify({
             success: true, 
             message: "Config sheet headers fixed. Added 'Save_Temp_Codes' to column K."
         });

      } else if (cmd === 'DEBUG_UI_SYNC') {
         var syncResult = {};
         
         try {
           syncResult.categories = (typeof SOV1_UI_getCategories === 'function') ? SOV1_UI_getCategories('OPEN') : "MISSING";
         } catch(e) { syncResult.categories = "ERROR: " + e.message; }
         
         try {
           syncResult.settings = (typeof SOV1_UI_getSettings === 'function') ? SOV1_UI_getSettings() : "MISSING";
         } catch(e) { syncResult.settings = "ERROR: " + e.message; }
         
         try {
           syncResult.fastDashboard = (typeof SOV1_FAST_getDashboard === 'function') ? SOV1_FAST_getDashboard() : "MISSING";
         } catch(e) { syncResult.fastDashboard = "ERROR: " + e.message; }
         
         result = JSON.stringify(syncResult);

      } else if (cmd === 'DEBUG_ACCOUNTS_DUMP') {
         var sh = _sheet('Accounts');
         var data = sh.getDataRange().getValues();
         var accounts = [];
         for (var i = 1; i < data.length; i++) {
           accounts.push({
             row: i + 1,
             name: String(data[i][0]),
             number: String(data[i][2]),
             bank: String(data[i][3]),
             balance: data[i][4]
           });
         }
         result = JSON.stringify(accounts);

      } else if (cmd === 'GET_RAW_SMS_FOR_DEBUG') {
         var sheet = _sheet('Sheet1');
         var data = sheet.getDataRange().getValues();
         var samples = [];
         // Get last 10
         for (var i = Math.max(1, data.length - 10); i < data.length; i++) {
            samples.push({
               row: i+1,
               merchant: data[i][9],
               category: data[i][10],
               raw: data[i][12]
            });
         }
         result = JSON.stringify(samples);
      } else if (cmd === 'UPDATE_CATEGORIES') {
         if (typeof ensureCategoriesSheet_ === 'function') {
           var sheet = ensureCategoriesSheet_();
           var data = sheet.getDataRange().getValues();
           var existing = [];
           for (var i=1; i<data.length; i++) existing.push(data[i][1]); // Name column
           
           var needed = ['بقالة', 'وقود', 'مشتريات عامة', 'نقل', 'تسوق', 'طعام', 'فواتير', 'صحة'];
           var added = 0;
           
           needed.forEach(function(n) {
             if (existing.indexOf(n) === -1) {
               sheet.appendRow([n.toLowerCase(), n, '', 'expense', '✨', '#888888', 'Category added via Update', true]);
               added++;
             }
           });
           
           result = JSON.stringify({ success: true, added: added, total: data.length + added });
         } else {
           result = "Function ensureCategoriesSheet_ not found.";
         }
      } else if (cmd === 'AUDIT_SYSTEM') {
         if (typeof AUDIT_SYSTEM_HEALTH === 'function') {
           result = JSON.stringify(AUDIT_SYSTEM_HEALTH());
         } else {
           result = "Function AUDIT_SYSTEM_HEALTH not found.";
         }
      } else if (cmd === 'CLEAN_TEST_BY_YEAR') {
         // Safe cleanup for test data by year
         var year = e.parameter.year;
         if (typeof SOV1_CLEAN_TEST_TRANSACTIONS_BY_YEAR_ === 'function') {
             result = JSON.stringify(SOV1_CLEAN_TEST_TRANSACTIONS_BY_YEAR_(year));
         } else {
             result = "Function SOV1_CLEAN_TEST_TRANSACTIONS_BY_YEAR_ not found.";
         }
      } else if (cmd === 'CLEAN_POS_CATEGORY') {
         // Remove POS from budgets/categories (it's a type, not category)
         try {
           var cleaned = { budgets: 0, categories: 0 };
           var ss = _ss();
           
           // Clean from Budgets
           var sBudgets = ss.getSheetByName('Budgets');
           if (sBudgets && sBudgets.getLastRow() > 1) {
             var budgetData = sBudgets.getRange(2, 1, sBudgets.getLastRow() - 1, 1).getValues();
             for (var i = budgetData.length - 1; i >= 0; i--) {
               if (String(budgetData[i][0] || '').toLowerCase() === 'pos') {
                 sBudgets.deleteRow(i + 2);
                 cleaned.budgets++;
               }
             }
           }
           
           // Clean from Categories
           var sCats = ss.getSheetByName('Categories');
           if (sCats && sCats.getLastRow() > 1) {
             var catData = sCats.getRange(2, 1, sCats.getLastRow() - 1, 1).getValues();
             for (var j = catData.length - 1; j >= 0; j--) {
               if (String(catData[j][0] || '').toLowerCase() === 'pos') {
                 sCats.deleteRow(j + 2);
                 cleaned.categories++;
               }
             }
           }
           
           result = JSON.stringify({ success: true, cleaned: cleaned });
         } catch (ex) {
           result = JSON.stringify({ success: false, error: ex.message });
         }
      } else if (cmd === 'TEST_ADD_TX') {
         try {
           var text = e.parameter.text ? decodeURIComponent(e.parameter.text) : 'أضف: 10 | CLI Test | طعام';
           if (typeof SOV1_UI_addManualTransaction_ === 'function') {
             var r = SOV1_UI_addManualTransaction_(text);
             result = JSON.stringify({ success: true, result: r });
           } else {
             result = 'Function SOV1_UI_addManualTransaction_ not found.';
           }
         } catch (ex) {
           result = 'Error executing TEST_ADD_TX: ' + ex.message;
         }
      } else if (cmd === 'RUN_MANUAL_SETUP') {
         try {
           var summary = {};
           summary.ENSURE_ALL_SHEETS = (typeof ENSURE_ALL_SHEETS === 'function') ? ENSURE_ALL_SHEETS() : 'Function not found';
           summary.CLEAN_CATEGORIES_SHEET = (typeof CLEAN_CATEGORIES_SHEET === 'function') ? CLEAN_CATEGORIES_SHEET() : 'Function not found';
           summary.SETUP_BOT_COMMANDS = (typeof SETUP_BOT_COMMANDS === 'function') ? SETUP_BOT_COMMANDS() : 'Function not found';
           summary.CLEAN_SYSTEM_SHEETS = (typeof CLEAN_SYSTEM_SHEETS === 'function') ? CLEAN_SYSTEM_SHEETS() : 'Function not found';
           summary.RUN_MASTER_VERIFICATION = (typeof RUN_MASTER_VERIFICATION === 'function') ? RUN_MASTER_VERIFICATION() : 'Function not found';
           summary.RUN_COMPLETE_SYSTEM_TEST = (typeof RUN_COMPLETE_SYSTEM_TEST === 'function') ? RUN_COMPLETE_SYSTEM_TEST() : 'Function not found';
           result = JSON.stringify({ success: true, summary: summary });
         } catch (ex) {
           result = "Error executing RUN_MANUAL_SETUP: " + ex.message;
         }
      } else if (cmd === 'SEND_TEST_TELEGRAM') {
         try {
           var chat = e.parameter.chat || e.parameter.chatId || e.parameter.chat_id || e.parameter.chatid;
           var text = e.parameter.text ? decodeURIComponent(e.parameter.text) : 'Test message from CLI';
           if (!chat) {
             result = JSON.stringify({ success: false, error: 'missing chat id' });
           } else {
             if (typeof sendTelegramLogged_ === 'function') {
               var resp = sendTelegramLogged_(chat, text, {});
               result = JSON.stringify({ success: resp.ok, code: resp.code, body: resp.body });
             } else {
               result = JSON.stringify({ success: false, error: 'sendTelegramLogged_ not available' });
             }
           }
         } catch (ex) {
           result = 'Error executing SEND_TEST_TELEGRAM: ' + ex.message;
         }
      } else if (cmd === 'REBUILD_BALANCES') {
         try {
           // Just rebuild from existing opening balances - DON'T overwrite them
           if (typeof rebuildBalancesFromHistory === 'function') {
              var rebuildResult = rebuildBalancesFromHistory();
              result = JSON.stringify({ status: 'Rebuilt from manual opening balances', details: rebuildResult });
           } else {
              result = JSON.stringify({ error: "rebuildBalancesFromHistory not found" });
           }
         } catch (ex) { result = "Error executing REBUILD_BALANCES: " + ex.message; }
      } else if (cmd === 'CALIBRATE_BALANCES') {
         // NEW: Separate command for full calibration (overwrites openings)
         try {
           if (typeof CALIBRATE_BALANCES_MASTER === 'function') {
              var calibration = CALIBRATE_BALANCES_MASTER();
              result = JSON.stringify(calibration);
           } else {
              result = JSON.stringify({ error: "CALIBRATE_BALANCES_MASTER not found" });
           }
         } catch (ex) { result = "Error executing CALIBRATE_BALANCES: " + ex.message; }
      } else if (cmd === 'GET_CALCULATED_BALANCES') {
         try {
           result = (typeof GET_CALCULATED_BALANCES === 'function') ? JSON.stringify(GET_CALCULATED_BALANCES()) : "Function GET_CALCULATED_BALANCES not found.";
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'CLEAR_ALL_TRANSACTIONS') {
         try {
           var s1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
           if (s1 && s1.getLastRow() > 1) {
              s1.deleteRows(2, s1.getLastRow() - 1);
              result = JSON.stringify({ success: true, message: 'All transactions cleared' });
           } else {
              result = JSON.stringify({ success: true, message: 'No transactions to clear' });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'SYNC_BALANCES_TO_OPENING') {
         // Set current Balance = Opening Balance (for fresh start)
         try {
           var accSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Accounts');
           if (!accSheet || accSheet.getLastRow() < 2) {
              result = JSON.stringify({ success: false, error: 'No accounts' });
           } else {
              var lastRow = accSheet.getLastRow();
              var openings = accSheet.getRange(2, 11, lastRow - 1, 1).getValues(); // Column K = Opening
              var now = new Date();
              var balances = [];
              var dates = [];
              for (var i = 0; i < openings.length; i++) {
                balances.push([Number(openings[i][0] || 0)]);
                dates.push([now]);
              }
              accSheet.getRange(2, 5, lastRow - 1, 1).setValues(balances);  // Column E = Balance
              accSheet.getRange(2, 6, lastRow - 1, 1).setValues(dates);     // Column F = LastUpdate
              result = JSON.stringify({ success: true, synced: lastRow - 1 });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'SET_ACCOUNT_BALANCE') {
         // Set balance for a specific account
         try {
           var accountNum = e.parameter.accountNum || '';
           var newBalance = Number(e.parameter.balance || 0);
           var accSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Accounts');
           if (!accSheet || accSheet.getLastRow() < 2) {
              result = JSON.stringify({ success: false, error: 'No accounts' });
           } else {
              var data = accSheet.getRange(2, 3, accSheet.getLastRow() - 1, 1).getValues();
              var found = false;
              for (var i = 0; i < data.length; i++) {
                if (String(data[i][0]) === String(accountNum)) {
                  accSheet.getRange(i + 2, 5).setValue(newBalance);
                  accSheet.getRange(i + 2, 6).setValue(new Date());
                  found = true;
                  break;
                }
              }
              result = found ? JSON.stringify({ success: true, account: accountNum, balance: newBalance }) : JSON.stringify({ success: false, error: 'Account not found' });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'DUMP_INGRESS_DEBUG') {
         try {
           var n = Number(e.parameter.n || 20) || 20;
           result = (typeof DUMP_INGRESS_DEBUG === 'function') ? JSON.stringify(DUMP_INGRESS_DEBUG(n)) : "Function DUMP_INGRESS_DEBUG not found.";
         } catch (ex) { result = "Error executing DUMP_INGRESS_DEBUG: " + ex.message; }
      } else if (cmd === 'DUMP_ACCOUNTS') {
         try {
           result = (typeof SOV1_UI_getAccounts_ === 'function') ? JSON.stringify({ success: true, accounts: SOV1_UI_getAccounts_() }) : "Function SOV1_UI_getAccounts_ not found.";
         } catch (ex) { result = "Error executing DUMP_ACCOUNTS: " + ex.message; }
      } else if (cmd === 'UPDATE_ACCOUNT_ALIASES') {
         try {
           var accountNum = e.parameter.accountNum || '';
           var aliases = e.parameter.aliases || '';
           result = (typeof UPDATE_ACCOUNT_ALIASES === 'function') ? JSON.stringify(UPDATE_ACCOUNT_ALIASES(accountNum, aliases)) : "Function UPDATE_ACCOUNT_ALIASES not found.";
         } catch (ex) { result = "Error executing UPDATE_ACCOUNT_ALIASES: " + ex.message; }
      } else if (cmd === 'DUMP_ACCOUNT_BALANCES') {
         try {
           result = (typeof SOV1_UI_getAccountsWithBalances_ === 'function') ? JSON.stringify({ success: true, balances: SOV1_UI_getAccountsWithBalances_() }) : "Function SOV1_UI_getAccountsWithBalances_ not found.";
         } catch (ex) { result = "Error executing DUMP_ACCOUNT_BALANCES: " + ex.message; }
      } else if (cmd === 'DUMP_ACCOUNTS_RAW') {
         // Dump raw accounts sheet data including Opening Balance
         try {
           var accSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Accounts');
           if (!accSheet || accSheet.getLastRow() < 2) {
             result = JSON.stringify({ success: false, error: 'No accounts' });
           } else {
             var data = accSheet.getRange(2, 1, accSheet.getLastRow()-1, 11).getValues();
             var accounts = data.map(function(r) {
               return { name: r[0], type: r[1], num: r[2], bank: r[3], balance: r[4], lastUpdate: r[5], isMine: r[6], isInternal: r[7], aliases: r[8], notes: r[9], openingBalance: r[10] };
             });
             result = JSON.stringify({ success: true, accounts: accounts });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'CLEAN_ACCOUNTS_AUTOFIX') {
         try {
           result = (typeof CLEAN_ACCOUNTS_AUTOFIX_ === 'function') ? JSON.stringify(CLEAN_ACCOUNTS_AUTOFIX_()) : "Function CLEAN_ACCOUNTS_AUTOFIX_ not found.";
         } catch (ex) { result = "Error executing CLEAN_ACCOUNTS_AUTOFIX: " + ex.message; }
      } else if (cmd === 'RESET_ACCOUNTS_CANONICAL') {
         try {
           result = (typeof RESET_ACCOUNTS_CANONICAL_ === 'function') ? JSON.stringify(RESET_ACCOUNTS_CANONICAL_()) : "Function RESET_ACCOUNTS_CANONICAL_ not found.";
         } catch (ex) { result = "Error executing RESET_ACCOUNTS_CANONICAL: " + ex.message; }
      } else if (cmd === 'SET_OPENING_BALANCES') {
         // Force Push Check
         try {
           result = (typeof SET_OPENING_BALANCES_FROM_CLI === 'function') ? JSON.stringify(SET_OPENING_BALANCES_FROM_CLI()) : "Function SET_OPENING_BALANCES_FROM_CLI not found.";
         } catch (ex) { result = "Error executing SET_OPENING_BALANCES: " + ex.message; }
      } else if (cmd === 'TEST_ADD_ACCOUNT') {
         try {
           var name = e.parameter.name || 'CLI Test Account';
           var type = e.parameter.type || 'بنك';
           var number = e.parameter.number || '';
           var bank = e.parameter.bank || 'CLI Bank';
           var balance = typeof e.parameter.balance !== 'undefined' ? Number(e.parameter.balance) : 0;
           var isMine = (e.parameter.isMine === 'false') ? false : true;
           var obj = { name: name, type: type, number: number, bank: bank, balance: balance, isMine: isMine, isInternal: false, aliases: '', notes: 'added via CLI test' };
           result = (typeof SOV1_UI_addAccount_ === 'function') ? JSON.stringify(SOV1_UI_addAccount_(obj)) : "Function SOV1_UI_addAccount_ not found.";
         } catch (ex) { result = "Error executing TEST_ADD_ACCOUNT: " + ex.message; }
      } else if (cmd === 'BULK_EXTRACT_ACCOUNTS') {
         try {
           var raw = e.parameter.smsText ? decodeURIComponent(e.parameter.smsText) : '';
           var lines = [];
           // Try parsing as JSON array first (supports multi-line messages)
           try {
             var parsed = JSON.parse(raw);
             if (Array.isArray(parsed)) lines = parsed;
           } catch(eJson) {
             // Fallback: Split by delimiter (try double newline first, else newline)
             if (raw.indexOf('\n\n') !== -1) {
                lines = raw.split(/\n\n/);
             } else {
                lines = raw.split(/\r?\n/);
             }
           }
           // Clean empty lines
           lines = lines.map(function(s){ return String(s).trim(); }).filter(function(s){ return s.length>0; });
           
           if (typeof SOV1_UI_bulkExtractAccounts === 'function') {
             result = JSON.stringify(SOV1_UI_bulkExtractAccounts(lines));
           } else {
             result = 'Function SOV1_UI_bulkExtractAccounts not found.';
           }
         } catch (ex) { result = 'Error executing BULK_EXTRACT_ACCOUNTS: ' + ex.message; }
      } else if (cmd === 'BULK_ADD_ACCOUNTS') {
         try {
           var json = e.parameter.accountsJson ? decodeURIComponent(e.parameter.accountsJson) : (e.parameter.accounts ? decodeURIComponent(e.parameter.accounts) : null);
           var arr = [];
           if (json) {
             try { arr = JSON.parse(json); } catch (e) { arr = []; }
           }
           if (!arr || arr.length === 0) { result = JSON.stringify({ success: false, error: 'No accounts provided or parse failed' }); }
           else if (typeof SOV1_UI_bulkAddAccounts === 'function') { result = JSON.stringify(SOV1_UI_bulkAddAccounts(arr)); }
           else { result = 'Function SOV1_UI_bulkAddAccounts not found.'; }
         } catch (ex) { result = 'Error executing BULK_ADD_ACCOUNTS: ' + ex.message; }
      } else if (cmd === 'LIST_CLI') {
         try {
           var known = ['DEBUG_SHEETS_INFO','DEBUG_TELEGRAM_STATUS','RUN_MASTER_TESTS','RUN_AUTOMATED_CHECKLIST','ENSURE_ALL_SHEETS','CLEAN_CATEGORIES_SHEET','SETUP_BOT_COMMANDS','CLEAN_SYSTEM_SHEETS','WIPE_ALL_DATA','RESTORE_DEFAULTS','CLEANUP_TX_CATEGORIES','REPAIR_TX_MERCHANTS','PARSE_AI','RUN_MASTER_VERIFICATION','RUN_COMPLETE_SYSTEM_TEST','RUN_MANUAL_SETUP','SEND_TEST_TELEGRAM','DUMP_INGRESS_DEBUG','DUMP_ACCOUNTS','DUMP_ACCOUNT_BALANCES','TEST_ADD_ACCOUNT','LIST_PROPERTIES','CLEAN_DUP_PROPERTIES','SET_MAINTENANCE_MODE','LIST_PROJECT_TRIGGERS','LIST_TRIGGERS'];
           var available = known.map(function(k){
             try { return { cmd: k, exists: (typeof eval(k) === 'function') }; } catch(e) { return { cmd: k, exists: false }; }
           });
           result = JSON.stringify({ success: true, available: available });
         } catch (e) {
           result = "Error listing CLI: " + e.message;
         }
      } else if (cmd === 'LIST_PROPERTIES') {
         try {
           var props = PropertiesService.getScriptProperties().getProperties();
           result = JSON.stringify({ success: true, properties: props });
         } catch (e) {
           result = "Error listing properties: " + e.message;
         }
      } else if (cmd === 'CLEAN_DUP_PROPERTIES') {
         try {
           var props = PropertiesService.getScriptProperties();
           var all = props.getProperties();
           var keys = Object.keys(all);
           var deleted = [];
           keys.forEach(function(k) {
             if (k.startsWith('dup:')) {
               props.deleteProperty(k);
               deleted.push(k);
             }
           });
           result = JSON.stringify({ success: true, deleted: deleted });
         } catch (e) {
           result = "Error cleaning dup properties: " + e.message;
         }
      } else if (cmd === 'SET_SCRIPT_PROPERTY') {
         try {
           var key = e.parameter.key || e.parameter.k;
           var val = (typeof e.parameter.value !== 'undefined') ? e.parameter.value : e.parameter.v || '';
           if (!key) { result = JSON.stringify({ success: false, error: 'missing key' }); }
           else { PropertiesService.getScriptProperties().setProperty(String(key), String(val)); result = JSON.stringify({ success: true, key: String(key) }); }
         } catch (ex) { result = 'Error executing SET_SCRIPT_PROPERTY: ' + ex.message; }
      } else if (cmd === 'SET_MAINTENANCE_MODE') {
         try {
           var mode = e.parameter.m_mode || 'off';
           PropertiesService.getScriptProperties().setProperty('MAINTENANCE_MODE', mode);
           result = JSON.stringify({ success: true, maintenance_mode: mode });
         } catch (e) {
           result = "Error setting maintenance mode: " + e.message;
         }
      } else if (cmd === 'LIST_PROJECT_TRIGGERS' || cmd === 'LIST_TRIGGERS') {
         try {
           result = (typeof LIST_PROJECT_TRIGGERS === 'function') ? JSON.stringify(LIST_PROJECT_TRIGGERS()) : "Function LIST_PROJECT_TRIGGERS not found.";
         } catch (e) { result = "Error executing LIST_PROJECT_TRIGGERS: " + e.message; }
      } else if (cmd === 'ENFORCE_TRIGGERS') {
         try {
           var keep = e.parameter.keep ? String(e.parameter.keep).split(',') : null;
           result = (typeof SOV1_enforceTriggers_ === 'function') ? JSON.stringify(SOV1_enforceTriggers_(keep)) : "Function SOV1_enforceTriggers_ not found.";
         } catch (e) { result = "Error executing ENFORCE_TRIGGERS: " + e.message; }
      } else if (cmd === 'RECATEGORIZE_OTHER') {
         // Re-categorize transactions marked as "أخرى" using Grok AI
         try {
           var limit = Number(e.parameter.limit || 50);
           var dryRun = (e.parameter.dryRun === 'true' || e.parameter.dry === 'true');
           result = (typeof recategorizeOtherTransactions_ === 'function') 
             ? JSON.stringify(recategorizeOtherTransactions_(limit, dryRun)) 
             : "Function recategorizeOtherTransactions_ not found.";
         } catch (ex) { result = "Error executing RECATEGORIZE_OTHER: " + ex.message; }
      } else if (cmd === 'AUDIT_CATEGORIES') {
         // Audit all transactions to find miscategorized ones
         try {
           result = (typeof auditTransactionCategories_ === 'function') 
             ? JSON.stringify(auditTransactionCategories_()) 
             : "Function auditTransactionCategories_ not found.";
         } catch (ex) { result = "Error executing AUDIT_CATEGORIES: " + ex.message; }
      } else if (cmd === 'VIEW_MERCHANT_MEMORY') {
         // View learned merchant->category mappings
         try {
           if (typeof getMerchantMemory_ === 'function') {
             var memory = getMerchantMemory_();
             var count = Object.keys(memory).length;
             result = JSON.stringify({ 
               success: true, 
               count: count, 
               merchants: memory,
               note: 'Grok uses this to remember category for repeat merchants'
             });
           } else {
             result = JSON.stringify({ success: false, error: "getMerchantMemory_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'CLEAR_MERCHANT_MEMORY') {
         // Clear the merchant memory cache (forces rebuild on next classification)
         try {
           if (typeof clearMerchantMemoryCache_ === 'function') {
             clearMerchantMemoryCache_();
             result = JSON.stringify({ success: true, message: "Merchant memory cache cleared. Will rebuild from transactions on next use." });
           } else {
             result = JSON.stringify({ success: false, error: "clearMerchantMemoryCache_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'TEST_MERCHANT_LOOKUP') {
         // Test merchant lookup without calling AI
         try {
           var merchant = e.parameter.merchant ? decodeURIComponent(e.parameter.merchant) : '';
           if (!merchant) {
             result = JSON.stringify({ success: false, error: "Missing 'merchant' parameter" });
           } else if (typeof lookupMerchantCategory_ === 'function') {
             var found = lookupMerchantCategory_(merchant);
             result = JSON.stringify({ 
               success: true, 
               merchant: merchant,
               foundCategory: found,
               note: found ? 'Category found from past transactions' : 'No match - will use AI'
             });
           } else {
             result = JSON.stringify({ success: false, error: "lookupMerchantCategory_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'VIEW_BANK_FORMATS') {
         // View learned bank SMS formats
         try {
           if (typeof getBankFormatMemory_ === 'function') {
             var bankMemory = getBankFormatMemory_();
             result = JSON.stringify({ 
               success: true, 
               totalTransactions: bankMemory.total,
               banks: bankMemory.banks,
               note: 'Grok learns SMS format patterns from each bank'
             });
           } else {
             result = JSON.stringify({ success: false, error: "getBankFormatMemory_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'VIEW_SMS_LEARNING') {
         // View the full SMS learning context that gets sent to AI
         try {
           if (typeof getSMSLearningContext_ === 'function') {
             var context = getSMSLearningContext_();
             result = JSON.stringify({ 
               success: true, 
               learningContext: context,
               contextLength: context.length,
               note: 'This context is included in every AI call to help Grok learn from your transaction history'
             });
           } else {
             result = JSON.stringify({ success: false, error: "getSMSLearningContext_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else if (cmd === 'DETECT_BANK') {
         // Test bank detection from SMS text
         try {
           var smsText = e.parameter.sms ? decodeURIComponent(e.parameter.sms) : '';
           if (!smsText) {
             result = JSON.stringify({ success: false, error: "Missing 'sms' parameter" });
           } else if (typeof detectBankFromSMS_ === 'function') {
             var bank = detectBankFromSMS_(smsText);
             result = JSON.stringify({ 
               success: true, 
               sms: smsText.substring(0, 100) + (smsText.length > 100 ? '...' : ''),
               detectedBank: bank || 'Unknown',
               note: bank ? 'Bank detected from SMS patterns' : 'Could not identify bank'
             });
           } else {
             result = JSON.stringify({ success: false, error: "detectBankFromSMS_ not found" });
           }
         } catch (ex) { result = "Error: " + ex.message; }
      } else {
        result = "Unknown command: " + cmd;
      }
    } catch (err) {
      result = "Error executing " + cmd + ": " + err.message;
    }
    return ContentService.createTextOutput(JSON.stringify({ result: result })).setMimeType(ContentService.MimeType.JSON);
  }

  var page = (e && e.parameter && e.parameter.page) ? String(e.parameter.page) : 'index';
  var file = 'index';
  if (page === 'dashboard') file = 'Dashboard';
  if (page === 'details') file = 'details';
  if (page === 'reports') file = 'reports';
  if (page === 'settings') file = 'settings';
  if (page === 'test') file = 'test_report';
  if (page === 'onboarding') file = 'onboarding';
  if (page === 'features') file = 'features';
  if (page === 'auto-tests') file = 'auto_tests';

  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle('شافي المطيري — متابعة المصاريف المالية')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- CLI helpers: quick debug utilities (safe, read-only) ---
function DEBUG_TELEGRAM_STATUS() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_TOKEN') || props.getProperty('TELEGRAM_BOT_TOKEN') || (typeof ENV !== 'undefined' ? ENV.TELEGRAM_TOKEN : null);
  var chat = props.getProperty('TELEGRAM_CHAT_ID') || props.getProperty('TELEGRAM_CHATID') || (typeof ENV !== 'undefined' ? (ENV.CHAT_ID || ENV.CHANNEL_ID) : null);
  var res = { tokenPresent: !!token, chatId: chat || null, botInfo: null, webhookInfo: null };
  if (!token) return res;
  try {
    var botInfo = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getMe', { muteHttpExceptions: true }).getContentText();
    res.botInfo = JSON.parse(botInfo);
  } catch (e) { res.botInfo = { error: e.message }; }
  try {
    var wh = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getWebhookInfo', { muteHttpExceptions: true }).getContentText();
    res.webhookInfo = JSON.parse(wh);
  } catch (e) { res.webhookInfo = { error: e.message }; }
  return res;
}

// CLI helper: send a direct test message to a chat and return the Telegram API response
function SEND_TEST_TELEGRAM(chatId, text) {
  chatId = String(chatId || '').trim();
  if (!chatId) return { success: false, error: 'missing chatId' };
  if (typeof sendTelegramLogged_ !== 'function') return { success: false, error: 'sendTelegramLogged_ not available' };
  var r = sendTelegramLogged_(chatId, String(text || 'Test message from CLI'), {});
  return { success: r.ok, code: r.code, body: r.body };
}

/**
 * Return last n rows from Ingress_Debug as objects: { time, level, where, meta, raw }
 */
function DUMP_INGRESS_DEBUG(n) {
  try {
    n = Math.max(1, Math.min(100, Number(n) || 20));
    var sh = _sheet('Ingress_Debug');
    if (!sh) return { success: true, rows: [] };
    var last = sh.getLastRow();
    if (last < 2) return { success: true, rows: [] };
    var start = Math.max(2, last - n + 1);
    var rows = sh.getRange(start, 1, last - start + 1, 5).getValues();
    var out = rows.map(function(r) {
      return { time: r[0], level: r[1], where: r[2], meta: r[3], raw: r[4] };
    });
    return { success: true, rows: out };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Moved logic up


// --- حماية بسيطة (اختياري): كلمة مرور UI_PASSWORD ---
function SOV1_UI_auth_(password) {
  if (!ENV.UI_PASSWORD) return { ok:true, token:'OPEN' };
  password = String(password||'');
  if (password !== ENV.UI_PASSWORD) return { ok:false, message:'كلمة المرور غير صحيحة' };
  var token = Utilities.getUuid().slice(0,12);
  CacheService.getScriptCache().put('UI_AUTH_' + token, '1', 3600);
  return { ok:true, token: token };
}
function SOV1_UI_requireAuth_(token) {
  if (!ENV.UI_PASSWORD) return true;
  token = String(token||'');
  return CacheService.getScriptCache().get('UI_AUTH_' + token) === '1';
}

function SOV1_UI_getDashboard_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  
  // Handle missing Ingress_Queue sheet gracefully
  var sQ = null;
  try {
    sQ = _sheet('Ingress_Queue');
  } catch (e) {
    Logger.log('Ingress_Queue sheet not found, skipping dup tracking');
  }

  var now = new Date();
  
  // ✅ Use salary day for monthly calculation
  var salaryDay = 27; // Default
  try {
    var settings = getSettings();
    if (settings && settings.settings && settings.settings.salary_day) {
      salaryDay = Number(settings.settings.salary_day) || 27;
    }
  } catch (e) {}
  
  // Calculate month boundaries based on salary day
  var startMonth, endMonth;
  if (now.getDate() >= salaryDay) {
    startMonth = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
    endMonth = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay, 0, 0, 0);
  } else {
    startMonth = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay, 0, 0, 0);
    endMonth = new Date(now.getFullYear(), now.getMonth(), salaryDay, 0, 0, 0);
  }
  var prevStart = new Date(startMonth);
  prevStart.setMonth(prevStart.getMonth() - 1);
  var prevEnd = new Date(startMonth);

  var totalRemain = 0;
  if (sB && sB.getLastRow() >= 2) {
    var b = sB.getDataRange().getValues();
    for (var i=1;i<b.length;i++) totalRemain += Number(b[i][3]) || 0;
  }
  
  // ✅ Get total account balance
  var totalAccountBalance = 0;
  try {
    if (typeof getAccountsWithBalances_ === 'function') {
      var accounts = getAccountsWithBalances_();
      for (var a = 0; a < accounts.length; a++) {
        totalAccountBalance += Number(accounts[a].balance || 0);
      }
    }
  } catch (e) {
    Logger.log('Error getting account balances: ' + e);
  }

  var last = s1.getLastRow();
  var rows = (last>=2) ? s1.getRange(2,1,last-1,13).getValues() : [];
  var incomeM=0, spendM=0, incomePrev=0;

  for (var r=0;r<rows.length;r++){
    var d = rows[r][1];
    if (!(d instanceof Date)) continue;
    var amt = Number(rows[r][8]) || 0;
    var typ = String(rows[r][11]||'');
    var raw = String(rows[r][12]||'');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
    if (d >= startMonth && d < endMonth) {
      if (incoming) incomeM += Math.max(amt,0); else spendM += Math.max(amt,0);
    } else if (d >= prevStart && d < prevEnd) {
      if (incoming) incomePrev += Math.max(amt,0);
    }
  }
  // Fallback: if no income transactions, use total account balances as current income baseline
  if (incomeM === 0 && totalAccountBalance > 0) {
    incomeM = totalAccountBalance;
  }

  var incomeDeltaPct = (incomePrev > 0) ? ((incomeM - incomePrev) / incomePrev * 100) : null;

  // تكرار آخر 7 أيام - only if Ingress_Queue exists
  var dupDaily = {};
  if (sQ) {
    try {
      var qLast = sQ.getLastRow();
      var q = (qLast>=2) ? sQ.getRange(2,1,qLast-1,6).getValues() : [];
      var cutoff = new Date(Date.now() - 7*24*3600*1000);
      for (var k=0;k<q.length;k++){
        var t = q[k][0];
        if (!(t instanceof Date) || t < cutoff) continue;
        if (String(q[k][4]||'') !== 'SKIP_DUP') continue;
        var day = Utilities.formatDate(t, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        dupDaily[day] = (dupDaily[day]||0)+1;
      }
    } catch (e) {
      Logger.log('Error reading Ingress_Queue: ' + e.message);
    }
  }

  return {
    kpi: { 
      incomeM: incomeM, 
      spendM: spendM, 
      netM: incomeM - spendM, 
      totalRemain: totalRemain,
      totalBalance: totalAccountBalance,  // ✅ Total account balances
      incomeDeltaPct: incomeDeltaPct
    },
    dup7d: Object.keys(dupDaily).sort().map(function(d){ return { day:d, dup:dupDaily[d] }; })
  };
}

function SOV1_UI_getLatest_(token, limit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  limit = Math.max(10, Math.min(Number(limit||60), 200));

  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  if (last < 2) return [];
  var start = Math.max(2, last - limit + 1);
  var rows = s1.getRange(start,1,last-start+1,13).getValues();
  rows.reverse();

  var catMap = _getCategoryNameMap_();

  return rows.map(function(r, idx){
    var rowNumber = last - idx;
    var rawCat = r[10] || '';
    var displayCat = catMap[rawCat] || rawCat;
    return {
      row: rowNumber,
      uuid: r[0] || '',
      date: (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '',
      amount: Number(r[8]||0),
      merchant: r[9] || '',
      category: displayCat,
      type: r[11] || '',
      account: r[6] || r[7] || '', // AccNum or CardNum
      source: r[5] || '',
      notes: r[12] || '',
      tag: r[2] || ''
    };
  });
}

function SOV1_UI_getCategories_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var cache = CacheService.getScriptCache();
  var cached = cache.get('UI_CATS');
  if (cached) { 
    try { 
      return JSON.parse(cached); 
    } catch(e) {
      Logger.log('Categories cache parse error: ' + e.message);
    } 
  }

  // Try Categories sheet first, fallback to Budgets
  var sCat = _sheet('Categories');
  var cats = [];

  function _getCategoriesSchema_() {
    if (!sCat || sCat.getLastRow() < 1) return null;
    var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
      return String(h || '').trim();
    });
    if (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0) {
      return { type: 'en', idCol: 1, nameCol: 2, parentCol: 3, typeCol: 4, iconCol: 5, colorCol: 6, descCol: 7, activeCol: 8 };
    }
    if (header[0] === 'التصنيف' || header.indexOf('الأيقونة') >= 0) {
      return { type: 'ar', nameCol: 1, iconCol: 2, colorCol: 3, activeCol: 4, descCol: 5 };
    }
    return { type: 'ar', nameCol: 1, iconCol: 2, colorCol: 3, activeCol: 4, descCol: 5 };
  }

  if (sCat && sCat.getLastRow() > 1) {
    // Categories sheet exists with data
    var schema = _getCategoriesSchema_();
    var data = sCat.getRange(2, 1, sCat.getLastRow() - 1, sCat.getLastColumn()).getValues();
    for (var i = 0; i < data.length; i++) {
      var name = String(data[i][schema.nameCol - 1] || '').trim();
      var icon = String(data[i][(schema.iconCol || schema.nameCol) - 1] || '').trim();
      var activeVal = data[i][(schema.activeCol || schema.nameCol) - 1];
      var active = (activeVal === true) || (String(activeVal || '').trim().toLowerCase() === 'true') || (String(activeVal || '').trim() === 'نعم');
      if (name && active) {
        cats.push({ name: name, icon: icon });
      }
    }
  } else {
    // Fallback to Budgets sheet
    var sB = _sheet('Budgets');
    var last = sB.getLastRow();
    if (last >= 2) {
      var budgetCats = sB.getRange(2, 1, last - 1, 1).getValues();
      for (var j = 0; j < budgetCats.length; j++) {
        var c = String(budgetCats[j][0] || '').trim();
        if (c) cats.push({ name: c, icon: '' });
      }
    }
  }
  
  // If still empty, return defaults
  if (cats.length === 0) {
    cats = [
      { name: 'طعام', icon: '🍽️' },
      { name: 'نقل', icon: '🚗' },
      { name: 'فواتير', icon: '📄' },
      { name: 'تسوق', icon: '🛍️' },
      { name: 'سكن', icon: '🏠' },
      { name: 'ترفيه', icon: '🎬' },
      { name: 'صحة', icon: '💊' },
      { name: 'راتب', icon: '💰' },
      { name: 'تحويل', icon: '↔️' },
      { name: 'أخرى', icon: '📦' }
    ];
  }

  cache.put('UI_CATS', JSON.stringify(cats), 300);
  return cats;
}

// Map category IDs to display names (handles English/Arabic schemas)
function _getCategoryNameMap_() {
  try {
    var sCat = _sheet('Categories');
    if (!sCat || sCat.getLastRow() < 2) return {};

    var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
      return String(h || '').trim();
    });
    var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);
    var data = sCat.getRange(2, 1, sCat.getLastRow() - 1, sCat.getLastColumn()).getValues();
    var map = {};

    for (var i = 0; i < data.length; i++) {
      if (isEnglishSchema) {
        var id = String(data[i][0] || '').trim();
        var name = String(data[i][1] || '').trim();
        var activeVal = data[i][7];
        var active = (activeVal === true) || (String(activeVal || '').trim().toLowerCase() === 'true') || (String(activeVal || '').trim() === 'نعم');
        if (name && active) {
          if (id) map[id] = name;
          map[name] = name;
        }
      } else {
        var nm = String(data[i][0] || '').trim();
        var activeAr = String(data[i][3] || 'نعم').trim();
        if (nm && activeAr !== 'لا') {
          map[nm] = nm;
        }
      }
    }

    return map;
  } catch (e) {
    Logger.log('Category map error: ' + e.message);
    return {};
  }
}

/**
 * Get all categories with full details for management
 */
function SOV1_UI_getCategoriesManage_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  var sCat = _sheet('Categories');
  if (!sCat || sCat.getLastRow() < 2) {
    SOV1_SETUP_CATEGORIES_SHEET_();
    sCat = _sheet('Categories');
  }

  // Load Budgets Map
  var budgetMap = {};
  var sBud = _sheet('Budgets');
  if (sBud && sBud.getLastRow() > 1) {
    try {
      var bData = sBud.getDataRange().getValues();
      for (var j = 1; j < bData.length; j++) {
        var bName = String(bData[j][0] || '').toLowerCase().trim();
        var bLimit = Number(bData[j][1] || 0);
        if (bName) budgetMap[bName] = bLimit;
      }
    } catch (e) { console.error('Budget load error', e); }
  }

  var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
    return String(h || '').trim();
  });
  var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);
  var data = sCat.getRange(2, 1, Math.max(1, sCat.getLastRow() - 1), sCat.getLastColumn()).getValues();
  var cats = [];

  for (var i = 0; i < data.length; i++) {
    var catObj = null;
    if (isEnglishSchema) {
      var id = String(data[i][0] || '').trim();
      var nameEn = String(data[i][1] || '').trim();
      if (nameEn) {
        catObj = {
          row: i + 2,
          id: id,
          name: nameEn,
          icon: String(data[i][4] || '').trim(),
          color: String(data[i][5] || '').trim(),
          type: String(data[i][3] || '').trim(),
          parent: String(data[i][2] || '').trim(),
          active: (data[i][7] === true) || (String(data[i][7] || '').trim().toLowerCase() === 'true') || (String(data[i][7] || '').trim() === 'نعم'),
          notes: String(data[i][6] || '').trim()
        };
      }
    } else {
      var name = String(data[i][0] || '').trim();
      if (name) {
        catObj = {
          row: i + 2,
          name: name,
          icon: String(data[i][1] || '').trim(),
          color: String(data[i][2] || '').trim(),
          active: String(data[i][3] || 'نعم').trim() !== 'لا',
          notes: String(data[i][4] || '').trim()
        };
      }
    }

    if (catObj) {
      var bKey = catObj.name.toLowerCase().trim();
      catObj.budgetLimit = budgetMap[bKey] || 0;
      cats.push(catObj);
    }
  }

  return cats;
}

/**
 * Add a new category
 */
function SOV1_UI_addCategory_(token, name, icon, color, description, budgetLimit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  name = String(name || '').trim();
  icon = String(icon || '📦').trim();
  color = String(color || '#6B7280').trim();
  description = String(description || '').trim();
  
  if (!name) throw new Error('اسم التصنيف مطلوب');
  if (name.length > 50) throw new Error('اسم التصنيف طويل جداً');
  
  // Check for test/invalid categories
  if (/test|تجريب|تجربة|fake|dummy/i.test(name)) {
    throw new Error('لا يمكن إضافة تصنيف تجريبي');
  }
  
  var sCat = _sheet('Categories');
  if (!sCat || sCat.getLastRow() < 1) {
    SOV1_SETUP_CATEGORIES_SHEET_();
    sCat = _sheet('Categories');
  }

  var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
    return String(h || '').trim();
  });
  var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);
  var newId = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '');
  if (!newId) newId = 'cat_' + Utilities.getUuid().slice(0, 8);
  
  // Check if exists
  var data = sCat.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var existingName = isEnglishSchema ? String(data[i][1] || '').trim() : String(data[i][0] || '').trim();
    if (existingName.toLowerCase() === name.toLowerCase()) {
      throw new Error('التصنيف موجود مسبقاً');
    }
  }

  // Add new row
  if (isEnglishSchema) {
    sCat.appendRow([newId, name, '', 'expense', icon, color, description, true]);
  } else {
    sCat.appendRow([name, icon, color, 'نعم', description]);
  }

  // Save Budget if provided
  if (budgetLimit !== undefined && budgetLimit !== null && budgetLimit !== '') {
    SOV1_UI_saveBudget_(name, budgetLimit);
  }
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, name: name };
}

/**
 * Update an existing category
 */
function SOV1_UI_updateCategory_(token, row, name, icon, color, active, description, budgetLimit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  name = String(name || '').trim();
  icon = String(icon || '📦').trim();
  color = String(color || '#6B7280').trim();
  description = String(description || '').trim();
  var activeStr = active === false ? 'لا' : 'نعم';
  
  if (!name) throw new Error('اسم التصنيف مطلوب');
  
  // Check for test categories
  if (/test|تجريب|تجربة|fake|dummy/i.test(name)) {
    throw new Error('لا يمكن استخدام تصنيف تجريبي');
  }
  
  var sCat = _sheet('Categories');
  var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
    return String(h || '').trim();
  });
  var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);

  if (isEnglishSchema) {
    sCat.getRange(row, 2).setValue(name);
    sCat.getRange(row, 5).setValue(icon);
    sCat.getRange(row, 6).setValue(color);
    sCat.getRange(row, 7).setValue(description);
    sCat.getRange(row, 8).setValue(active !== false);
  } else {
    sCat.getRange(row, 1, 1, 5).setValues([[name, icon, color, activeStr, description]]);
  }

  // Update Budget if provided
  if (budgetLimit !== undefined && budgetLimit !== null && budgetLimit !== '') {
    SOV1_UI_saveBudget_(name, budgetLimit);
  }
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, row: row };
}

/**
 * Delete a category (mark as inactive)
 */
function SOV1_UI_deleteCategory_(token, row) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  var sCat = _sheet('Categories');
  var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
    return String(h || '').trim();
  });
  var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);
  var name = String(sCat.getRange(row, isEnglishSchema ? 2 : 1).getValue() || '').trim();
  
  // Don't delete system categories
  var systemCats = ['أخرى', 'راتب', 'تحويل', 'تحقق', 'مرفوضة'];
  if (systemCats.indexOf(name) >= 0) {
    throw new Error('لا يمكن حذف تصنيف النظام');
  }
  
  // Mark as inactive instead of deleting
  if (isEnglishSchema) {
    sCat.getRange(row, 8).setValue(false);
  } else {
    sCat.getRange(row, 4).setValue('لا');
  }
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  return { ok: true, name: name };
}

/**
 * Setup Categories sheet with default data
 */
function SOV1_SETUP_CATEGORIES_SHEET_() {
  if (typeof ensureCategoriesSheet_ === 'function') {
    return ensureCategoriesSheet_();
  }

  var ss = SpreadsheetApp.openById(_prop_('SHEET_ID'));
  var existing = ss.getSheetByName('Categories');
  
  if (existing && existing.getLastRow() > 1) {
    return existing; // Already has data
  }
  
  var sheet = existing || ss.insertSheet('Categories');
  
  // Headers (fallback Arabic schema)
  var headers = ['التصنيف', 'الأيقونة', 'اللون', 'نشط', 'ملاحظات'];
  sheet.getRange(1, 1, 1, 5).setValues([headers]);
  sheet.getRange(1, 1, 1, 5)
    .setBackground('#1F2937')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Default categories
  var defaults = [
    ['طعام', '🍽️', '#EF4444', 'نعم', 'مطاعم، كافيهات، بقالة'],
    ['نقل', '🚗', '#F59E0B', 'نعم', 'وقود، أوبر، مواصلات'],
    ['فواتير', '📄', '#3B82F6', 'نعم', 'كهرباء، ماء، اتصالات'],
    ['تسوق', '🛍️', '#8B5CF6', 'نعم', 'ملابس، إلكترونيات'],
    ['سكن', '🏠', '#10B981', 'نعم', 'إيجار، صيانة'],
    ['ترفيه', '🎬', '#EC4899', 'نعم', 'سينما، اشتراكات'],
    ['صحة', '💊', '#06B6D4', 'نعم', 'طبيب، أدوية'],
    ['تعليم', '📚', '#6366F1', 'نعم', 'دورات، كتب'],
    ['سحب نقدي', '🏧', '#64748B', 'نعم', 'سحب صراف، ATM'],
    ['راتب', '💰', '#22C55E', 'نعم', 'الراتب الشهري'],
    ['تحويل', '↔️', '#64748B', 'نعم', 'تحويلات بنكية'],
    ['أخرى', '📦', '#6B7280', 'نعم', 'مصروفات متنوعة']
  ];
  
  sheet.getRange(2, 1, defaults.length, 5).setValues(defaults);
  
  // Formatting
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 60);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 60);
  sheet.setColumnWidth(5, 200);
  
  return sheet;
}

/**
 * Clean test categories from all sheets
 */
function SOV1_CLEAN_TEST_CATEGORIES_() {
  var testPatterns = /test|تجريب|تجربة|fake|dummy|sample/i;
  var cleaned = { categories: 0, transactions: 0, budgets: 0 };
  
  // 1. Clean Categories sheet
  var sCat = _sheet('Categories');
  if (sCat && sCat.getLastRow() > 1) {
    var catData = sCat.getRange(2, 1, sCat.getLastRow() - 1, 1).getValues();
    for (var i = catData.length - 1; i >= 0; i--) {
      if (testPatterns.test(String(catData[i][0] || ''))) {
        sCat.deleteRow(i + 2);
        cleaned.categories++;
      }
    }
  }
  
  // 2. Clean Sheet1 transactions with test categories
  var s1 = _sheet('Sheet1');
  if (s1 && s1.getLastRow() > 1) {
    var txData = s1.getRange(2, 11, s1.getLastRow() - 1, 1).getValues(); // Column K = category
    for (var j = txData.length - 1; j >= 0; j--) {
      if (testPatterns.test(String(txData[j][0] || ''))) {
        // Change to 'أخرى' instead of deleting
        s1.getRange(j + 2, 11).setValue('أخرى');
        cleaned.transactions++;
      }
    }
  }
  
  // 3. Clean Budgets with test categories
  var sB = _sheet('Budgets');
  if (sB && sB.getLastRow() > 1) {
    var budgetData = sB.getRange(2, 1, sB.getLastRow() - 1, 1).getValues();
    for (var k = budgetData.length - 1; k >= 0; k--) {
      if (testPatterns.test(String(budgetData[k][0] || ''))) {
        sB.deleteRow(k + 2);
        cleaned.budgets++;
      }
    }
  }
  
  // Clear cache
  CacheService.getScriptCache().remove('UI_CATS');
  
  Logger.log('✅ Cleaned: ' + cleaned.categories + ' categories, ' + 
             cleaned.transactions + ' transactions, ' + cleaned.budgets + ' budgets');
  
  return cleaned;
}

// Normalize English category names to Arabic (storage + display)
function _normalizeCategoryNameArabic_(name) {
  if (!name) return '';
  var raw = String(name).trim();
  if (/[\u0600-\u06FF]/.test(raw)) return raw; // Already Arabic

  var key = raw.toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  var map = {
    'food dining': 'طعام',
    'food and dining': 'طعام',
    'food': 'طعام',
    'dining': 'طعام',
    'groceries': 'مواد غذائية',
    'restaurants': 'مطاعم ومقاهي',
    'transportation': 'نقل',
    'transport': 'نقل',
    'shopping': 'تسوق',
    'bills utilities': 'فواتير',
    'bills and utilities': 'فواتير',
    'utilities': 'فواتير',
    'bills': 'فواتير',
    'entertainment': 'ترفيه',
    'healthcare': 'صحة',
    'health': 'صحة',
    'education': 'تعليم',
    'family kids': 'عائلة وأطفال',
    'family and kids': 'عائلة وأطفال',
    'personal care': 'عناية شخصية',
    'home garden': 'سكن',
    'home and garden': 'سكن',
    'installments': 'أقساط',
    'charity donations': 'صدقة وتبرعات',
    'charity and donations': 'صدقة وتبرعات',
    'investment savings': 'استثمار وادخار',
    'investment and savings': 'استثمار وادخار',
    'work business': 'أعمال',
    'work and business': 'أعمال',
    'insurance': 'تأمين',
    'transfers': 'تحويل',
    'transfer': 'تحويل',
    'other': 'أخرى',
    'salary': 'راتب',
    'income': 'دخل',
    'fuel': 'وقود'
  };

  if (map[key]) return map[key];
  if (map[raw.toLowerCase()]) return map[raw.toLowerCase()];
  return raw;
}

function SOV1_UI_normalizeCategoriesToArabic_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  var result = { categories: 0, budgets: 0, transactions: 0 };

  // 1) Categories sheet
  var sCat = _sheet('Categories');
  if (sCat && sCat.getLastRow() > 1) {
    var header = sCat.getRange(1, 1, 1, sCat.getLastColumn()).getValues()[0].map(function(h){
      return String(h || '').trim();
    });
    var isEnglishSchema = (header[0] === 'Category ID' || header.indexOf('Category Name') >= 0);
    var nameCol = isEnglishSchema ? 2 : 1;
    var rows = sCat.getRange(2, nameCol, sCat.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      var cur = String(rows[i][0] || '').trim();
      if (!cur) continue;
      var norm = _normalizeCategoryNameArabic_(cur);
      if (norm && norm !== cur) {
        sCat.getRange(i + 2, nameCol).setValue(norm);
        result.categories++;
      }
    }
  }

  // 2) Budgets sheet
  var sB = _sheet('Budgets');
  if (sB && sB.getLastRow() > 1) {
    var bRows = sB.getRange(2, 1, sB.getLastRow() - 1, 1).getValues();
    for (var j = 0; j < bRows.length; j++) {
      var bCur = String(bRows[j][0] || '').trim();
      if (!bCur) continue;
      var bNorm = _normalizeCategoryNameArabic_(bCur);
      if (bNorm && bNorm !== bCur) {
        sB.getRange(j + 2, 1).setValue(bNorm);
        result.budgets++;
      }
    }
  }

  // 3) Transactions (Sheet1) column K = category
  var s1 = _sheet('Sheet1');
  if (s1 && s1.getLastRow() > 1) {
    var tRows = s1.getRange(2, 11, s1.getLastRow() - 1, 1).getValues();
    for (var k = 0; k < tRows.length; k++) {
      var tCur = String(tRows[k][0] || '').trim();
      if (!tCur) continue;
      var tNorm = _normalizeCategoryNameArabic_(tCur);
      if (tNorm && tNorm !== tCur) {
        s1.getRange(k + 2, 11).setValue(tNorm);
        result.transactions++;
      }
    }
  }

  CacheService.getScriptCache().remove('UI_CATS');
  return result;
}

function SOV1_UI_changeCategory_(row, newCategory) {
  row = Number(row||0);
  newCategory = String(newCategory||'').trim();
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  if (!newCategory) throw new Error('التصنيف فارغ');

  var s1 = _sheet('Sheet1');
  var sB = _sheet('Budgets');
  var r = s1.getRange(row, 1, 1, 13).getValues()[0];

  var amt = Number(r[8]) || 0;
  var oldCat = String(r[10] || 'أخرى');
  var typ = String(r[11]||'');
  var raw = String(r[12]||'');
  var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
  var delta = incoming ? -Math.max(amt,0) : Math.max(amt,0);

  s1.getRange(row, 11).setValue(newCategory);

  SOV1_UI_applyBudgetDelta_(sB, oldCat, -delta);
  SOV1_UI_applyBudgetDelta_(sB, newCategory, delta);

  SpreadsheetApp.flush();
  return { ok:true, row:row, from:oldCat, to:newCategory };
}

function SOV1_UI_applyBudgetDelta_(sB, category, delta) {
  category = String(category||'').trim();
  if (!category) return;

  var data = sB.getDataRange().getValues();
  var rowIdx = -1;
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||'') === category) { rowIdx = i+1; break; }
  }
  if (rowIdx < 0) {
    var next = sB.getLastRow()+1;
    sB.getRange(next,1,1,4).setValues([[category,0,0,'=B'+next+'-C'+next]]);
    rowIdx = next;
  }
  var curSpent = Number(sB.getRange(rowIdx,3).getValue()) || 0;
  sB.getRange(rowIdx,3).setValue(curSpent + delta);
}

/**
 * Check system configuration status
 */
function SOV1_UI_checkConfig_() {
  var props = PropertiesService.getScriptProperties();
  
  return {
    hasSheet: !!(props.getProperty('SHEET_ID')),
    hasTelegram: !!(props.getProperty('TELEGRAM_BOT_TOKEN') && props.getProperty('TELEGRAM_CHAT_ID')),
    hasAI: !!(props.getProperty('GROQ_KEY') || props.getProperty('GEMINI_KEY')),
    hasWebhook: !!(props.getProperty('WEBAPP_URL'))
  };
}

/**
 * Get budgets data for UI
 */
function SOV1_UI_getBudgets_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  try {
    var sB = _sheet('Budgets');
    var data = sB.getDataRange().getValues();
    var budgets = [];
    var catMap = _getCategoryNameMap_();

    function parseBudgetNumber_(v) {
      if (typeof v === 'number') return v;
      var s = String(v || '').trim();
      if (typeof normalizeNumber_ === 'function') {
        s = normalizeNumber_(s);
      }
      s = s.replace(/[^0-9.\-]/g, '');
      var n = Number(s);
      return isNaN(n) ? 0 : n;
    }
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][0]) continue;
      var rawCat = String(data[i][0] || '');
      var displayCat = catMap[rawCat] || rawCat;
      var limitVal = parseBudgetNumber_(data[i][1]);
      var spentVal = parseBudgetNumber_(data[i][2]);
      // Always calculate remaining dynamically (ignore stale sheet value)
      var remainingVal = limitVal - spentVal;
      budgets.push({
        category: displayCat,
        limit: limitVal || 0,
        spent: spentVal || 0,
        remaining: remainingVal
      });
    }
    
    return budgets;
  } catch (e) {
    Logger.log('Error getting budgets: ' + e.message);
    return [];
  }
}

/**
 * Quick setup for new users
 */
function SOV1_UI_quickSetup_(setupData) {
  try {
    var props = PropertiesService.getScriptProperties();
    
    // Set basic properties
    if (setupData.sheetId) {
      props.setProperty('SHEET_ID', setupData.sheetId);
    }
    
    if (setupData.botToken) {
      props.setProperty('TELEGRAM_BOT_TOKEN', setupData.botToken);
    }
    
    if (setupData.chatId) {
      props.setProperty('TELEGRAM_CHAT_ID', setupData.chatId);
    }
    
    // Initialize sheets if SHEET_ID is set
    if (setupData.sheetId) {
      if (typeof ENSURE_ALL_SHEETS === 'function') {
        ENSURE_ALL_SHEETS();
      }
    }
    
    return { success: true, message: 'تم الإعداد بنجاح' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Add manual transaction from UI
 */
function SOV1_UI_addManualTransaction_(text) {
  try {
    // Use the REAL parsing flow that exists
    var result = processTransaction(text, 'web_ui', ENV.CHAT_ID || '');
    return { success: true, result: result };
  } catch (e) {
    Logger.log('Add transaction error: ' + e.message);
    throw new Error('فشل إضافة العملية: ' + e.message);
  }
}

/**
 * Save user settings
 * Uses professional Settings.js implementation (Config sheet) when available
 */
function SOV1_UI_saveSettings_(settings) {
  try {
    // Preferred path: delegate to Settings.js logic which persists to Config sheet
    if (typeof saveSettings === 'function') {
      return saveSettings(settings || {});
    }

    // Fallback to legacy ScriptProperties behavior (kept for backward compatibility)
    var props = PropertiesService.getScriptProperties();
    var updated = [];
    
    if (settings && settings.user_name) {
      props.setProperty('OWNER', settings.user_name);
      updated.push('الاسم');
    }
    
    if (settings && settings.user_email) {
      props.setProperty('USER_EMAIL', settings.user_email);
      updated.push('البريد');
    }
    
    if (settings && typeof settings.enable_notifications !== 'undefined') {
      props.setProperty('NOTIFICATIONS_ENABLED', String(settings.enable_notifications));
      updated.push('الإشعارات');
    }
    
    Logger.log('Settings saved (fallback): ' + updated.join(', '));
    return { success: true, message: 'تم الحفظ: ' + updated.join(', ') };
  } catch (e) {
    Logger.log('Save settings error: ' + e.message);
    throw new Error('فشل حفظ الإعدادات: ' + e.message);
  }
}

function SOV1_UI_generateReportHtml_(token, mode) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  mode = String(mode||'month');
  var now = new Date();
  var title = (mode==='today') ? 'تقرير اليوم' : (mode==='week' ? 'تقرير الأسبوع' : 'تقرير الشهر');

  var start, end;
  if (mode === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0,0,0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0,0,0);
  } else if (mode === 'week') {
    var day = now.getDay();
    var offsetToSat = (day + 1) % 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offsetToSat, 0,0,0);
    end = new Date(start.getFullYear(), start.getMonth(), start.getDate()+7, 0,0,0);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0);
    end = new Date(now.getFullYear(), now.getMonth()+1, 1, 0,0,0);
  }

  var rows = _sheet('Sheet1').getDataRange().getValues();
  var spend=0, income=0, byCat={};

  for (var i=1;i<rows.length;i++){
    var d = rows[i][1];
    if (!(d instanceof Date) || d<start || d>=end) continue;

    var amt = Number(rows[i][8]) || 0;
    var cat = String(rows[i][10]||'أخرى');
    var typ = String(rows[i][11]||'');
    var raw = String(rows[i][12]||'');
    var incoming = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);

    if (incoming) income += Math.max(amt,0);
    else { spend += Math.max(amt,0); byCat[cat]=(byCat[cat]||0)+Math.max(amt,0); }
  }

  var cats = Object.keys(byCat).sort(function(a,b){return byCat[b]-byCat[a];});
  var rowsHtml = cats.map(function(c){
    return '<tr><td>'+c+'</td><td>'+byCat[c].toFixed(2)+'</td></tr>';
  }).join('');

  return (
    '<html lang="ar" dir="rtl"><head><meta charset="utf-8"/>' +
    '<style>body{font-family:Tahoma,Arial}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:right}th{background:#f3f3f3}</style>' +
    '</head><body>' +
    '<h2>'+title+'</h2>' +
    '<p>الدخل: <b>'+income.toFixed(2)+'</b> SAR<br/>' +
    'المصروف: <b>'+spend.toFixed(2)+'</b> SAR<br/>' +
    'الصافي: <b>'+(income-spend).toFixed(2)+'</b> SAR</p>' +
    '<h3>تفصيل حسب التصنيف</h3>' +
    '<table><thead><tr><th>التصنيف</th><th>المصروف</th></tr></thead><tbody>'+rowsHtml+'</tbody></table>' +
    '</body></html>'
  );
}

function SOV1_UI_runTest_(token, testName) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  testName = String(testName||'').trim();
  if (!testName) throw new Error('اسم الاختبار فارغ');
  if (typeof this[testName] !== 'function') throw new Error('الاختبار غير موجود: '+testName);

  // Execute test
  this[testName]();

  var sh = _sheet('Tests_Log');
  var last = sh.getLastRow();
  if (last < 2) return { ok:true, note:'لا يوجد سجل نتائج' };

  var r = sh.getRange(last,1,1,4).getValues()[0];
  return { ok:true, time:r[0], test:r[1], status:r[2], details:r[3] };
}

/** تصدير CSV لآخر N عمليات (ميزة تسويقية شائعة) */
function SOV1_UI_exportCsv_(token, limit) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  limit = Math.max(20, Math.min(Number(limit||200), 1000));
  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  if (last < 2) return 'لا توجد بيانات';

  var start = Math.max(2, last - limit + 1);
  var rows = s1.getRange(start,1,last-start+1,13).getValues();

  var header = ['التاريخ','القناة/المصدر','المبلغ','التاجر','التصنيف','النوع','النص الخام'];
  var lines = [header.join(',')];

  // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
  rows.forEach(function(r){
    var date = (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '';
    var src = String(r[5]||'').replace(/"/g,'""');
    var amt = Number(r[8]||0).toFixed(2);
    var merch = String(r[9]||'').replace(/"/g,'""');
    var cat = String(r[10]||'').replace(/"/g,'""');
    var typ = String(r[11]||'').replace(/"/g,'""');
    var raw = String(r[12]||'').replace(/"/g,'""');
    lines.push(['"'+date+'"','"'+src+'"',amt,'"'+merch+'"','"'+cat+'"','"'+typ+'"','"'+raw+'"'].join(','));
  });

  return lines.join('\n');
}

/** 
 * modern data fetcher for the new dashboard
 */
function SOV1_UI_getDashboardData_() {
  try {
    var s1 = _sheet('Sheet1'); 
    var values = s1.getDataRange().getValues();
    var now = new Date();
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    var income = 0;
    var expense = 0;
    var txs = [];
    var count = 0;

    for (var i = values.length - 1; i >= 1; i--) {
       var row = values[i];
       // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
       var date = row[1]; 
       var amount = Number(row[8]) || 0; 
       var merchant = String(row[9]||''); 
       var category = String(row[10]||'');
       var typ = String(row[11]||'');
       var raw = String(row[12]||'');

       if (count < 10) {
         txs.push({
           id: i,
           date: (date instanceof Date) ? date.toISOString() : null,
           amount: amount, 
           merchant: merchant,
           category: category
         });
         count++;
       }
       
       if (date instanceof Date && date >= monthStart) {
          var isIncome = /(وارد|إيداع|استلام|راتب)/i.test(typ) || /(وارد|إيداع|استلام|راتب)/i.test(raw);
          if (isIncome) income += amount;
          else expense += amount;
       }
    }
    
    return {
      stats: {
        income: income,
        expense: expense,
        savings: income - expense, 
        balance: (income - expense) 
      },
      transactions: txs
    };
  } catch (e) {
    return { stats: { income:0, expense:0, savings:0, balance:0 }, transactions: [] };
  }
}

/**
 * Get current user settings
 */
function SOV1_UI_getSettings_() {
  try {
    // Use the professional Settings.js function
    if (typeof getSettings === 'function') {
      return getSettings();
    }
    
    // Fallback to old method
    var props = PropertiesService.getScriptProperties();
    return {
      success: true,
      settings: {
        user_name: props.getProperty('OWNER') || '',
        user_email: Session.getActiveUser().getEmail(),
        default_currency: 'SAR',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        auto_apply_rules: true
      }
    };
  } catch (e) {
    Logger.log('Error getting settings: ' + e);
    return {
      success: false,
      error: e.message,
      settings: {
        user_name: '',
        user_email: Session.getActiveUser().getEmail(),
        default_currency: 'SAR',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        auto_apply_rules: true
      }
    };
  }
}

/**
 * Get report data for specific period
 */
function SOV1_UI_getReportData_(token, period) {
  if (!token || token !== 'OPEN') {
    return { error: 'Unauthorized' };
  }
  
  try {
    var s1 = _sheet('Sheet1');
    var values = s1.getDataRange().getValues();
    var now = new Date();
    var startDate;
    
    // Calculate date range based on period
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    } else {
      // monthly - use salary day instead of calendar month
      var settings = getSettings();
      var salaryDay = (settings && settings.settings && settings.settings.salary_day) || 27;
      
      if (now.getDate() >= salaryDay) {
        // Past salary day this month
        startDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);
      } else {
        // Before salary day - use last month's salary day
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, salaryDay);
      }
    }
    
    var income = 0;
    var expenses = 0;
    var byCategory = {};
    var txCount = 0;
    
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
      var date = row[1];
      var amount = Number(row[8]) || 0;
      var category = String(row[10] || 'أخرى');
      var typ = String(row[11] || '');
      var raw = String(row[12] || '');
      
      if (date instanceof Date && date >= startDate) {
        // ✅ Skip internal transfers - they don't affect net worth
        var isInternalTransfer = /(حوالة داخلية|تحويل داخلي|internal)/i.test(category) || 
                                  /(حوالة داخلية|تحويل داخلي|internal)/i.test(typ);
        if (isInternalTransfer) continue;
        
        // ✅ Skip unknown/POS as categories (poorly parsed)
        if (category === 'unknown' || category === 'POS') {
          category = 'أخرى';
        }
        
        txCount++;
        var isIncome = /(وارد|إيداع|استلام|راتب|income|deposit)/i.test(typ) || 
                       /(وارد|إيداع|استلام|راتب|income|deposit)/i.test(category) ||
                       /(وارد|إيداع|استلام|راتب)/i.test(raw);
        
        if (isIncome) {
          income += amount;
        } else {
          expenses += amount;
          if (!byCategory[category]) byCategory[category] = 0;
          byCategory[category] += amount;
        }
      }
    }
    
    // Convert to array for chart
    var chartData = [];
    for (var cat in byCategory) {
      chartData.push({ category: cat, amount: byCategory[cat] });
    }
    chartData.sort((a, b) => b.amount - a.amount);
    
    return {
      period: period,
      income: income,
      expenses: expenses,
      savings: income - expenses,
      transactionCount: txCount,
      byCategory: byCategory,
      chartData: chartData
    };
  } catch (e) {
    Logger.log('Error getting report data: ' + e);
    return { error: e.message };
  }
}

/**
 * Get user's configured accounts
 */
function SOV1_UI_getAccounts_() {
  try {
    // Attempt to use Accounts.js logic if available
    var idx = (typeof loadAccountsIndex_ === 'function') ? loadAccountsIndex_() : null;
    if (idx && idx.byLast) {
      // Reconstruct list from index
      var list = [];
      for (var k in idx.byLast) {
        list.push(idx.byLast[k]);
      }
      return list;
    }

    // Fallback: Read directly
    var s = _sheet('Accounts');
    if (s.getLastRow() < 2) return [];
    var data = s.getRange(2, 1, s.getLastRow()-1, 10).getValues();
    return data.map(function(r){
      return {
        name: r[0], type: r[1], num: r[2], bank: r[3], 
        balance: r[4], isMine: r[6], isInternal: r[7]
      };
    });
  } catch (e) {
    Logger.log('Error getting accounts: ' + e);
    return [];
  }
}

/**
 * UI: Get dashboard stats (Income, Expense, Balance, Savings)
 */
function SOV1_UI_getStats_() {
  var stats = { income: 0, expense: 0, balance: 0, savings: 0 };
  try {
    // 1. Balance
    var accs = SOV1_UI_getAccounts_();
    accs.forEach(function(a){ stats.balance += Number(a.balance)||0; });

    // 2. Monthly Stats
    var s1 = _sheet('Sheet1');
    if (s1.getLastRow() > 1) {
      var now = new Date();
      var startM = new Date(now.getFullYear(), now.getMonth(), 1);
      var data = s1.getRange(2, 1, s1.getLastRow()-1, 13).getValues();
      
      for(var i=0; i<data.length; i++) {
        var d = new Date(data[i][1]);
        if (d >= startM) {
          var amt = Number(data[i][8])||0;
          var type = String(data[i][11]||'').toLowerCase();
          var cat = String(data[i][10]||'');
          
          if (cat.indexOf('حوالة داخلية')!==-1 || type.indexOf('تحويل')!==-1) continue;
          
          if (/income|دخل|إيداع/.test(type)) stats.income += amt;
          else stats.expense += amt;
        }
      }
      stats.savings = stats.income - stats.expense;
    }
  } catch (e) { Logger.log(e); }
  return stats;
}

/**
 * UI: Get recent transactions
 */
function SOV1_UI_getTransactions_() {
  try {
    var s1 = _sheet('Sheet1');
    var lr = s1.getLastRow();
    if (lr < 2) return [];
    
    var count = 50;
    var start = Math.max(2, lr - count + 1);
    var data = s1.getRange(start, 1, lr - start + 1, 13).getValues();
    
    // Sort DESC
    data.sort(function(a,b){ return new Date(b[1]) - new Date(a[1]); });
    
    return data.map(function(r, idx) {
      return {
        uuid: r[0], date: r[1], amount: r[8], merchant: r[9],
        category: r[10], type: r[11], notes: r[12], account: r[6]
      };
    });
  } catch(e) { return []; }
}

/**
 * UI: Get Report
 */
function SOV1_UI_getReport_(period) {
  return SOV1_UI_getStats_(); // Simplified for now
}

/**
 * Get accounts with their current balances for dashboard display
 */
function SOV1_UI_getAccountsWithBalances_() {
  try {
    // Try to get balances from Balances.js function
    if (typeof getAccountsWithBalances_ === 'function') {
      return getAccountsWithBalances_();
    }
    
    // Fallback: Get from Balances sheet directly
    var ss = _ss();
    var balSheet = ss.getSheetByName('Balances');
    if (!balSheet || balSheet.getLastRow() < 2) {
      return [];
    }
    
    var data = balSheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      result.push({
        name: String(data[i][0] || ''),
        balance: Number(data[i][1] || 0),
        lastUpdate: data[i][2] || null
      });
    }
    
    return result;
  } catch (e) {
    Logger.log('Error getting accounts with balances: ' + e);
    return [];
  }
}

/**
 * Public wrapper for getting accounts with balances
 */
function SOV1_UI_getAccountsWithBalances() {
  try {
    return SOV1_UI_getAccountsWithBalances_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getAccountsWithBalances: ' + e);
    return [];
  }
}

/**
 * Delete a transaction by UUID (preferred) or row ID (fallback)
 * @param {string|number} identifier - UUID string or row number
 */
function SOV1_UI_deleteTransaction_(identifier) {
  try {
    if (!identifier) {
      return { error: 'معرف غير صالح' };
    }
    
    var s1 = _sheet('Sheet1');
    var rowToDelete = null;
    
    // Check if identifier is a UUID (string) or row number
    if (typeof identifier === 'string' && identifier.length > 4 && !/^\d+$/.test(identifier)) {
      // It's a UUID - find the row
      var data = s1.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === identifier) { // UUID is in column A (index 0)
          rowToDelete = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }
      if (!rowToDelete) {
        return { error: 'لم يتم العثور على العملية بهذا المعرف: ' + identifier };
      }
    } else {
      // It's a row number (legacy support)
      rowToDelete = Number(identifier);
      if (rowToDelete < 2) {
        return { error: 'رقم صف غير صالح' };
      }
    }
    
    s1.deleteRow(rowToDelete);
    
    Logger.log('✅ Deleted transaction - identifier: ' + identifier + ', row: ' + rowToDelete);
    return { success: true, message: 'تم حذف العملية بنجاح' };
  } catch (e) {
    Logger.log('Error deleting transaction: ' + e);
    return { error: e.message };
  }
}

/**
 * Update a transaction by UUID (preferred) or row ID (fallback)
 * @param {string|number} identifier - UUID string or row number
 * @param {object} newData - { amount, merchant, category, type, notes }
 */
function SOV1_UI_updateTransaction_(identifier, newData) {
  try {
    if (!identifier) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var s1 = _sheet('Sheet1');
    var rowToUpdate = null;
    
    // Check if identifier is a UUID (string) or row number
    if (typeof identifier === 'string' && identifier.length > 4 && !/^\d+$/.test(identifier)) {
      // It's a UUID - find the row
      var data = s1.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === identifier) { // UUID is in column A (index 0)
          rowToUpdate = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }
      if (!rowToUpdate) {
        return { success: false, error: 'لم يتم العثور على العملية بهذا المعرف: ' + identifier };
      }
    } else {
      // It's a row number (legacy support)
      rowToUpdate = Number(identifier);
      if (rowToUpdate < 2) {
        return { success: false, error: 'رقم صف غير صالح' };
      }
    }
    
    // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
    if (newData.amount !== undefined) s1.getRange(rowToUpdate, 9).setValue(Number(newData.amount) || 0);
    if (newData.merchant !== undefined) s1.getRange(rowToUpdate, 10).setValue(String(newData.merchant || ''));
    if (newData.category !== undefined) s1.getRange(rowToUpdate, 11).setValue(String(newData.category || ''));
    if (newData.type !== undefined) s1.getRange(rowToUpdate, 12).setValue(String(newData.type || ''));
    if (newData.notes !== undefined) s1.getRange(rowToUpdate, 13).setValue(String(newData.notes || ''));
    if (newData.account !== undefined) s1.getRange(rowToUpdate, 7).setValue(String(newData.account || ''));
    
    Logger.log('✅ Updated transaction - identifier: ' + identifier + ', row: ' + rowToUpdate);
    return { success: true, message: 'تم تحديث العملية بنجاح' };
  } catch (e) {
    Logger.log('Error updating transaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Get a single transaction by UUID (preferred) or row ID (fallback)
 * @param {string|number} identifier - UUID string or row number
 */
function SOV1_UI_getTransaction_(identifier) {
  try {
    if (!identifier) {
      return { success: false, error: 'معرف غير صالح' };
    }
    
    var s1 = _sheet('Sheet1');
    var row = null;
    var rowNumber = null;
    
    // Check if identifier is a UUID (string) or row number
    if (typeof identifier === 'string' && identifier.length > 4 && !/^\d+$/.test(identifier)) {
      // It's a UUID - find the row
      var data = s1.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] === identifier) {
          row = data[i];
          rowNumber = i + 1;
          break;
        }
      }
      if (!row) {
        return { success: false, error: 'لم يتم العثور على العملية' };
      }
    } else {
      // It's a row number (legacy support)
      rowNumber = Number(identifier);
      if (rowNumber < 2) {
        return { success: false, error: 'رقم صف غير صالح' };
      }
      var r = s1.getRange(rowNumber, 1, 1, 13).getValues()[0];
      row = r;
    }
    
    // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
    return {
      success: true,
      transaction: {
        uuid: row[0] || '',
        row: rowNumber,
        date: row[1],
        amount: Number(row[8] || 0),
        merchant: row[9] || '',
        category: row[10] || '',
        type: row[11] || '',
        account: row[6] || row[7] || '',
        notes: row[12] || '',
        source: row[5] || ''
      }
    };
  } catch (e) {
    Logger.log('Error getting transaction: ' + e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// PUBLIC API WRAPPERS (No trailing underscore for google.script.run access)
// All wrappers include error handling to ensure valid return values
// ============================================================================

function SOV1_UI_getSettings() {
  try {
    return SOV1_UI_getSettings_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getSettings: ' + e);
    return { success: false, error: e.message, settings: {} };
  }
}

function SOV1_UI_saveSettings(settingsData) {
  try {
    return SOV1_UI_saveSettings_(settingsData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_saveSettings: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getStats() {
  try {
    return SOV1_UI_getStats_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getStats: ' + e);
    return { income: 0, expense: 0, balance: 0, savings: 0 };
  }
}

function SOV1_UI_getTransactions() {
  try {
    return SOV1_UI_getTransactions_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getTransactions: ' + e);
    return [];
  }
}

function SOV1_UI_getBudgets(token) {
  try {
    return SOV1_UI_getBudgets_(token);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getBudgets: ' + e);
    return [];
  }
}

function SOV1_UI_saveBudget(categoryOrBudgetObj, limit) {
  try {
    // Handle both old signature (category, limit) and new (budgetObj)
    if (typeof categoryOrBudgetObj === 'object') {
      return SOV1_UI_saveBudget_(categoryOrBudgetObj.category, categoryOrBudgetObj.limit);
    }
    return SOV1_UI_saveBudget_(categoryOrBudgetObj, limit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_saveBudget: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteBudget(category) {
  try {
    return SOV1_UI_deleteBudget_(category);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteBudget: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getReport(period) {
  try {
    return SOV1_UI_getReport_(period);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getReport: ' + e);
    return null;
  }
}

function SOV1_UI_getAccounts() {
  try {
    // Use the comprehensive function from Accounts.js if available
    if (typeof SOV1_UI_getAllAccounts_ === 'function') {
      return SOV1_UI_getAllAccounts_();
    }
    return SOV1_UI_getAccounts_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getAccounts: ' + e);
    return [];
  }
}

function SOV1_UI_addManualTransaction(txData) {
  try {
    return SOV1_UI_addManualTransaction_(txData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_addManualTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_createTransaction(data) {
  try {
    if (typeof SOV1_UI_createTransaction_ === 'function') {
      return SOV1_UI_createTransaction_(data);
    } else {
      return { success: false, error: 'Function SOV1_UI_createTransaction_ not found' };
    }
  } catch (e) {
    Logger.log('Error in SOV1_UI_createTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_parseWithAI(text) {
  try {
    if (!text || !text.trim()) return { success: false, error: 'النص فارغ' };
    
    // Use the hybrid classifier (now with Grok support)
    if (typeof classifyWithAI === 'function') {
      var result = classifyWithAI(text);
      return { success: true, result: result };
    } else if (typeof callAiHybridV120 === 'function') {
      var result = callAiHybridV120(text);
      return { success: true, result: result };
    } else {
      return { success: false, error: 'AI engine not available' };
    }
  } catch (e) {
    Logger.log('Error in SOV1_UI_parseWithAI: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Bulk ingest SMS messages using the AI pipeline
 * @param {Array} texts - array of raw SMS messages
 */
function SOV1_UI_bulkIngestSMS(texts) {
  try {
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return { success: false, error: 'لا توجد رسائل' };
    }

    var added = 0;
    var errors = [];

    for (var i = 0; i < texts.length; i++) {
      var t = String(texts[i] || '').trim();
      if (!t) continue;
      try {
        var result = processTransaction(t, 'BULK_UI');
        if (result && result.uuid) added++;
        else errors.push({ index: i, error: 'فشل الإدخال' });
      } catch (eTx) {
        errors.push({ index: i, error: eTx.message });
      }
    }

    return { success: errors.length === 0, added: added, total: texts.length, errors: errors };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function SOV1_UI_checkConfig() {
  try {
    return SOV1_UI_checkConfig_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_checkConfig: ' + e);
    return { hasSheet: false, hasTelegram: false, hasAI: false };
  }
}

function SOV1_UI_getDashboard(token) {
  try {
    return SOV1_UI_getDashboard_(token);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getDashboard: ' + e);
    return { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, recent: [], budgets: [] };
  }
}

function SOV1_UI_getLatest(token, limit) {
  try {
    var result = SOV1_UI_getLatest_(token, limit);
    return result || [];
  } catch (e) {
    Logger.log('Error in SOV1_UI_getLatest: ' + e);
    return [];
  }
}

function SOV1_UI_quickSetup(setupData) {
  try {
    return SOV1_UI_quickSetup_(setupData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_quickSetup: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getReportData(token, period) {
  try {
    return SOV1_UI_getReportData_(token, period);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getReportData: ' + e);
    return null;
  }
}

function SOV1_UI_addAccount(accountData) {
  try {
    return SOV1_UI_addAccount_(accountData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_addAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_updateAccount(rowId, accountData) {
  try {
    return SOV1_UI_updateAccount_(rowId, accountData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_deleteAccount(rowId) {
  try {
    return SOV1_UI_deleteAccount_(rowId);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteAccount: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_extractAccountFromSMS(smsText) {
  try {
    return SOV1_UI_extractAccountFromSMS_(smsText);
  } catch (e) {
    Logger.log('Error in SOV1_UI_extractAccountFromSMS: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_bulkExtractAccounts(smsArray) {
  try {
    return SOV1_UI_bulkExtractAccounts_(smsArray);
  } catch (e) {
    Logger.log('Error in SOV1_UI_bulkExtractAccounts: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_bulkAddAccounts(accounts) {
  try {
    return SOV1_UI_bulkAddAccounts_(accounts);
  } catch (e) {
    Logger.log('Error in SOV1_UI_bulkAddAccounts: ' + e);
    return { success: false, error: e.message };
  }
} 

function SOV1_UI_updateBudget(category, newLimit) {
  try {
    return SOV1_UI_updateBudget_(category, newLimit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateBudget: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * ✅ تحديث رصيد حساب من الواجهة
 */
function SOV1_UI_updateAccountBalance(accountNumber, newBalance) {
  try {
    if (typeof setBalance_ === 'function') {
      setBalance_(accountNumber, Number(newBalance) || 0);
      return { success: true, message: 'تم تحديث الرصيد' };
    }
    return { success: false, error: 'دالة تحديث الرصيد غير متاحة' };
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateAccountBalance: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * ✅ الحصول على ملخص الديون
 */
function SOV1_UI_getDebtSummary() {
  try {
    if (typeof getDebtSummary_ === 'function') {
      return { success: true, data: getDebtSummary_() };
    }
    return { success: false, error: 'دالة الديون غير متاحة' };
  } catch (e) {
    Logger.log('Error in SOV1_UI_getDebtSummary: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_updateTransaction(rowId, newData) {
  try {
    return SOV1_UI_updateTransaction_(rowId, newData);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

function SOV1_UI_getTransaction(rowId) {
  try {
    return SOV1_UI_getTransaction_(rowId);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// DATA MANAGEMENT - EXPORT & DELETE
// ============================================================================

/**
 * Export all transactions as CSV
 */
function SOV1_UI_exportData() {
  try {
    var ss = _ss(); // Use _ss() for web app context
    var sheet = ss.getSheetByName('Sheet1');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return 'ID,Date,Merchant,Type,Amount,Category,Account\n';
    }
    
    var data = sheet.getDataRange().getValues();
    var csv = 'ID,Date,Merchant,Type,Amount,Category,Account,Notes\n';
    
    // Start from row 1 (skip header at row 0)
    // SCHEMA: UUID[0], Date[1], Tag[2], Day[3], Week[4], Source[5], AccNum[6], CardNum[7], Amount[8], Merchant[9], Category[10], Type[11], Raw[12]
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = row[0] || '';
      var date = row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '';
      var merchant = String(row[9] || '').replace(/"/g, '""'); // Escape quotes
      var type = row[11] || '';
      var amount = row[8] || 0;
      var category = row[10] || '';
      var account = row[6] || '';
      var notes = String(row[12] || '').replace(/"/g, '""');
      
      csv += '"' + id + '","' + date + '","' + merchant + '","' + type + '","' + amount + '","' + category + '","' + account + '","' + notes + '"\n';
    }
    
    return csv;
    
  } catch (e) {
    Logger.log('Error exporting data: ' + e);
    return 'Error,' + e.message + '\n';
  }
}

/**
 * Delete all user data (DANGEROUS) - Uses new SOV1_UI_resetData_ function
 */
function SOV1_UI_deleteAllData() {
  try {
    // Use the new reset function instead
    return SOV1_UI_resetData_('OPEN', ['transactions', 'budgets', 'accounts', 'transfers'], 'CONFIRM_RESET');
  } catch (e) {
    Logger.log('Error deleting all data: ' + e);
    return {
      success: false,
      error: 'فشل حذف البيانات: ' + e.message
    };
  }
}

/**
 * Wipe everything (transactions, budgets, accounts, transfers, categories)
 */
function SOV1_UI_wipeAllData() {
  try {
    return SOV1_UI_resetData_('OPEN', ['transactions', 'budgets', 'accounts', 'transfers', 'categories'], 'CONFIRM_RESET');
  } catch (e) {
    Logger.log('Error wiping all data: ' + e);
    return {
      success: false,
      error: 'فشل حذف كل البيانات: ' + e.message
    };
  }
}

/**
 * Restore default Categories, Budgets (aligned), and Accounts
 */
function SOV1_UI_restoreDefaults() {
  try {
    var ss = _ss();

    // 1) Categories
    if (typeof SOV1_SETUP_CATEGORIES_SHEET_ === 'function') {
      SOV1_SETUP_CATEGORIES_SHEET_();
    }

    // 2) Budgets aligned to Categories (limit=0, spent=0)
    var sBudgets = ss.getSheetByName('Budgets');
    if (!sBudgets) {
      sBudgets = ss.insertSheet('Budgets');
      sBudgets.appendRow(['Category', 'Budgeted', 'Spent', 'Remaining', '% Used', 'Alert Threshold', 'Status']);
      sBudgets.setFrozenRows(1);
    }

    var sCat = ss.getSheetByName('Categories');
    var catNames = [];
    if (sCat && sCat.getLastRow() > 1) {
      var catData = sCat.getRange(2, 1, sCat.getLastRow() - 1, 1).getValues();
      catNames = catData.map(function(r){ return String(r[0] || '').trim(); }).filter(function(n){ return n.length > 0; });
    }

    // If categories still empty, seed defaults directly
    if (!sCat || catNames.length === 0) {
      sCat = sCat || ss.insertSheet('Categories');
      if (sCat.getLastRow() === 0) {
        sCat.appendRow(['التصنيف', 'الأيقونة', 'اللون', 'نشط', 'ملاحظات']);
        sCat.setFrozenRows(1);
        sCat.setRightToLeft(true);
      }

      var defaults = [
        ['طعام', '🍽️', '#EF4444', 'نعم', 'مطاعم، كافيهات، بقالة'],
        ['نقل', '🚗', '#F59E0B', 'نعم', 'وقود، أوبر، مواصلات'],
        ['فواتير', '📄', '#3B82F6', 'نعم', 'كهرباء، ماء، اتصالات'],
        ['تسوق', '🛍️', '#8B5CF6', 'نعم', 'ملابس، إلكترونيات'],
        ['سكن', '🏠', '#10B981', 'نعم', 'إيجار، صيانة'],
        ['ترفيه', '🎬', '#EC4899', 'نعم', 'سينما، اشتراكات'],
        ['صحة', '💊', '#06B6D4', 'نعم', 'طبيب، أدوية'],
        ['تعليم', '📚', '#6366F1', 'نعم', 'دورات، كتب'],
        ['سحب نقدي', '🏧', '#64748B', 'نعم', 'سحب صراف، ATM'],
        ['راتب', '💰', '#22C55E', 'نعم', 'الراتب الشهري'],
        ['تحويل', '↔️', '#64748B', 'نعم', 'تحويلات بنكية'],
        ['أخرى', '📦', '#6B7280', 'نعم', 'مصروفات متنوعة']
      ];

      var startRow = sCat.getLastRow() + 1;
      sCat.getRange(startRow, 1, defaults.length, 5).setValues(defaults);

      catNames = defaults.map(function(r){ return r[0]; });
    }

    // Clear existing budgets rows
    if (sBudgets.getLastRow() > 1) {
      sBudgets.deleteRows(2, sBudgets.getLastRow() - 1);
    }

    var budgetRows = catNames.map(function(name){
      return [name, 0, 0, 0, 0, 80, ''];
    });
    if (budgetRows.length > 0) {
      sBudgets.getRange(2, 1, budgetRows.length, 7).setValues(budgetRows);
    }

    // 3) Accounts (restore your 7 accounts with zero balance)
    var sAcc = ss.getSheetByName('Accounts');
    if (!sAcc) {
      sAcc = ss.insertSheet('Accounts');
      sAcc.appendRow(['الاسم','النوع','الرقم','البنك','الرصيد','آخر_تحديث','حسابي','تحويل_داخلي','أسماء_بديلة','ملاحظات']);
      sAcc.setFrozenRows(1);
    }

    if (sAcc.getLastRow() > 1) {
      sAcc.deleteRows(2, sAcc.getLastRow() - 1);
    }

    var now = new Date();
    var accounts = [
      ['SAIB', 'بنك', '8001', 'SAIB', 0, now, 'true', 'true', 'SAIB, SAIB-8001', 'restored'],
      ['STC Bank', 'بنك', '1929', 'STC Bank', 0, now, 'true', 'true', 'STC Bank, STC-1929', 'restored'],
      ['Tiqmo', 'محفظة', '9682', 'Tiqmo', 0, now, 'true', 'true', 'Tiqmo, Tiqmo-9682', 'restored'],
      ['D360', 'بنك', '3449', 'D360', 0, now, 'true', 'true', 'D360, D360-3449', 'restored'],
      ['الراجحي-9767', 'بنك', '9767', 'Alrajhi', 0, now, 'true', 'true', 'Alrajhi-9767, Alrajhi', 'restored'],
      ['الراجحي-9765', 'بنك', '9765', 'Alrajhi', 0, now, 'true', 'true', 'Alrajhi-9765, Alrajhi', 'restored'],
      ['الراجحي-1626', 'بنك', '1626', 'Alrajhi', 0, now, 'true', 'true', 'Alrajhi-1626, Alrajhi', 'restored']
    ];
    sAcc.getRange(2, 1, accounts.length, 10).setValues(accounts);

    // Clear caches
    CacheService.getScriptCache().remove('ACCOUNTS_INDEX_V2');
    CacheService.getScriptCache().remove('SJA_DASH_DATA');
    CacheService.getScriptCache().remove('UI_CATS');

    return { success: true, categories: catNames.length, budgets: budgetRows.length, accounts: accounts.length };
  } catch (e) {
    Logger.log('Restore defaults error: ' + e);
    return { success: false, error: e.message };
  }
}

// Legacy alias - keep for backward compatibility with old frontend calls
function SOV1_UI_deleteUserAccount() {
  return SOV1_UI_deleteAllData();
}

// ============================================================================
// OPTIMIZED: Single API call to get all dashboard data at once
// ============================================================================

function SOV1_UI_getAllDashboardData(token) {
  var debugLog = [];
  
  try {
    debugLog.push('🔷 Function started');
    token = token || 'OPEN';
    
    // CRITICAL: Check if SpreadsheetApp is accessible via SHEET_ID
    try {
      var ss = _ss(); // Use _ss() instead of getActive() for web app context
      debugLog.push('✅ SpreadsheetApp accessible via SHEET_ID: ' + ss.getId());
    } catch (ssError) {
      return {
        success: false,
        error: 'Cannot access spreadsheet: ' + ssError.message + ' (SHEET_ID might be missing in Script Properties)',
        debugLog: debugLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }
    
    // Verify authentication
    debugLog.push('🔐 Checking authentication...');
    if (!SOV1_UI_requireAuth_(token)) {
      debugLog.push('❌ Authentication failed');
      return {
        success: false,
        error: 'غير مصرح - Authentication failed',
        debugLog: debugLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }
    
    debugLog.push('✅ Authentication passed');
    
    // Get all data with detailed error tracking
    var dashboard, transactions, budgets, accounts;
    
    try {
      debugLog.push('📊 Fetching dashboard...');
      dashboard = SOV1_UI_getDashboard_(token);
      debugLog.push('✅ Dashboard fetched: ' + (dashboard ? 'OK' : 'NULL'));
    } catch (e) {
      debugLog.push('⚠️ Dashboard error: ' + e.message);
      dashboard = { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] };
    }
    
    try {
      debugLog.push('📝 Fetching transactions...');
      transactions = SOV1_UI_getLatest_(token, 50);
      debugLog.push('✅ Transactions fetched: ' + (transactions ? transactions.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Transactions error: ' + e.message);
      transactions = [];
    }
    
    try {
      debugLog.push('💰 Fetching budgets...');
      budgets = SOV1_UI_getBudgets_(token);
      debugLog.push('✅ Budgets fetched: ' + (budgets ? budgets.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Budgets error: ' + e.message);
      budgets = [];
    }
    
    try {
      debugLog.push('🏦 Fetching accounts...');
      accounts = (typeof SOV1_UI_getAllAccounts_ === 'function') ? SOV1_UI_getAllAccounts_() : SOV1_UI_getAccountsWithBalances_();
      debugLog.push('✅ Accounts fetched: ' + (accounts ? accounts.length : 0));
    } catch (e) {
      debugLog.push('⚠️ Accounts error: ' + e.message);
      accounts = [];
    }
    
    debugLog.push('✅ All data collected successfully');
    
    var result = {
      success: true,
      debugLog: debugLog,
      dashboard: dashboard,
      transactions: transactions,
      budgets: budgets,
      accounts: accounts
    };
    
    return result;
    
  } catch (e) {
    debugLog.push('❌ CRITICAL Error: ' + e.message);
    debugLog.push('Stack: ' + e.stack);
    
    return {
      success: false,
      error: e.message,
      errorStack: e.stack,
      debugLog: debugLog,
      dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
      transactions: [],
      budgets: [],
      accounts: []
    };
  }
}

// ============================================================================
// DATA RESET FUNCTIONS - DANGER ZONE
// ============================================================================

/**
 * Get reset options and current data stats
 */
function SOV1_UI_getResetOptions_() {
  try {
    var ss = _ss();
    var stats = {
      transactions: 0,
      budgets: 0,
      accounts: 0,
      transfers: 0,
      categories: 0
    };
    
    // Count transactions
    var txSheet = ss.getSheetByName('User_USER1') || ss.getSheetByName('Sheet1');
    if (txSheet) {
      stats.transactions = Math.max(0, txSheet.getLastRow() - 1);
    }
    
    // Count budgets
    var budgetSheet = ss.getSheetByName('Budgets');
    if (budgetSheet) {
      stats.budgets = Math.max(0, budgetSheet.getLastRow() - 1);
    }
    
    // Count accounts
    var accSheet = ss.getSheetByName('Accounts');
    if (accSheet) {
      stats.accounts = Math.max(0, accSheet.getLastRow() - 1);
    }
    
    // Count transfers
    var transferSheet = ss.getSheetByName('Transfers_Tracking');
    if (transferSheet) {
      stats.transfers = Math.max(0, transferSheet.getLastRow() - 1);
    }
    
    // Count categories
    var catSheet = ss.getSheetByName('Categories');
    if (catSheet) {
      stats.categories = Math.max(0, catSheet.getLastRow() - 1);
    }
    
    return {
      success: true,
      stats: stats,
      options: [
        { id: 'transactions', label: 'المعاملات', icon: '💳', count: stats.transactions, dangerous: true },
        { id: 'budgets', label: 'الميزانيات', icon: '📊', count: stats.budgets, dangerous: false },
        { id: 'accounts', label: 'الحسابات', icon: '🏦', count: stats.accounts, dangerous: true },
        { id: 'transfers', label: 'التحويلات', icon: '↔️', count: stats.transfers, dangerous: false },
        { id: 'categories', label: 'التصنيفات', icon: '🏷️', count: stats.categories, dangerous: false },
        { id: 'all', label: 'كل البيانات', icon: '⚠️', count: null, dangerous: true }
      ]
    };
    
  } catch (e) {
    Logger.log('getResetOptions error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Reset selected data types
 * @param {string} token - Security token
 * @param {Array} types - Array of data types to reset: 'transactions', 'budgets', 'accounts', 'transfers', 'categories', 'all'
 * @param {string} confirmation - Must be 'CONFIRM_RESET' to proceed
 */
function SOV1_UI_resetData_(token, types, confirmation) {
  try {
    // Validate confirmation
    if (confirmation !== 'CONFIRM_RESET') {
      return { success: false, error: 'تأكيد غير صحيح. يجب كتابة CONFIRM_RESET' };
    }
    
    if (!types || !Array.isArray(types) || types.length === 0) {
      return { success: false, error: 'لم يتم تحديد نوع البيانات للحذف' };
    }
    
    var ss = _ss();
    var results = {
      success: true,
      deleted: {},
      errors: []
    };
    
    // Handle 'all' option
    if (types.includes('all')) {
      types = ['transactions', 'budgets', 'accounts', 'transfers'];
    }
    
    // Process each type
    types.forEach(function(type) {
      try {
        switch (type) {
          case 'transactions':
            results.deleted.transactions = resetTransactions_(ss);
            break;
          case 'budgets':
            results.deleted.budgets = resetBudgets_(ss);
            break;
          case 'accounts':
            results.deleted.accounts = resetAccounts_(ss);
            break;
          case 'transfers':
            results.deleted.transfers = resetTransfers_(ss);
            break;
          case 'categories':
            results.deleted.categories = resetCategories_(ss);
            break;
        }
      } catch (typeError) {
        results.errors.push(type + ': ' + typeError.message);
      }
    });
    
    if (results.errors.length > 0) {
      results.success = false;
      results.error = 'بعض الأخطاء: ' + results.errors.join(', ');
    }
    
    // Log the reset action
    Logger.log('🗑️ Data reset by user: ' + JSON.stringify(results.deleted));
    
    // Send Telegram notification if available
    try {
      if (typeof sendTelegramMessage === 'function') {
        var chatId = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');
        if (chatId) {
          var msg = '⚠️ *تم تصفير البيانات*\n\n';
          for (var key in results.deleted) {
            msg += '• ' + key + ': ' + results.deleted[key] + ' سجل\n';
          }
          sendTelegramMessage(chatId, msg);
        }
      }
    } catch (tgErr) {
      // Ignore Telegram errors
    }
    
    return results;
    
  } catch (e) {
    Logger.log('resetData error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Reset transactions (keep headers)
 */
function resetTransactions_(ss) {
  var sheets = ['User_USER1', 'Sheet1'];
  var totalDeleted = 0;
  
  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet && sheet.getLastRow() > 1) {
      var rowsToDelete = sheet.getLastRow() - 1;
      sheet.deleteRows(2, rowsToDelete);
      totalDeleted += rowsToDelete;
    }
  });
  
  return totalDeleted;
}

/**
 * Reset budgets (keep headers, reset amounts to 0)
 */
function resetBudgets_(ss) {
  var sheet = ss.getSheetByName('Budgets');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var lastRow = sheet.getLastRow();
  var resetCount = lastRow - 1;
  
  // Reset spent amounts to 0 (assuming column structure: category, budgeted, spent, remaining)
  for (var row = 2; row <= lastRow; row++) {
    sheet.getRange(row, 3).setValue(0); // Reset spent
    sheet.getRange(row, 4).setFormula('=B' + row + '-C' + row); // Recalculate remaining
  }
  
  return resetCount;
}

/**
 * Reset accounts (delete all except headers)
 */
function resetAccounts_(ss) {
  var sheet = ss.getSheetByName('Accounts');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var rowsToDelete = sheet.getLastRow() - 1;
  sheet.deleteRows(2, rowsToDelete);
  
  // Clear account index cache
  if (typeof _accountIndex !== 'undefined') {
    _accountIndex = null;
  }
  
  return rowsToDelete;
}

/**
 * Reset transfers (delete all except headers)
 */
function resetTransfers_(ss) {
  var sheet = ss.getSheetByName('Transfers_Tracking');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  var rowsToDelete = sheet.getLastRow() - 1;
  sheet.deleteRows(2, rowsToDelete);
  return rowsToDelete;
}

/**
 * Reset categories (delete non-system categories)
 */
function resetCategories_(ss) {
  var sheet = ss.getSheetByName('Categories');
  if (!sheet || sheet.getLastRow() <= 1) return 0;
  
  // System categories to keep
  var systemCategories = ['أخرى', 'راتب', 'تحويل', 'تحقق', 'مرفوضة', 'طعام', 'نقل', 'فواتير', 'تسوق', 'صحة', 'ترفيه'];
  
  var data = sheet.getDataRange().getValues();
  var rowsToDelete = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    var catName = data[i][0];
    if (!systemCategories.includes(catName)) {
      rowsToDelete.push(i + 1); // 1-based row number
    }
  }
  
  // Delete rows from bottom to top
  rowsToDelete.forEach(function(row) {
    sheet.deleteRow(row);
  });
  
  return rowsToDelete.length;
}

// ============================================================================
// SAFE WRAPPER: Ensures non-null, JSON-serializable response for web UI
// Call this from google.script.run instead of SOV1_UI_getAllDashboardData
// ============================================================================

function SOV1_UI_getAllDashboardData_safe(token) {
  var wrapperLog = [];
  try {
    wrapperLog.push('Wrapper: calling SOV1_UI_getAllDashboardData');
    var raw = SOV1_UI_getAllDashboardData(token);

    if (!raw || typeof raw !== 'object') {
      wrapperLog.push('Wrapper: raw result is null or non-object');
      return {
        success: false,
        error: 'Server returned empty or invalid response',
        debugLog: wrapperLog,
        dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
        transactions: [],
        budgets: [],
        accounts: []
      };
    }

    // Force JSON-safe clone to avoid serialization issues
    var cloned = JSON.parse(JSON.stringify(raw));

    if (!cloned.debugLog || !Array.isArray(cloned.debugLog)) {
      cloned.debugLog = [];
    }

    cloned.debugLog = cloned.debugLog.concat(wrapperLog);
    cloned.debugLog.push('Wrapper: JSON-safe clone OK');

    return cloned;
  } catch (e) {
    wrapperLog.push('Wrapper error: ' + e.message);
    return {
      success: false,
      error: 'SOV1_UI_getAllDashboardData_safe failed: ' + e.message,
      errorStack: e.stack,
      debugLog: wrapperLog,
      dashboard: { kpi: { incomeM: 0, spendM: 0, netM: 0, totalRemain: 0 }, dup7d: [] },
      transactions: [],
      budgets: [],
      accounts: []
    };
  }
}

// ============================================================================
// TEST PANEL FUNCTIONS - For Frontend Testing
// ============================================================================

/**
 * Test SMS parsing functionality
 */
function SOV1_UI_testParseSMS(smsText) {
  try {
    // Use the enhanced parser if available
    var parsed = null;
    
    if (typeof enhancedParseAmount === 'function') {
      parsed = enhancedParseAmount(smsText);
    } else if (typeof parseBasicSMS_ === 'function') {
      parsed = parseBasicSMS_(smsText);
    } else if (typeof SOV1_preParseFallback_ === 'function') {
      parsed = SOV1_preParseFallback_(smsText);
    }
    
    if (parsed && parsed.amount) {
      return {
        success: true,
        amount: parsed.amount,
        merchant: parsed.merchant || 'غير محدد',
        account: parsed.account || 'غير محدد',
        type: parsed.type || (parsed.amount > 0 ? 'expense' : 'income'),
        raw: parsed
      };
    }
    
    return {
      success: false,
      error: 'لم يتم العثور على مبلغ في النص'
    };
  } catch (e) {
    Logger.log('Test SMS Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test AI classification
 */
function SOV1_UI_testAIClassify(merchant, amount) {
  try {
    var result = null;
    
    if (typeof classifyWithAI === 'function') {
      result = classifyWithAI(merchant, amount);
    } else if (typeof callAiHybridV120 === 'function') {
      result = callAiHybridV120(merchant, amount);
    } else if (typeof SOV1_callAiClassifier_ === 'function') {
      result = SOV1_callAiClassifier_(merchant, amount);
    }
    
    if (result) {
      return {
        success: true,
        category: result.category || result,
        confidence: result.confidence || 100,
        source: result.source || 'AI'
      };
    }
    
    // Fallback to simple classifier
    var categories = {
      'ماكدونالدز': 'مطاعم',
      'subway': 'مطاعم',
      'starbucks': 'مطاعم',
      'careem': 'نقل',
      'uber': 'نقل',
      'جرير': 'تسوق',
      'اكسترا': 'تسوق'
    };
    
    var lower = String(merchant).toLowerCase();
    for (var key in categories) {
      if (lower.indexOf(key.toLowerCase()) >= 0) {
        return {
          success: true,
          category: categories[key],
          confidence: 80,
          source: 'Keyword Match'
        };
      }
    }
    
    return {
      success: true,
      category: 'أخرى',
      confidence: 50,
      source: 'Default'
    };
  } catch (e) {
    Logger.log('Test AI Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test Telegram connection
 */
function SOV1_UI_testTelegram() {
  try {
    var botToken = ENV.TG_BOT_TOKEN || PropertiesService.getScriptProperties().getProperty('TG_BOT_TOKEN');
    var chatId = ENV.TG_CHAT_ID || PropertiesService.getScriptProperties().getProperty('TG_CHAT_ID');
    
    if (!botToken || !chatId) {
      return {
        success: false,
        error: 'لم يتم إعداد Telegram Bot Token أو Chat ID'
      };
    }
    
    var testMessage = '🧪 *رسالة تجريبية*\n\n' +
      '✅ تم الاتصال بنجاح!\n' +
      '📅 التاريخ: ' + new Date().toLocaleString('ar-SA') + '\n\n' +
      '_هذه رسالة اختبار من SJA Money Tracker_';
    
    var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    var payload = {
      chat_id: chatId,
      text: testMessage,
      parse_mode: 'Markdown'
    };
    
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description || 'Unknown error' };
    }
  } catch (e) {
    Logger.log('Test Telegram Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Test full flow: SMS -> AI -> Save -> Telegram
 */
function SOV1_UI_testFullFlow() {
  var steps = { sms: 'pending', ai: 'pending', save: 'skipped', telegram: 'pending' };
  
  try {
    // Step 1: Test SMS Parsing
    var testSMS = 'تم خصم مبلغ 99.50 ريال من حسابك ****1234 لدى كوفي شوب في ' + new Date().toLocaleDateString('ar-SA');
    var smsResult = SOV1_UI_testParseSMS(testSMS);
    
    if (smsResult.success) {
      steps.sms = '✅ Amount: ' + smsResult.amount + ', Merchant: ' + smsResult.merchant;
    } else {
      steps.sms = '❌ ' + (smsResult.error || 'Failed');
      return { success: false, steps: steps, error: 'SMS parsing failed' };
    }
    
    // Step 2: Test AI Classification
    var aiResult = SOV1_UI_testAIClassify(smsResult.merchant, smsResult.amount);
    
    if (aiResult.success) {
      steps.ai = '✅ Category: ' + aiResult.category + ' (' + aiResult.source + ')';
    } else {
      steps.ai = '❌ ' + (aiResult.error || 'Failed');
      return { success: false, steps: steps, error: 'AI classification failed' };
    }
    
    // Step 3: Skip actual save (test only)
    steps.save = '⏭️ Skipped (test mode - no data saved)';
    
    // Step 4: Test Telegram
    var telegramResult = SOV1_UI_testTelegram();
    
    if (telegramResult.success) {
      steps.telegram = '✅ Message sent';
    } else {
      steps.telegram = '⚠️ ' + (telegramResult.error || 'Failed') + ' (non-critical)';
    }
    
    return {
      success: true,
      steps: steps,
      summary: 'جميع المكونات تعمل بشكل صحيح!'
    };
    
  } catch (e) {
    Logger.log('Test Full Flow Error: ' + e.message);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// ACCOUNT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all accounts for management UI
 */
function SOV1_UI_getAccountsManage_(token) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  var sAcc = _sheet('Accounts');
  if (!sAcc) {
    // If sheet doesn't exist, try to create with unified schema
    if (typeof ensureAccountsSheet_ === 'function') {
      sAcc = ensureAccountsSheet_();
    } else {
      return []; 
    }
  }
  
  var last = sAcc.getLastRow();
  if (last < 2) return [];
  
  // Headers: ['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات']
  var data = sAcc.getRange(2, 1, last - 1, 10).getValues();
  var accounts = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = i + 2;
    var name = String(data[i][0] || '').trim();
    if (!name) continue;
    
    accounts.push({
      row: row,
      name: name,
      type: String(data[i][1] || ''),
      number: String(data[i][2] || ''),
      bank: String(data[i][3] || ''),
      balance: Number(data[i][4] || 0),
      lastUpdate: data[i][5] ? Utilities.formatDate(data[i][5], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm') : '',
      isMine: String(data[i][6] || '').toUpperCase() === 'TRUE',
      isInternal: String(data[i][7] || '').toUpperCase() === 'TRUE',
      aliases: String(data[i][8] || ''),
      notes: String(data[i][9] || '')
    });
  }
  
  return accounts;
}

/**
 * Add a new account
 */
function SOV1_UI_addAccount_manage_(token, name, number, bank, balance) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  name = String(name || '').trim();
  number = String(number || '').trim();
  bank = String(bank || '').trim();
  balance = Number(balance || 0);
  
  if (!name) throw new Error('اسم الحساب مطلوب');
  
  var sAcc = _sheet('Accounts');
  if (!sAcc) {
    if (typeof ensureBalancesSheet_ === 'function') {
      sAcc = ensureBalancesSheet_();
    } else {
      throw new Error('جدول الحسابات غير موجود');
    }
  }
  
  // Check if number already exists
  if (number) {
    var data = sAcc.getRange(2, 3, Math.max(1, sAcc.getLastRow() - 1), 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === number) {
        throw new Error('رقم الحساب موجود مسبقاً');
      }
    }
  }
  
  // Append new account
  // ['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'SMS_Pattern', 'أسماء_بديلة', 'ملاحظات']
  sAcc.appendRow([
    name, 
    'حساب', 
    number, 
    bank, 
    balance, 
    new Date(), 
    'TRUE', 
    '', 
    '', 
    ''
  ]);
  
  // Invalidate caches if DataLinkage exists
  if (typeof invalidateAllCaches_ === 'function') {
    invalidateAllCaches_();
  }
  
  return { ok: true, name: name };
}

/**
 * Update an account
 */
function SOV1_UI_updateAccount_manage_(token, row, name, number, bank, balance, isMine) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  var sAcc = _sheet('Accounts');
  if (!sAcc) throw new Error('جدول الحسابات غير موجود');
  
  name = String(name || '').trim();
  if (!name) throw new Error('اسم الحساب مطلوب');
  
  // Ensure strict boolean
  var isMineVal = (isMine === true || isMine === 'true' || isMine === 'TRUE') ? 'TRUE' : 'FALSE';
  
  // Update columns: Name(A), Number(C), Bank(D), Balance(E), LastUpdate(F), IsMine(G)
  // Indexes (1-based): 1, 3, 4, 5, 6, 7
  
  sAcc.getRange(row, 1).setValue(name);
  sAcc.getRange(row, 3).setValue(number);
  sAcc.getRange(row, 4).setValue(bank);
  sAcc.getRange(row, 5).setValue(Number(balance||0));
  sAcc.getRange(row, 6).setValue(new Date());
  sAcc.getRange(row, 7).setValue(isMineVal);
  
  if (typeof invalidateAllCaches_ === 'function') {
    invalidateAllCaches_();
  }
  
  return { ok: true, row: row };
}

/**
 * Delete an account
 */
function SOV1_UI_deleteAccount_manage_(token, row) {
  if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  
  var sAcc = _sheet('Accounts');
  if (!sAcc) throw new Error('جدول الحسابات غير موجود');
  
  var name = sAcc.getRange(row, 1).getValue();
  
  // Hard delete the row
  sAcc.deleteRow(row);
  
  if (typeof invalidateAllCaches_ === 'function') {
    invalidateAllCaches_();
  }
  
  return { ok: true, name: name };
}

// ============================================================================
// CATEGORY MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get all categories for management
 */
function SOV1_UI_getCategoriesManage(token) {
  try {
    return SOV1_UI_getCategoriesManage_(token);
  } catch (e) {
    Logger.log('Error in SOV1_UI_getCategoriesManage: ' + e);
    return [];
  }
}

/**
 * Add new category
 */
function SOV1_UI_addCategory(token, name, icon, color, description, budgetLimit) {
  try {
    return SOV1_UI_addCategory_(token, name, icon, color, description, budgetLimit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_addCategory: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Update category
 */
function SOV1_UI_updateCategory(token, row, name, icon, color, active, description, budgetLimit) {
  try {
    return SOV1_UI_updateCategory_(token, row, name, icon, color, active, description, budgetLimit);
  } catch (e) {
    Logger.log('Error in SOV1_UI_updateCategory: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Delete category
 */
function SOV1_UI_deleteCategory(token, row) {
  try {
    return SOV1_UI_deleteCategory_(token, row);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteCategory: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Clean up categories system-wide
 */
function SOV1_UI_cleanupCategories(token) {
  try {
    if (!SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
    
    // Use CategoryManager functions if available
    if (typeof performFullCategoryCleanup_ === 'function') {
      var result = performFullCategoryCleanup_();
      return result;
    }
    
    // Fallback to basic cleanup
    var cleaned = SOV1_CLEAN_TEST_CATEGORIES_();
    return {
      success: true,
      message: 'تم تنظيف ' + cleaned.categories + ' تصنيف، ' + cleaned.transactions + ' معاملة، ' + cleaned.budgets + ' ميزانية'
    };
  } catch (e) {
    Logger.log('Error in SOV1_UI_cleanupCategories: ' + e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// MISSING PUBLIC WRAPPERS - Added for frontend compatibility
// ============================================================================

/**
 * Public wrapper for getting categories (for index.html)
 */
function SOV1_UI_getCategories(token) {
  try {
    return SOV1_UI_getCategories_(token || 'OPEN');
  } catch (e) {
    Logger.log('Error in SOV1_UI_getCategories: ' + e);
    return [];
  }
}

/**
 * Public wrapper for normalize categories to Arabic
 */
function SOV1_UI_normalizeCategoriesToArabic(token) {
  try {
    return SOV1_UI_normalizeCategoriesToArabic_(token || 'OPEN');
  } catch (e) {
    Logger.log('Error in SOV1_UI_normalizeCategoriesToArabic: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Public wrapper for get reset options
 */
function SOV1_UI_getResetOptions() {
  try {
    return SOV1_UI_getResetOptions_();
  } catch (e) {
    Logger.log('Error in SOV1_UI_getResetOptions: ' + e);
    return [];
  }
}

/**
 * Public wrapper for reset data
 */
function SOV1_UI_resetData(token, types, confirmation) {
  try {
    return SOV1_UI_resetData_(token || 'OPEN', types, confirmation);
  } catch (e) {
    Logger.log('Error in SOV1_UI_resetData: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Public wrapper for delete transaction (uses UUID)
 */
function SOV1_UI_deleteTransaction(identifier) {
  try {
    return SOV1_UI_deleteTransaction_(identifier);
  } catch (e) {
    Logger.log('Error in SOV1_UI_deleteTransaction: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Public wrapper for clean test categories
 */
function SOV1_CLEAN_TEST_CATEGORIES() {
  try {
    if (typeof SOV1_CLEAN_TEST_CATEGORIES_ === 'function') {
      return SOV1_CLEAN_TEST_CATEGORIES_();
    }
    return { success: false, error: 'Function not available' };
  } catch (e) {
    Logger.log('Error in SOV1_CLEAN_TEST_CATEGORIES: ' + e);
    return { success: false, error: e.message };
  }
}

// ============================================================================
// CATEGORY AUDIT & RE-CATEGORIZATION FUNCTIONS
// ============================================================================

/**
 * Audit all transactions to find category issues
 * Returns summary of categories and potential problems
 */
function auditTransactionCategories_() {
  try {
    var sheet = _sheet('Sheet1');
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, message: 'No transactions found', stats: {} };
    }
    
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    var stats = {
      total: 0,
      byCategory: {},
      otherCategory: [],
      emptyCategory: [],
      potentialMiscategorized: []
    };
    
    // Get known categories for validation
    var knownCategories = [];
    if (typeof getKnownCategories_ === 'function') {
      knownCategories = getKnownCategories_();
    }
    var knownLower = knownCategories.map(function(c) { return String(c).toLowerCase(); });
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var uuid = row[0];
      var date = row[1];
      var merchant = String(row[9] || '');
      var category = String(row[10] || '');
      var amount = Number(row[8] || 0);
      
      stats.total++;
      
      // Count by category
      if (!stats.byCategory[category]) stats.byCategory[category] = 0;
      stats.byCategory[category]++;
      
      // Track "أخرى" or empty
      if (!category || category.trim() === '') {
        stats.emptyCategory.push({ row: i + 2, uuid: uuid, merchant: merchant, amount: amount });
      } else if (category === 'أخرى' || category.toLowerCase() === 'other' || category === 'POS') {
        stats.otherCategory.push({ row: i + 2, uuid: uuid, merchant: merchant, amount: amount, date: date });
      }
      
      // Check if category looks wrong based on merchant
      var potentialCat = detectCategoryFromMerchantAudit_(merchant);
      if (potentialCat && potentialCat !== category && category !== 'أخرى') {
        stats.potentialMiscategorized.push({
          row: i + 2,
          uuid: uuid,
          merchant: merchant,
          currentCategory: category,
          suggestedCategory: potentialCat
        });
      }
    }
    
    return {
      success: true,
      stats: {
        total: stats.total,
        categories: stats.byCategory,
        otherCount: stats.otherCategory.length,
        emptyCount: stats.emptyCategory.length,
        potentialIssues: stats.potentialMiscategorized.length
      },
      otherTransactions: stats.otherCategory.slice(0, 20), // First 20 for review
      potentialMiscategorized: stats.potentialMiscategorized.slice(0, 10)
    };
  } catch (e) {
    Logger.log('Error in auditTransactionCategories_: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Re-categorize transactions marked as "أخرى" using AI
 * @param {number} limit - Max transactions to process (default 50)
 * @param {boolean} dryRun - If true, only report what would change without saving
 */
function recategorizeOtherTransactions_(limit, dryRun) {
  try {
    limit = Number(limit) || 50;
    dryRun = !!dryRun;
    
    var sheet = _sheet('Sheet1');
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, message: 'No transactions found', processed: 0 };
    }
    
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    var results = {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      changes: []
    };
    
    for (var i = 0; i < data.length && results.processed < limit; i++) {
      var row = data[i];
      var category = String(row[10] || '');
      
      // Only process "أخرى", "other", "POS", or empty categories
      if (category !== 'أخرى' && category.toLowerCase() !== 'other' && 
          category !== 'POS' && category.trim() !== '') {
        continue;
      }
      
      results.processed++;
      
      var uuid = row[0];
      var merchant = String(row[9] || '');
      var amount = Number(row[8] || 0);
      var rawText = String(row[12] || ''); // Raw/Notes column
      
      // Try to determine better category
      var newCategory = null;
      
      // 1. First try pattern-based detection (fast, no API call)
      newCategory = detectCategoryFromMerchantAudit_(merchant);
      
      // 2. If still no category and we have raw text, try AI
      if (!newCategory && rawText && typeof classifyWithAI === 'function') {
        try {
          var aiResult = classifyWithAI(rawText);
          if (aiResult && aiResult.category && aiResult.category !== 'أخرى') {
            newCategory = aiResult.category;
          }
        } catch (aiErr) {
          Logger.log('AI classification error for row ' + (i + 2) + ': ' + aiErr.message);
        }
      }
      
      // 3. If we have merchant but no raw, try AI with merchant
      if (!newCategory && merchant && merchant !== 'غير محدد' && typeof classifyWithAI === 'function') {
        try {
          var aiResult2 = classifyWithAI('شراء من ' + merchant + ' بمبلغ ' + amount + ' ريال');
          if (aiResult2 && aiResult2.category && aiResult2.category !== 'أخرى') {
            newCategory = aiResult2.category;
          }
        } catch (aiErr2) {
          Logger.log('AI classification error (merchant) for row ' + (i + 2) + ': ' + aiErr2.message);
        }
      }
      
      if (newCategory && newCategory !== category) {
        // Validate the new category exists
        if (typeof alignCategoryToKnown_ === 'function') {
          newCategory = alignCategoryToKnown_(newCategory, '');
        }
        
        if (newCategory !== 'أخرى') {
          results.changes.push({
            row: i + 2,
            uuid: uuid,
            merchant: merchant,
            oldCategory: category,
            newCategory: newCategory
          });
          
          if (!dryRun) {
            // Update the category in the sheet (column 11 = K = Category)
            sheet.getRange(i + 2, 11).setValue(newCategory);
            results.updated++;
          }
        } else {
          results.skipped++;
        }
      } else {
        results.skipped++;
      }
    }
    
    return {
      success: true,
      dryRun: dryRun,
      processed: results.processed,
      updated: dryRun ? 0 : results.updated,
      wouldUpdate: dryRun ? results.changes.length : results.updated,
      skipped: results.skipped,
      changes: results.changes.slice(0, 30) // Return first 30 changes for review
    };
  } catch (e) {
    Logger.log('Error in recategorizeOtherTransactions_: ' + e);
    return { success: false, error: e.message };
  }
}

/**
 * Enhanced category detection from merchant name for audit purposes
 */
function detectCategoryFromMerchantAudit_(merchant) {
  if (!merchant) return null;
  var m = String(merchant).toLowerCase();
  
  // Food & Restaurants
  if (/starbucks|coffee|قهوة|كافيه|cafe|مطعم|restaurant|برجر|burger|بيتزا|pizza|kfc|mcd|ماكدونالدز|هرفي|البيك|شاورما|فطور|غداء|عشاء|مخبز|bakery|حلويات|sweets|dunkin|krispy|baskin|تميس|فول|كنافة|شوكولاتة|آيس كريم|ice cream|صب واي|subway/.test(m)) {
    return 'طعام';
  }
  
  // Groceries
  if (/بقالة|تموينات|سوبرماركت|supermarket|بندة|panda|carrefour|كارفور|danube|الدانوب|tamimi|التميمي|العثيم|othaim|farm|فارم|لولو|lulu/.test(m)) {
    return 'طعام';
  }
  
  // Fuel/Gas
  if (/naft|نافت|بنزين|petrol|gas|fuel|محطة|station|وقود|aldrees|الدريس|ساسكو|sasco|petromin|بترومين/.test(m)) {
    return 'وقود';
  }
  
  // Transport
  if (/uber|careem|كريم|jeeny|جيني|taxi|تاكسي|مواصلات|bolt|ترحال/.test(m)) {
    return 'نقل';
  }
  
  // Bills/Utilities
  if (/electricity|كهرباء|water|مياه|stc|زين|zain|mobily|موبايلي|اتصالات|telecom|انترنت|internet|saudi electric|الكهرباء السعودية|المياه الوطنية/.test(m)) {
    return 'فواتير';
  }
  
  // Shopping
  if (/amazon|امازون|noon|نون|jarir|جرير|extra|اكسترا|ikea|ايكيا|mall|مول|hypermarket|هايبر|zara|اتش اند ام|h&m|سنتربوينت|centrepoint|نمشي|namshi|شي ان|shein/.test(m)) {
    return 'تسوق';
  }
  
  // Entertainment
  if (/netflix|نتفلكس|spotify|cinema|سينما|game|العاب|playstation|xbox|اشتراك|youtube|يوتيوب|apple|ابل|google play|متجر|vox|موفي/.test(m)) {
    return 'ترفيه';
  }
  
  // Health
  if (/pharmacy|صيدلية|hospital|مستشفى|clinic|عيادة|doctor|دكتور|طبيب|nahdi|نهدي|dawa|دواء|medical|طبي|مختبر|lab/.test(m)) {
    return 'صحة';
  }
  
  // Education
  if (/university|جامعة|school|مدرسة|institute|معهد|course|دورة|تعليم|education|udemy|coursera/.test(m)) {
    return 'تعليم';
  }
  
  // Housing
  if (/rent|إيجار|ايجار|maintenance|صيانة|عقار|سكن|housing|real estate/.test(m)) {
    return 'سكن';
  }
  
  // ATM/Withdrawal
  if (/atm|صراف|سحب|withdrawal|cash withdrawal|سحب نقدي/.test(m)) {
    return 'سحب نقدي';
  }
  
  // Salary/Income
  if (/salary|راتب|payroll|مكافأة|bonus/.test(m)) {
    return 'راتب';
  }
  
  // Transfers
  if (/transfer|تحويل|حوالة/.test(m)) {
    return 'تحويل';
  }
  
  return null;
}
