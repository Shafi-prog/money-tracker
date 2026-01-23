/********** Sovereign V1.0 | Debt.gs **********/

function updateDebtIndex_(data) {
  try {
    var sIdx = _sheet('Debt_Index');
    var party = (data.merchant || 'غير محدد');
    var acct = (data.cardNum || data.accNum || '');

    // ما ندفعه = عليهم لنا (+). ما نستلمه منهم = يقلل.
    var sign = data.isIncoming ? -1 : 1;
    var delta = sign * (Number(data.amount) || 0);

    var vals = sIdx.getDataRange().getValues();
    var found = -1;

    for (var i = 1; i < vals.length; i++) {
      if ((vals[i][0] || '') === party && (vals[i][1] || '') === acct) { found = i; break; }
    }

    if (found > 0) {
      var cur = Number(vals[found][2]) || 0;
      sIdx.getRange(found + 1, 2).setValue(acct);
      sIdx.getRange(found + 1, 3).setValue(cur + delta);
      sIdx.getRange(found + 1, 4).setValue(new Date());
    } else {
      sIdx.appendRow([party, acct, delta, new Date()]);
    }
  } catch (e) { /* ignore */ }
}

/**
 * Multi-User: تتبع ديون متعددة المستخدمين
 */
function updateDebtIndexMultiUser_(data, userId) {
  try {
    var sIdx = _sheet('Debt_Index_' + userId);
    if (!sIdx || sIdx.getLastRow() === 0) {
      sIdx = _sheet('Debt_Index_' + userId);
      sIdx.appendRow(['الطرف', 'الحساب/الطرف', 'صافي مُستحق لنا (+) / علينا (-)', 'آخر تحديث', 'المستخدم']);
      sIdx.setFrozenRows(1);
      sIdx.setRightToLeft(true);
    }

    var party = (data.merchant || 'غير محدد');
    var acct = (data.cardNum || data.accNum || '');

    var sign = data.isIncoming ? -1 : 1;
    var delta = sign * (Number(data.amount) || 0);

    var vals = sIdx.getDataRange().getValues();
    var found = -1;

    for (var i = 1; i < vals.length; i++) {
      if ((vals[i][0] || '') === party && (vals[i][1] || '') === acct) { found = i; break; }
    }

    if (found > 0) {
      var cur = Number(vals[found][2]) || 0;
      sIdx.getRange(found + 1, 3).setValue(cur + delta);
      sIdx.getRange(found + 1, 4).setValue(new Date());
    } else {
      sIdx.appendRow([party, acct, delta, new Date(), userId]);
    }
  } catch (e) { /* ignore */ }
}

/**
 * احصل على إجمالي الديون لمستخدم معين
 */
function getTotalDebtForUser_(userId) {
  try {
    var sIdx = _sheet('Debt_Index_' + userId);
    if (!sIdx || sIdx.getLastRow() < 2) return 0;

    var vals = sIdx.getDataRange().getValues();
    var total = 0;

    for (var i = 1; i < vals.length; i++) {
      total += Number(vals[i][2]) || 0;
    }

    return total;
  } catch (e) {
    return 0;
  }
}
