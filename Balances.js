
/********** Balances.gs — أرصدة الحسابات (تقديري) **********
 * - يسجل رصيد لكل حساب/محفظة بناءً على العمليات
 * - يرسل إشعار بالمتبقي للحساب الأساسي (مثلاً الراجحي) عند التحويل/الخصم
 *******************************************************/

function ensureBalancesSheet_() {
  var sh = _sheet('Account_Balances');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الحساب', 'الرصيد', 'آخر تحديث']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('B:B').setNumberFormat('#,##0.00');
    sh.getRange('C:C').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  return sh;
}

function getBalance_(accountKey) {
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||'') === String(accountKey||'')) return Number(data[i][1]||0);
  }
  return 0;
}

function setBalance_(accountKey, newBalance) {
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||'') === String(accountKey||'')) {
      sh.getRange(i+1, 2).setValue(Number(newBalance||0));
      sh.getRange(i+1, 3).setValue(new Date());
      return;
    }
  }
  sh.appendRow([String(accountKey||''), Number(newBalance||0), new Date()]);
}

/**
 * تحديث رصيد حساب واحد بناءً على العملية
 * - إذا العملية "صادر" تقلل الرصيد
 * - إذا "وارد" تزيد الرصيد
 */
function applyTxnToBalance_(accountKey, amount, isIncoming) {
  var cur = getBalance_(accountKey);
  var delta = Number(amount||0);
  var next = isIncoming ? (cur + delta) : (cur - delta);
  setBalance_(accountKey, next);
  return next;
}

/**
 * الحصول على جميع أرصدة الحسابات
 * @returns {Array} مصفوفة من الحسابات مع أرصدتها
 */
function getAllBalances_() {
  var sh = ensureBalancesSheet_();
  var data = sh.getDataRange().getValues();
  var balances = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      balances.push({
        account: String(data[i][0] || ''),
        balance: Number(data[i][1] || 0),
        lastUpdate: data[i][2] || null
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
