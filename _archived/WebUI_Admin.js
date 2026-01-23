
/********** WebUI_Admin.gs — إدارة الحسابات وقوالب الرسائل من الواجهة **********
 * يعتمد على:
 * - Config.gs (_sheet)
 * - WebUI.gs (SOV1_UI_requireAuth_)
 * - Accounts.gs / Templates.gs (أسماء الأوراق)
 ********************************************************************/

function SOV1_UI_getAccounts_(token) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  var last = sh.getLastRow();
  if (last < 2) return [];

  var rows = sh.getRange(2, 1, last - 1, 7).getValues();
  return rows.map(function (r, i) {
    return {
      row: i + 2,
      name: String(r[0] || ''),
      type: String(r[1] || ''),
      last4: String(r[2] || ''),
      org: String(r[3] || ''),
      aliases: String(r[4] || ''),
      isMine: String(r[5] || '').toLowerCase() === 'true',
      isInternal: String(r[6] || '').toLowerCase() === 'true'
    };
  });
}

function SOV1_UI_upsertAccount_(token, obj) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  obj = obj || {};

  var name = String(obj.name || '').trim();
  var type = String(obj.type || '').trim();
  var last4 = String(obj.last4 || '').trim();
  var org = String(obj.org || '').trim();
  var aliases = String(obj.aliases || '').trim();
  var isMine = !!obj.isMine;
  var isInternal = !!obj.isInternal;
  var row = Number(obj.row || 0);

  if (!name) throw new Error('اسم الحساب مطلوب');
  if (!type) throw new Error('نوع الحساب مطلوب (بنك/محفظة/بطاقة)');
  if (!org) throw new Error('الجهة مطلوبة');

  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  var values = [[name, type, last4, org, aliases, String(isMine), String(isInternal)]];
  if (row >= 2) {
    sh.getRange(row, 1, 1, 7).setValues(values);
  } else {
    sh.appendRow(values[0]);
    row = sh.getLastRow();
  }

  SpreadsheetApp.flush();
  return { ok: true, row: row };
}

function SOV1_UI_deleteAccount_(token, row) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');

  var sh = _sheet('Accounts');
  sh.deleteRow(row);
  return { ok: true };
}

// ===================== Templates =====================

function SOV1_UI_getTemplates_(token) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');

  var sh = _sheet('Sms_Templates');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['مفعل', 'الجهة', 'Regex', 'map']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  var last = sh.getLastRow();
  if (last < 2) return [];

  var rows = sh.getRange(2, 1, last - 1, 4).getValues();
  return rows.map(function (r, i) {
    return {
      row: i + 2,
      enabled: String(r[0] || '').toLowerCase(),
      org: String(r[1] || ''),
      regex: String(r[2] || ''),
      map: String(r[3] || '')
    };
  });
}

function SOV1_UI_validateRegex_(pattern) {
  pattern = String(pattern || '');
  try {
    new RegExp(pattern, 'i');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function SOV1_UI_upsertTemplate_(token, obj) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  obj = obj || {};

  var enabled = String(obj.enabled || 'true').trim();
  var org = String(obj.org || '').trim();
  var regex = String(obj.regex || '').trim();
  var map = String(obj.map || '').trim();
  var row = Number(obj.row || 0);

  if (!org) throw new Error('الجهة مطلوبة');
  if (!regex) throw new Error('Regex مطلوب');
  if (!map) throw new Error('map مطلوب');

  var v = SOV1_UI_validateRegex_(regex);
  if (!v.ok) throw new Error('Regex غير صالح: ' + v.error);

  var sh = _sheet('Sms_Templates');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['مفعل', 'الجهة', 'Regex', 'map']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }

  var values = [[enabled, org, regex, map]];
  if (row >= 2) {
    sh.getRange(row, 1, 1, 4).setValues(values);
  } else {
    sh.appendRow(values[0]);
    row = sh.getLastRow();
  }

  SpreadsheetApp.flush();
  return { ok: true, row: row };
}

function SOV1_UI_deleteTemplate_(token, row) {
  if (typeof SOV1_UI_requireAuth_ === 'function' && !SOV1_UI_requireAuth_(token)) throw new Error('غير مصرح');
  row = Number(row || 0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');

  var sh = _sheet('Sms_Templates');
  sh.deleteRow(row);
  return { ok: true };
}
