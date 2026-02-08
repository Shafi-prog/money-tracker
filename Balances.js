
/********** Balances.gs — أرصدة الحسابات (تقديري) **********
 * - يسجل رصيد لكل حساب/محفظة بناءً على العمليات
 * - يرسل إشعار بالمتبقي للحساب الأساسي (مثلاً الراجحي) عند التحويل/الخصم
 * 
 * ⚠️ UPDATED: Now uses unified Accounts sheet (not separate Balances/Account_Balances)
 * Balance is stored in column 5 (الرصيد) of Accounts sheet
 *******************************************************/

/**
 * Ensure Accounts sheet exists with balance column
 */
function ensureBalancesSheet_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات', 'الرصيد_الافتتاحي']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('E:E').setNumberFormat('#,##0.00');  // الرصيد
    sh.getRange('K:K').setNumberFormat('#,##0.00');  // الرصيد_الافتتاحي
    sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm:ss');  // آخر_تحديث
  } else {
    // Fix legacy header if it exists
    var header = sh.getRange(1, 1, 1, 11).getValues()[0];
    if (String(header[7] || '') === 'SMS_Pattern') {
      sh.getRange(1, 8).setValue('تحويل_داخلي');
    }
    // Ensure Opening Balance Header
    if (header.length < 11 || String(header[10] || '') === '') {
       sh.getRange(1, 11).setValue('الرصيد_الافتتاحي');
    }
  }
  return sh;
}

/**
 * Get full account info by number/key/name
 */
function getAccountInfo_(accountKey) {
  var sh = ensureBalancesSheet_();
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return null;
  
  // Columns: Name(0), Type(1), Number(2), Bank(3), Balance(4), LastUpdate(5), IsMine(6), IsInternal(7), Aliases(8)
  var data = sh.getRange(2, 1, lastRow - 1, 9).getValues();
  var rawKey = String(accountKey || '').trim().toLowerCase();
  
  // Clean key: remove asterisks, leading zeros, and whitespace
  var cleanKey = rawKey.replace(/^\*+/, '').replace(/^0+/, '').trim();
  
  // ✅ Also try getting just last 4 digits if key is longer
  var last4Key = cleanKey.length > 4 ? cleanKey.slice(-4) : cleanKey;
  
  for (var i = 0; i < data.length; i++) {
    var rowName = String(data[i][0] || '').trim().toLowerCase();  // Account Name
    var rowNum = String(data[i][2] || '').trim().toLowerCase();   // Account Number
    var aliasesStr = String(data[i][8] || '').toLowerCase();      // Aliases
    var aliases = aliasesStr.split(/[,;]+/).map(function(s) { return s.trim(); });
    
    // Check name or number (exact match)
    if (rowName === rawKey || rowNum === rawKey || rowName === cleanKey || rowNum === cleanKey) {
       return buildInfo_(data[i], i + 2);
    }
    
    // ✅ Also check last 4 digits match
    if (last4Key && (rowNum === last4Key || rowNum.slice(-4) === last4Key)) {
       return buildInfo_(data[i], i + 2);
    }
    
    // Check aliases (exact match against cleaned or raw)
    for (var j = 0; j < aliases.length; j++) {
      var alias = aliases[j];
      var aliasClean = alias.replace(/^\*+/, '').replace(/^0+/, '').trim();
      
      if (alias === rawKey || alias === cleanKey || aliasClean === cleanKey || aliasClean === last4Key) {
        return buildInfo_(data[i], i + 2);
      }
    }
  }
  
  // ✅ Log miss for debugging
  Logger.log('⚠️ getAccountInfo_: No match found for key: ' + accountKey + ' (cleaned: ' + cleanKey + ', last4: ' + last4Key + ')');
  
  return null;
}

function buildInfo_(row, rowIndex) {
  return {
    row: rowIndex,
    name: String(row[0]),
    type: String(row[1]),
    number: String(row[2]),
    bank: String(row[3]),
    balance: Number(row[4] || 0),
    isMine: String(row[6] || '').toUpperCase() === 'TRUE'
  };
}

/**
 * Get balance for an account by its number (last 4 digits)
 */
function getBalance_(accountKey) {
  var info = getAccountInfo_(accountKey);
  return info ? info.balance : 0;
}

/**
 * Set balance for an account
 */
function setBalance_(accountKey, newBalance) {
  var sh = ensureBalancesSheet_();
  var info = getAccountInfo_(accountKey);
  
  if (info) {
    sh.getRange(info.row, 5).setValue(Number(newBalance || 0));
    sh.getRange(info.row, 6).setValue(new Date());
  } else {
    Logger.log('⚠️ Attempted to set balance for unknown account: ' + accountKey);
  }
}

/**
 * تحديث رصيد حساب واحد بناءً على العملية
 */
function applyTxnToBalance_(accountKey, amount, isIncoming, authoritativeBalance) {
  var next;
  if (authoritativeBalance !== undefined && authoritativeBalance !== null && !isNaN(parseFloat(authoritativeBalance))) {
      next = parseFloat(authoritativeBalance);
      Logger.log('💰 Setting authoritative balance for ' + accountKey + ': ' + next);
  } else {
      var cur = getBalance_(accountKey);
      var delta = Number(amount||0);
      next = isIncoming ? (cur + delta) : (cur - delta);
  }
  setBalance_(accountKey, next);
  return next;
}

/**
 * Rebuild ALL balances from Sheet1 history - OPTIMIZED for Performance
 */
function rebuildBalancesFromHistory() {
  try {
    var sheet1 = _sheet('Sheet1');
    var accSheet = _sheet('Accounts');
    
    // Check Sheet1 data
    var s1Last = sheet1.getLastRow();
    if (s1Last < 2) return 'No data in Sheet1';
    
    Logger.log('🔄 Starting Balance Rebuild (Optimized)...');
    
    // 1. Read Account Map (Name/Num -> Row Index)
    var accLast = accSheet.getLastRow();
    if (accLast < 2) return 'No accounts found';
    
    // Load accounts into memory
    // Name(0), Type(1), Number(2), Bank(3), Balance(4), LastUpdate(5), IsMine(6), Int(7), Alias(8), Notes(9), Opening(10)
    var accData = accSheet.getRange(2, 1, accLast - 1, 11).getValues();
    var balancesByIndex = new Array(accData.length).fill(0.0);
    var indexMap = {};
    
    // Map account identifiers to data index (0 to length-1)
    for (var i = 0; i < accData.length; i++) {
        var row = accData[i];
        var kNum = String(row[2]).trim().toLowerCase(); // Number
        var kName = String(row[0]).trim().toLowerCase(); // Name
        var aliases = String(row[8] || '').toLowerCase().split(',');
        
        if (kNum) indexMap[kNum] = i;
        if (kName) indexMap[kName] = i;
        aliases.forEach(function(a){ 
          var clean = a.trim().replace(/^\*+/, ''); // Remove leading asterisks
          if(clean) {
            indexMap[clean] = i;
            indexMap['*' + clean] = i; // Also map with asterisk
            // Also map with/without leading zeros for card numbers
            if (/^\d+$/.test(clean)) {
              indexMap[clean.replace(/^0+/, '')] = i; // Without leading zeros
              indexMap[clean.padStart(4, '0')] = i;   // With leading zeros
            }
          }
        });
        
        // Initialize with Opening Balance
        balancesByIndex[i] = Number(row[10] || 0.0);
    }
    
    // 2. Read All Transactions
    var txData = sheet1.getRange(2, 1, s1Last-1, 13).getValues();
    
    // Sort by date (Column 1)
    txData.sort(function(a, b) { 
      var dA = a[1] instanceof Date ? a[1] : new Date(a[1]);
      var dB = b[1] instanceof Date ? b[1] : new Date(b[1]);
      return dA - dB; 
    });
    
    // 3. Replay Transactions
    var debugTxLog = [];
    for (var k = 0; k < txData.length; k++) {
      var tx = txData[k];
      var accNum = String(tx[6] || '').trim().toLowerCase();
      var cardNum = String(tx[7] || '').trim().toLowerCase();
      var amount = Number(tx[8] || 0);
      var type = String(tx[11] || '').toLowerCase();
      var notes = String(tx[12] || '');
      var merchant = String(tx[9] || '');
      
      var isIncoming = (type === 'income' || type === 'دخل' || type === 'إيداع' || type === 'راتب' || notes.indexOf('وارد') !== -1);
      
      var idx = -1;
      // Normalize account numbers - handle leading zeros and asterisks
      var accNumClean = accNum.replace(/^0+/, '').replace(/^\*+/, '');
      var cardNumClean = cardNum.replace(/^0+/, '').replace(/^\*+/, '');
      
      if (accNum && indexMap.hasOwnProperty(accNum)) idx = indexMap[accNum];
      else if (accNumClean && indexMap.hasOwnProperty(accNumClean)) idx = indexMap[accNumClean];
      else if (cardNum && indexMap.hasOwnProperty(cardNum)) idx = indexMap[cardNum];
      else if (cardNumClean && indexMap.hasOwnProperty(cardNumClean)) idx = indexMap[cardNumClean];
      
      if (idx !== -1) {
          if (isIncoming) {
            balancesByIndex[idx] += amount;
            debugTxLog.push('INC: ' + accNum + ' +' + amount + ' (' + merchant + ')');
          } else {
            balancesByIndex[idx] -= amount;
            debugTxLog.push('EXP: ' + accNum + ' -' + amount + ' (' + merchant + ')');
          }
      } else {
          debugTxLog.push('SKIP: ' + accNum + '/' + cardNum + ' amt=' + amount + ' (' + merchant + ')');
      }
    }
    
    // 4. Batch Update Balances to Sheet
    // Construct column arrays
    var outBalances = [];
    var outDates = [];
    var now = new Date();
    
    for (var m = 0; m < balancesByIndex.length; m++) {
        outBalances.push([balancesByIndex[m]]);
        outDates.push([now]);
    }
    
    if (outBalances.length > 0) {
        accSheet.getRange(2, 5, outBalances.length, 1).setValues(outBalances);
        accSheet.getRange(2, 6, outDates.length, 1).setValues(outDates);
    }
    
    Logger.log('✅ Balance Rebuild Complete (Optimized).');
    Logger.log('TX Log: ' + debugTxLog.join(' | '));
    
    // Return debug info
    return JSON.stringify({ 
      status: 'Rebuild Complete', 
      accounts: accData.length,
      transactions: txData.length,
      txLog: debugTxLog.slice(0, 20) // First 20 for debugging
    });
    
  } catch (e) {
    Logger.log('Error rebuilding balances: ' + e);
    return 'Error: ' + e.message;
  }
}

/**
 * الحصول على جميع أرصدة الحسابات من Accounts sheet
 */
function getAccountsWithBalances_() {
  var sh = ensureBalancesSheet_();
  var lastRow = sh.getLastRow();
  var balances = [];
  
  if (lastRow < 2) return balances;
  
  var data = sh.getRange(2, 1, lastRow - 1, 6).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][2]) { 
      balances.push({
        name: String(data[i][0] || ''),
        type: String(data[i][1] || ''),
        account: String(data[i][2] || ''),
        bank: String(data[i][3] || ''),
        balance: Number(data[i][4] || 0),
        lastUpdate: data[i][5] || null
      });
    }
  }
  
  balances.sort(function(a, b) { return b.balance - a.balance; });
  return balances;
}

/**
 * جلب جميع أرصدة الحسابات بصيغة HTML منسقة
 */
function getAllBalancesHTML_() {
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues();
  
  if (data.length < 2) return '';
  
  var html = '\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n<b>💳 الأرصدة</b>\n';
  var total = 0;
  var rows = [];
  
  for (var i = 1; i < data.length; i++) {
    var accountName = String(data[i][0] || '');
    var isMine = String(data[i][6] || 'TRUE').toLowerCase() === 'true';
    if (!isMine) continue; 
    
    var balance = Number(data[i][4] || 0); 
    total += balance;
    
    var emoji = balance >= 1000 ? '💚' : (balance >= 0 ? '💛' : '🔴');
    var nameCol = (emoji + ' ' + accountName).slice(0, 18);
    var balCol = balance.toFixed(0);
    rows.push(padRight_(nameCol, 18) + ' | ' + padLeft_(balCol, 8));
  }
  if (rows.length > 0) {
    html += '<pre>' + rows.join('\n') + '</pre>';
  }
  html += '<b>💰 ' + total.toFixed(0) + ' SAR</b>';
  
  return html;
}

function padRight_(txt, len) {
  txt = String(txt || '');
  if (txt.length >= len) return txt;
  return txt + new Array(len - txt.length + 1).join(' ');
}

function padLeft_(txt, len) {
  txt = String(txt || '');
  if (txt.length >= len) return txt;
  return new Array(len - txt.length + 1).join(' ') + txt;
}

function findAccountByNameOrBank_(text) {
  if (!text) return null;
  text = String(text).toLowerCase().trim();
  
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues(); 
  
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][0] || '').toLowerCase(); 
    var bank = String(data[i][3] || '').toLowerCase(); 
    var isMine = String(data[i][6] || '').toUpperCase() === 'TRUE';
    var aliases = String(data[i][8] || '').toLowerCase(); 
    
    if (name === text || bank === text || (aliases && aliases.indexOf(text) !== -1)) {
        return {
          row: i + 1,
          number: String(data[i][2]),
          isMine: isMine
        };
    }
  }
  return null;
}

/**
 * تحديث أرصدة الحسابات بعد كل معاملة (Consolidated)
 */
function updateBalancesAfterTransaction_(data) {
  try {
    if (!data) return;
    
    // ✅ FIX: Try multiple keys - accNum, cardNum, account
    var accKey = data.accNum || data.cardNum || data.account;
    
    // If accKey is empty or generic, try to find by cardNum separately
    if (!accKey && data.cardNum) {
      accKey = data.cardNum;
    }
    
    if (!accKey) {
      Logger.log('⚠️ updateBalancesAfterTransaction_: No account key provided');
      return;
    }
    
    // ✅ FIX: Ensure we clean the key
    accKey = String(accKey).trim();
    
    var amount = Number(data.amount) || 0;
    var isIncoming = !!data.isIncoming;
    var authBalance = (data.currentBalance !== undefined && data.currentBalance !== null) ? data.currentBalance : null;
    
    Logger.log('💰 Updating balance for account: ' + accKey + ', amount: ' + amount + ', isIncoming: ' + isIncoming);
    
    // ✅ FIX: Verify account exists before updating
    var accInfo = getAccountInfo_(accKey);
    if (!accInfo) {
      Logger.log('⚠️ Account not found for key: ' + accKey + ' - attempting to find by aliases');
      // Try with just last 4 digits if it's longer
      if (accKey.length > 4) {
        var last4 = accKey.slice(-4);
        accInfo = getAccountInfo_(last4);
        if (accInfo) accKey = last4;
      }
    }
    
    if (!accInfo) {
      Logger.log('❌ Balance update FAILED: Account not found for any key variant of: ' + accKey);
      return null;
    }
    
    // 1. Update Balance
    var newBalance = applyTxnToBalance_(accKey, amount, isIncoming, authBalance);
    Logger.log('✅ New balance for ' + accKey + ': ' + newBalance);
    
    // 2. Invalidate cache so subsequent reads get fresh data
    if (typeof invalidateCache_ === 'function') {
      invalidateCache_(CACHE_KEYS.BALANCES_INDEX);
    }
    
    // 3. Notification (if enabled)
    if (accInfo && accInfo.isMine) {
      sendBalanceUpdateNotification_(accKey, newBalance, data);
    }
    
    // 4. Debt Tracking
    if (data.merchant && data.merchant !== 'غير محدد') {
       updateDebtTracking_(data);
    }
    
    return newBalance;
  } catch (e) {
    Logger.log('Error updating balance: ' + e);
    return null;
  }
}

/**
 * معالجة التحويل الداخلي بين الحسابات
 */
function handleInternalTransfer_(sourceAcc, destAcc, amount) {
  if (!sourceAcc || !destAcc || !amount) return;
  
  var srcBal = applyTxnToBalance_(sourceAcc, amount, false);
  var destBal = applyTxnToBalance_(destAcc, amount, true);
  
  var srcInfo = getAccountInfo_(sourceAcc);
  if (srcInfo && srcInfo.isMine) {
     sendBalanceUpdateNotification_(sourceAcc, srcBal, { amount: amount, isIncoming: false, merchant: 'تحويل إلى ' + destAcc });
  }
  
  var destInfo = getAccountInfo_(destAcc);
  if (destInfo && destInfo.isMine) {
     sendBalanceUpdateNotification_(destAcc, destBal, { amount: amount, isIncoming: true, merchant: 'تحويل من ' + sourceAcc });
  }
}

/**
 * إرسال إشعار تحديث الرصيد
 */
function sendBalanceUpdateNotification_(accountKey, newBalance, txnData) {
  var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID||'');
  if (!hub) return;
  
  // تحقق من الإعدادات
  if (typeof areNotificationsEnabled === 'function' && !areNotificationsEnabled()) return;

  var amount = Number(txnData.amount || 0);
  var merchant = txnData.merchant || 'غير محدد';
  var isIncoming = !!txnData.isIncoming;
  var emoji = isIncoming ? '💰' : '💸';
  
  var msg = 
    '🏦 <b>تحديث رصيد الحساب</b>\n' +
    '━━━━━━━━━━━━━━━━━━━\n\n' +
    '💳 <b>العملية:</b> ' + (isIncoming ? 'إيداع/وارد' : 'شراء/خصم') + '\n' +
    '💼 <b>الحساب:</b> ' + accountKey + '\n' +
    emoji + ' <b>المبلغ:</b> ' + amount.toFixed(2) + ' SAR\n' +
    '🏪 <b>الجهة:</b> ' + merchant + '\n\n' +
    '💰 <b>الرصيد الجديد:</b> ' + Number(newBalance || 0).toFixed(2) + ' SAR\n\n' +
    '📝 <i>ملاحظة: الرصيد تقديري</i>';

  if (typeof sendTelegram_ === 'function') {
    sendTelegram_(hub, msg);
  }
}

function updateDebtTracking_(data) {
  try {
    var sDebt = _sheet('Debt_Index');
    if (sDebt.getLastRow() === 0) {
      sDebt.appendRow(['الشخص', 'الحساب', 'المبلغ المستحق', 'آخر تحديث', 'ملاحظات']);
      sDebt.setFrozenRows(1);
      sDebt.setRightToLeft(true);
    }
    
    var person = String(data.merchant || '').trim();
    var accNum = String(data.accNum || data.cardNum || '').trim();
    var amount = Number(data.amount) || 0;
    var isIncoming = !!data.isIncoming;
    
    var delta = isIncoming ? -amount : amount;
    
    var vals = sDebt.getDataRange().getValues();
    var foundRow = -1;
    
    for (var i = 1; i < vals.length; i++) {
      var rowPerson = String(vals[i][0] || '').trim().toLowerCase();
      var rowAcc = String(vals[i][1] || '').trim();
      
      if (rowPerson === person.toLowerCase() || (accNum && rowAcc === accNum)) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow > 0) {
      var currentDebt = Number(vals[foundRow - 1][2]) || 0;
      var newDebt = currentDebt + delta;
      
      if (Math.abs(newDebt) < 1) newDebt = 0;
      
      sDebt.getRange(foundRow, 3).setValue(newDebt);
      sDebt.getRange(foundRow, 4).setValue(new Date());
    } else if (Math.abs(delta) > 0) {
      sDebt.appendRow([person, accNum, delta, new Date(), '']);
    }
  } catch (e) {}
}

function getDebtSummary_() {
  var sDebt = _sheet('Debt_Index');
  var data = sDebt.getDataRange().getValues();
  
  var owedToMe = 0;
  var iOwe = 0;
  var people = [];
  
  for (var i = 1; i < data.length; i++) {
    var debt = Number(data[i][2]) || 0;
    if (Math.abs(debt) < 1) continue;
    
    if (debt > 0) owedToMe += debt;
    else iOwe += Math.abs(debt);
    
    people.push({
      name: data[i][0],
      account: data[i][1],
      amount: debt,
      lastUpdate: data[i][3]
    });
  }
  
  return { owedToMe: owedToMe, iOwe: iOwe, net: owedToMe - iOwe, people: people };
}

function notifyPrimaryBalance_(accountKey, newBalance, contextText) {
  var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID||'');
  if (!hub) return;
  var msg =
    '🏦 تحديث رصيد الحساب الأساسي\n' +
    'الحساب: ' + accountKey + '\n' +
    'الرصيد المتبقي (تقديري): ' + Number(newBalance||0).toFixed(2) + ' SAR\n' +
    (contextText ? ('—\n' + contextText) : '');
  sendTelegram_(hub, msg);
}
