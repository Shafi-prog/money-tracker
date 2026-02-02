
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
    sh.appendRow(['الاسم', 'النوع', 'الرقم', 'البنك', 'الرصيد', 'آخر_تحديث', 'حسابي', 'تحويل_داخلي', 'أسماء_بديلة', 'ملاحظات']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('E:E').setNumberFormat('#,##0.00');  // الرصيد
    sh.getRange('F:F').setNumberFormat('yyyy-MM-dd HH:mm:ss');  // آخر_تحديث
  } else {
    // Fix legacy header if it exists
    var header = sh.getRange(1, 1, 1, 10).getValues()[0];
    if (String(header[7] || '') === 'SMS_Pattern') {
      sh.getRange(1, 8).setValue('تحويل_داخلي');
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
  var cleanKey = String(accountKey || '').trim().toLowerCase().replace(/^\*/, '');
  
  for (var i = 0; i < data.length; i++) {
    var rowName = String(data[i][0] || '').trim().toLowerCase();  // Account Name
    var rowNum = String(data[i][2] || '').trim().toLowerCase();   // Account Number
    var aliases = String(data[i][8] || '').toLowerCase();         // Aliases
    
    // Check name, number, or aliases
    if (rowName === cleanKey || rowNum === cleanKey || 
        aliases.indexOf(cleanKey) >= 0 || aliases.indexOf('*' + cleanKey) >= 0) {
      return {
        row: i + 2,
        name: String(data[i][0]),
        type: String(data[i][1]),
        number: String(data[i][2]),
        bank: String(data[i][3]),
        balance: Number(data[i][4] || 0),
        isMine: String(data[i][6] || '').toUpperCase() === 'TRUE'
      };
    }
  }
  
  return null;
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
    // If account not found in canonical list, DO NOT ADD IT implicitly to avoid duplicating cards as accounts
    // Just log explicit warning or add to a "Unknown" list if needed
    // But for this strict request, we ignore or log.
    Logger.log('⚠️ Attempted to set balance for unknown account: ' + accountKey);
  }
}

/**
 * تحديث رصيد حساب واحد بناءً على العملية
 * - إذا العملية "صادر" تقلل الرصيد
 * - إذا "وارد" تزيد الرصيد
 */
// Upgraded calculate logic to support authoritative balance
function applyTxnToBalance_(accountKey, amount, isIncoming, authoritativeBalance) {
  var next;
  if (authoritativeBalance !== undefined && authoritativeBalance !== null) {
      next = Number(authoritativeBalance);
      // Logic check: if authoritative balance is wildly different (e.g. 0), maybe ignore?
      // Assuming parser is correct for now.
  } else {
      var cur = getBalance_(accountKey);
      var delta = Number(amount||0);
      next = isIncoming ? (cur + delta) : (cur - delta);
  }
  setBalance_(accountKey, next);
  return next;
}

/**
 * الحصول على جميع أرصدة الحسابات من Accounts sheet
 * @returns {Array} مصفوفة من الحسابات مع أرصدتها
 */
function getAccountsWithBalances_() {
  var sh = ensureBalancesSheet_();
  var lastRow = sh.getLastRow();
  var balances = [];
  
  if (lastRow < 2) return balances;
  
  // Columns: الاسم(1), النوع(2), الرقم(3), البنك(4), الرصيد(5), آخر_تحديث(6)
  var data = sh.getRange(2, 1, lastRow - 1, 6).getValues();
  
  for (var i = 0; i < data.length; i++) {
    if (data[i][2]) { // Has account number
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
  
  // ترتيب حسب الرصيد من الأعلى للأقل
  balances.sort(function(a, b) {
    return b.balance - a.balance;
  });
  
  return balances;
}

/**
 * إشعار المتبقي للحساب الأساسي (مثلاً الراجحي 9767)
 */
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

/**
 * جلب جميع أرصدة الحسابات بصيغة HTML منسقة
 * @returns {string} - HTML formatted balances
 */
function getAllBalancesHTML_() {
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues();
  
  if (data.length < 2) return '';
  
  var html = '\n┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n<b>💳 الأرصدة</b>\n';
  var total = 0;
  var rows = [];
  
  // Columns: الاسم(0), النوع(1), الرقم(2), البنك(3), الرصيد(4)
  for (var i = 1; i < data.length; i++) {
    var accountName = String(data[i][0] || '');
    var isMine = String(data[i][6] || 'TRUE').toLowerCase() === 'true';
    if (!isMine) continue; // Only show my accounts
    
    var balance = Number(data[i][4] || 0); // Column E = index 4
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

/**
 * Find account by name or bank (fuzzy match)
 */
function findAccountByNameOrBank_(text) {
  if (!text) return null;
  text = String(text).toLowerCase().trim();

  // Prefer Accounts sheet (unified schema) if available
  try {
    if (typeof ensureAccountsSheet_ === 'function') {
      var shAcc = ensureAccountsSheet_();
      var lastAcc = shAcc.getLastRow();
      if (lastAcc >= 2) {
        var accRows = shAcc.getRange(2, 1, lastAcc - 1, 10).getValues();
        for (var a = 0; a < accRows.length; a++) {
          var accName = String(accRows[a][0] || '').toLowerCase();
          var accBank = String(accRows[a][3] || '').toLowerCase();
          var accNum = String(accRows[a][2] || '').trim();
          var accAliases = String(accRows[a][8] || '').toLowerCase();
          var accIsMine = String(accRows[a][6] || '').toUpperCase() === 'TRUE';

          if (accName === text || accBank === text || (accAliases && accAliases.indexOf(text) !== -1)) {
            return {
              row: a + 2,
              number: accNum,
              isMine: accIsMine
            };
          }
        }
      }
    }
  } catch (eAcc) {
    Logger.log('Accounts lookup failed: ' + eAcc);
  }
  
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues(); // Cache entire sheet
  
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][0] || '').toLowerCase(); // Name
    var bank = String(data[i][3] || '').toLowerCase(); // Bank
    var isMine = String(data[i][6] || '').toUpperCase() === 'TRUE';
    var aliases = String(data[i][8] || '').toLowerCase(); // Aliases
    
    // Check if text matches name, bank, or aliases
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
 * تحديث أرصدة الحسابات بعد كل معاملة
 * يتم استدعاؤها من saveTransaction
 */
function updateBalancesAfterTransaction_(data) {
  try {
    var accNum = data.accNum || data.cardNum || '';
    if (!accNum) return;
    
    var amount = Number(data.amount) || 0;
    var isIncoming = !!data.isIncoming;
    var authBalance = (data.currentBalance !== undefined) ? data.currentBalance : null;
    
    // تحديث رصيد الحساب (المصدر)
    var newBalance = applyTxnToBalance_(accNum, amount, isIncoming, authBalance);
    
    // إرسال إشعار الرصيد للمصدر (فقط إذا كان حسابي)
    var srcInfo = getAccountInfo_(accNum);
    // REMOVED redundant notification here because it will be shown in the main report
    // if (srcInfo && srcInfo.isMine) {
    //   sendBalanceUpdateNotification_(accNum, newBalance, data);
    // }

    // تتبع الديون (إذا لم يكن تحويل داخلي)
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
 * @param {string} sourceAcc - الحساب المرسل
 * @param {string} destAcc - الحساب المستلم
 * @param {number} amount - المبلغ
 */
function handleInternalTransfer_(sourceAcc, destAcc, amount) {
  if (!sourceAcc || !destAcc || !amount) return;
  
  // خصم من المصدر
  var srcBal = applyTxnToBalance_(sourceAcc, amount, false); // خصم
  
  // إضافة للمستلم
  var destBal = applyTxnToBalance_(destAcc, amount, true); // إضافة
  
  // إشعار للحسابين (إذا كانوا لي)
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
 * إرسال إشعار تحديث الرصيد بعد العملية (تلقائياً)
 */
function sendBalanceUpdateNotification_(accountKey, newBalance, txnData) {
  var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID||'');
  if (!hub) return;
  
  // تحقق من الإعدادات قبل الإرسال (اختياري)
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

/**
 * تتبع الديون - من أقرضت ومن يدين لي
 */
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
    
    // إذا دفعت لشخص = هو يدين لي (+)
    // إذا استلمت من شخص = سدد دينه (-)
    var delta = isIncoming ? -amount : amount;
    
    // البحث عن الشخص بالاسم + رقم الحساب
    var vals = sDebt.getDataRange().getValues();
    var foundRow = -1;
    
    for (var i = 1; i < vals.length; i++) {
      var rowPerson = String(vals[i][0] || '').trim().toLowerCase();
      var rowAcc = String(vals[i][1] || '').trim();
      
      // مطابقة بالاسم أو رقم الحساب
      if (rowPerson === person.toLowerCase() || (accNum && rowAcc === accNum)) {
        foundRow = i + 1;
        break;
      }
    }
    
    if (foundRow > 0) {
      var currentDebt = Number(vals[foundRow - 1][2]) || 0;
      var newDebt = currentDebt + delta;
      
      // إذا الدين صفر أو قريب منه، اعتبره مسدد
      if (Math.abs(newDebt) < 1) newDebt = 0;
      
      sDebt.getRange(foundRow, 3).setValue(newDebt);
      sDebt.getRange(foundRow, 4).setValue(new Date());
      
      Logger.log('Debt updated: ' + person + ' → ' + newDebt);
    } else if (Math.abs(delta) > 0) {
      // إضافة سجل جديد
      sDebt.appendRow([person, accNum, delta, new Date(), '']);
      Logger.log('New debt record: ' + person + ' → ' + delta);
    }
  } catch (e) {
    Logger.log('Error updating debt: ' + e);
  }
}

/**
 * الحصول على ملخص الديون
 */
function getDebtSummary_() {
  var sDebt = _sheet('Debt_Index');
  var data = sDebt.getDataRange().getValues();
  
  var owedToMe = 0; // يدينون لي
  var iOwe = 0;      // أدين لهم
  var people = [];
  
  for (var i = 1; i < data.length; i++) {
    var debt = Number(data[i][2]) || 0;
    if (Math.abs(debt) < 1) continue; // تجاهل المبالغ الصغيرة
    
    if (debt > 0) {
      owedToMe += debt;
    } else {
      iOwe += Math.abs(debt);
    }
    
    people.push({
      name: data[i][0],
      account: data[i][1],
      amount: debt,
      lastUpdate: data[i][3]
    });
  }
  
  return {
    owedToMe: owedToMe,
    iOwe: iOwe,
    net: owedToMe - iOwe,
    people: people
  };
}
