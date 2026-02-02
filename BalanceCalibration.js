/**
 * BalanceCalibration.js - Accurate Balance Tracking
 * 
 * This module calibrates account balances based on a known snapshot
 * and then applies all subsequent transactions to calculate current balances.
 * 
 * SNAPSHOT (User provided at 2026-02-02 13:28:00 after Azoom transaction):
 * - SAIB: 2590
 * - STC Bank: 50
 * - Tiqmo: 780 (after Azoom -27)
 * - D360: 9
 * - AlrajhiBank-9765: 2136
 * - AlrajhiBank-9767: 0
 * - AlrajhiBank-1626: 0
 * - Total: 5564 SAR
 */

/**
 * MASTER CALIBRATION FUNCTION
 * Sets opening balances and ensures all transactions are correctly linked to accounts
 */
function CALIBRATE_BALANCES_MASTER() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sTransactions = ss.getSheetByName('Sheet1');
  var sAccounts = ss.getSheetByName('Accounts');
  
  if (!sTransactions || !sAccounts) return { error: "Missing sheets" };
  
  var log = [];
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: FIX TRANSACTION ACCOUNT MAPPINGS
  // ═══════════════════════════════════════════════════════════════
  var tData = sTransactions.getDataRange().getValues();
  var fixedCount = 0;
  
  // Schema: A=ID, B=Date, C=Year, D=Month, E=Day, F=Bank, G=Account, H=Card, I=Amount, J=Merchant, K=Category, L=Type, M=Raw
  for (var i = 1; i < tData.length; i++) {
    var raw = String(tData[i][12] || ''); // Column M (Index 12) = Raw SMS
    var currentAcc = String(tData[i][6] || ''); // Column G (Index 6) = Account
    
    // Rule 1: **0305 -> Account = 0305 (Tiqmo Card)
    if ((raw.indexOf('**0305') !== -1 || raw.indexOf('Card No. (last 4 digit): 0305') !== -1) && currentAcc !== '0305') {
      sTransactions.getRange(i+1, 7).setValue('0305');
      log.push('Row ' + (i+1) + ': Set account to 0305 (Tiqmo)');
      fixedCount++;
    }
    
    // Rule 2: من:9767 -> Account = 9767
    if (raw.indexOf('من:9767') !== -1 && currentAcc !== '9767') {
      sTransactions.getRange(i+1, 7).setValue('9767');
      log.push('Row ' + (i+1) + ': Set account to 9767');
      fixedCount++;
    }
    
    // Rule 3: من1626 -> Account = 1626
    if (raw.indexOf('من1626') !== -1 && currentAcc !== '1626') {
      sTransactions.getRange(i+1, 7).setValue('1626');
      log.push('Row ' + (i+1) + ': Set account to 1626');
      fixedCount++;
    }
    
    // Rule 4: عبر:*3281 -> Account = 1929 (STC Bank card)
    if ((raw.indexOf('عبر:*3281') !== -1 || raw.indexOf('بطاقر 3281') !== -1) && currentAcc !== '3281') {
      sTransactions.getRange(i+1, 7).setValue('3281');
      log.push('Row ' + (i+1) + ': Set account to 3281 (STC Bank card)');
      fixedCount++;
    }
    
    // Rule 4b: عبر:*4495 -> Account = 4495 (STC Bank card 2)
    if (raw.indexOf('عبر:*4495') !== -1 && currentAcc !== '4495') {
      sTransactions.getRange(i+1, 7).setValue('4495');
      log.push('Row ' + (i+1) + ': Set account to 4495 (STC Bank card)');
      fixedCount++;
    }
    
    // Rule 5: "حوالة بين حساباتك" with "الى: 9767" -> This is INCOME for 9767
    if (raw.indexOf('حوالة بين حساباتك') !== -1 && raw.indexOf('الى: 9767') !== -1) {
      sTransactions.getRange(i+1, 7).setValue('9767'); // Account
      sTransactions.getRange(i+1, 12).setValue('دخل'); // Type = Income
      log.push('Row ' + (i+1) + ': Self-transfer TO 9767 marked as income');
      fixedCount++;
    }
    
    // Rule 6: "شراء انترنت" from 9767 to Tiqmo -> This is EXPENSE from 9767, INCOME for Tiqmo
    // Need to record TWO entries: One expense from 9767, one income to Tiqmo
    if (raw.indexOf('من:9767') !== -1 && raw.indexOf('لـTiqmo') !== -1) {
      sTransactions.getRange(i+1, 7).setValue('9767');
      sTransactions.getRange(i+1, 12).setValue('expense'); // Type = Expense from source
      log.push('Row ' + (i+1) + ': Tiqmo topup from 9767 marked as expense');
      fixedCount++;
      // Note: The Tiqmo INCOME is handled by the tap*Tameeni row that comes after
    }
    
    // Rule 7: tap*Tameeni on 0305 after Tiqmo topup is actually the RECEIVED side
    // This is INCOME to Tiqmo, not an expense
    if (raw.indexOf('tap*Tameeni') !== -1 && raw.indexOf('**0305') !== -1) {
      sTransactions.getRange(i+1, 7).setValue('0305');
      sTransactions.getRange(i+1, 12).setValue('دخل'); // Type = Income (the topup arriving)
      log.push('Row ' + (i+1) + ': Tameeni/Tiqmo topup received marked as income');
      fixedCount++;
    }
  }
  
  SpreadsheetApp.flush();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: SET OPENING BALANCES (Calibrated to BEFORE first tx)
  // ═══════════════════════════════════════════════════════════════
  // User snapshot at 13:28 AFTER Azoom (Row 7):
  // Tiqmo = 780 (after -27 from Azoom)
  // So Tiqmo BEFORE Azoom = 807
  // But there are earlier transactions on 0305:
  // - Row 4: STCC TTR -4 SAR at 00:51
  // - Row 8+: Later transactions
  // 
  // Let me calculate backward from the snapshot:
  // At 13:28: Tiqmo = 780
  // Before Azoom (-27): Tiqmo = 807
  // Before STCC (-4): Tiqmo = 811
  // So OPENING for Tiqmo = 811
  
  var openingBalances = {
    'SAIB': 2590,           // No transactions on this account
    'STC Bank': 57,         // Snapshot shows 50, but Esraa -7 was before snapshot
    'Tiqmo': 811,           // 780 + 27 (Azoom) + 4 (STCC) = 811
    'D360': 9,              // No transactions
    'AlrajhiBank-9765': 2136, // No transactions
    'AlrajhiBank-9767': 50,   // 0 + 50 (Nasser transfer before snapshot)
    'AlrajhiBank-1626': 35500 // 0 + 35500 (Awad transfer after snapshot)
  };
  
  // Also need to add aliases - IMPORTANT: Include both 0305 and 305 variants
  var aliasMap = {
    'Tiqmo': '0305,305,9682',
    'AlrajhiBank-9767': '9767',
    'AlrajhiBank-1626': '1626',
    'AlrajhiBank-9765': '9765',
    'STC Bank': '1929',
    'SAIB': '8001,2553'
  };
  
  var accData = sAccounts.getDataRange().getValues();
  
  for (var j = 1; j < accData.length; j++) {
    var name = String(accData[j][0]);
    
    if (openingBalances.hasOwnProperty(name)) {
      sAccounts.getRange(j+1, 11).setValue(openingBalances[name]); // Opening Balance
      log.push(name + ': Opening set to ' + openingBalances[name]);
    }
    
    if (aliasMap.hasOwnProperty(name)) {
      var currentAliases = String(accData[j][8] || '');
      var newAliases = aliasMap[name].split(',');
      newAliases.forEach(function(a) {
        if (currentAliases.indexOf(a) === -1) {
          currentAliases = currentAliases ? currentAliases + ',' + a : a;
        }
      });
      sAccounts.getRange(j+1, 9).setValue(currentAliases);
    }
  }
  
  SpreadsheetApp.flush();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: REBUILD BALANCES FROM SCRATCH
  // ═══════════════════════════════════════════════════════════════
  var rebuildResult = rebuildBalancesFromHistory();
  
  return {
    fixed: fixedCount,
    openings: openingBalances,
    rebuild: rebuildResult,
    log: log
  };
}

/**
 * Quick balance check - returns current calculated balances
 */
function GET_CALCULATED_BALANCES() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sAccounts = ss.getSheetByName('Accounts');
  var sTransactions = ss.getSheetByName('Sheet1');
  
  if (!sAccounts || !sTransactions) return { error: "Missing sheets" };
  
  // Load accounts
  var accData = sAccounts.getDataRange().getValues();
  var accounts = {};
  
  for (var i = 1; i < accData.length; i++) {
    var name = String(accData[i][0]);
    var num = String(accData[i][2]);
    var opening = Number(accData[i][10] || 0);
    var aliases = String(accData[i][8] || '').split(',');
    
    accounts[name] = { opening: opening, flow: 0 };
    
    // Map by number and aliases
    if (num) accounts[num] = accounts[name];
    aliases.forEach(function(a) {
      if (a.trim()) accounts[a.trim().toLowerCase()] = accounts[name];
    });
  }
  
  // Process transactions
  var txData = sTransactions.getDataRange().getValues();
  var txLog = [];
  
  for (var j = 1; j < txData.length; j++) {
    var acc = String(txData[j][6] || '').trim().toLowerCase();
    var amount = Number(txData[j][8] || 0);
    var type = String(txData[j][11] || '').toLowerCase();
    var merchant = String(txData[j][9] || '');
    var date = txData[j][1];
    
    if (!acc || !accounts[acc]) continue;
    
    var isIncome = (type === 'income' || type === 'دخل' || type === 'إيداع');
    
    if (isIncome) {
      accounts[acc].flow += amount;
      txLog.push({ date: date, acc: acc, amount: '+' + amount, merchant: merchant });
    } else {
      accounts[acc].flow -= amount;
      txLog.push({ date: date, acc: acc, amount: '-' + amount, merchant: merchant });
    }
  }
  
  // Calculate final balances
  var result = {};
  for (var i = 1; i < accData.length; i++) {
    var name = String(accData[i][0]);
    if (accounts[name]) {
      result[name] = {
        opening: accounts[name].opening,
        flow: accounts[name].flow,
        current: accounts[name].opening + accounts[name].flow
      };
    }
  }
  
  return { balances: result, transactions: txLog.length };
}
