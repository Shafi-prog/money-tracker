
/********** AccountDiscovery.gs — اكتشاف بطاقات/حسابات غير معروفة **********
 * الورقة: Account_Alerts
 * إذا ظهرت بطاقة جديدة أو Account No جديد → نسجله ونرسل تنبيه تيليجرام.
 * الهدف: STC حساب واحد ببطاقتين، وتجديد البطاقة لا يضيع الربط.
 ********************************************************************/

function SOV1_ensureAccountAlertsSheet_() {
  var sh = _sheet('Account_Alerts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الوقت','الحالة','البنك/الجهة','الحساب','البطاقة','التاجر','المبلغ','النص الخام','ملاحظات']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  return sh;
}

function SOV1_accountsIndex_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟', 'مجموعة_الحساب']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  } else {
    // تأكد وجود عمود مجموعة_الحساب (اختياري)
    var header = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    if (header.indexOf('مجموعة_الحساب') === -1) {
      sh.getRange(1, sh.getLastColumn()+1).setValue('مجموعة_الحساب');
    }
  }

  var last = sh.getLastRow();
  var idx = { byLast4: {}, byOrg: {} };
  if (last < 2) return idx;

  var colCount = sh.getLastColumn();
  var rows = sh.getRange(2,1,last-1,colCount).getValues();

  rows.forEach(function(r){
    var name = String(r[0]||'');
    var type = String(r[1]||'');
    var last4 = String(r[2]||'').trim();
    var org = String(r[3]||'').trim();
    var aliases = String(r[4]||'').toLowerCase();
    var group = (colCount>=8) ? String(r[7]||'').trim() : '';

    var obj = { name:name, type:type, last4:last4, org:org, aliases:aliases, group:group };
    if (last4) idx.byLast4[last4] = obj;
    if (org) (idx.byOrg[org] = idx.byOrg[org] || []).push(obj);
  });

  return idx;
}

/**
 * يتحقق هل البطاقة/الحساب معروفين؛ وإن لا، يسجل Alert ويرسل Telegram.
 * لا يمنع التسجيل في Sheet1 (حسب رغبتك)، لكنه يطلب “تعريف” لاحقًا.
 */
function SOV1_detectUnknownAccount_(ai, raw) {
  var idx = SOV1_accountsIndex_();
  var card = String(ai.cardNum || '').replace(/\D/g,'');   // آخر4 إن أمكن
  var acc  = String(ai.accNum || '').replace(/\D/g,'');    // مثل 9767 أو 9682
  var org  = String(ai.org || ai.bank || '').trim();       // إن وجد
  var merch = String(ai.merchant || '');
  var amt = Number(ai.amount||0);

  // اعتبر cardNum هو last4 فقط
  var knownCard = card && idx.byLast4[card];
  var knownAcc  = acc && idx.byLast4[acc]; // أحيانًا نخزن الحساب آخر4 في نفس العمود
  var isKnown = !!(knownCard || knownAcc);

  if (isKnown) return { ok:true, known:true };

  // سجل Alert
  var sh = SOV1_ensureAccountAlertsSheet_();
  sh.appendRow([new Date(), 'NEW', org || 'غير معروف', acc || '', card || '', merch, amt, String(raw||''), 'حساب/بطاقة غير معرفة']);

  // اشعار تيليجرام
  var hub = (typeof getHubChatId_ === 'function') ? getHubChatId_() : (ENV.CHAT_ID||'');
  if (hub && typeof sendTelegram_ === 'function') {
    sendTelegram_(hub,
      '⚠️ اكتشاف حساب/بطاقة غير معرفة\n' +
      'الجهة: ' + (org||'غير معروف') + '\n' +
      'الحساب: ' + (acc||'—') + '\n' +
      'البطاقة: ' + (card||'—') + '\n' +
      'التاجر: ' + (merch||'—') + '\n' +
      'المبلغ: ' + amt.toFixed(2) + ' SAR\n' +
      '📌 راجع تبويب الحسابات في الواجهة لتعريفها.'
    );
  }

  return { ok:true, known:false };
}
