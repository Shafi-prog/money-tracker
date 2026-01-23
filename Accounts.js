
/********** SJA-V1 | Accounts.js – Account Management (Shafi Jahz Almutiry) **********/

function ensureAccountsSheet_() {
  var sh = _sheet('Accounts');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['الاسم', 'النوع', 'الرقم/آخر4', 'الجهة', 'أسماء بديلة', 'هل حسابي؟', 'تحويل داخلي؟']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }
  return sh;
}

function loadAccountsIndex_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('ACCOUNTS_INDEX');
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var sh = ensureAccountsSheet_();
  var last = sh.getLastRow();
  var idx = { byLast: {}, byAlias: {} };

  if (last >= 2) {
    var rows = sh.getRange(2, 1, last - 1, 7).getValues();
    rows.forEach(function (r) {
      var obj = {
        name: String(r[0] || ''),
        type: String(r[1] || ''),
        num: String(r[2] || ''),
        org: String(r[3] || ''),
        isMine: String(r[5] || '').toLowerCase() === 'true',
        isInternal: String(r[6] || '').toLowerCase() === 'true'
      };

      if (obj.num) idx.byLast[obj.num] = obj;

      String(r[4] || '').split(',')
        .map(function (x) { return x.trim().toLowerCase(); })
        .filter(Boolean)
        .forEach(function (a) { idx.byAlias[a] = obj; });
    });
  }

  cache.put('ACCOUNTS_INDEX', JSON.stringify(idx), 300);
  return idx;
}

function classifyAccountFromText_(text, cardLast) {
  var idx = loadAccountsIndex_();
  var t = String(text || '').toLowerCase();

  if (cardLast && idx.byLast[cardLast]) return { hit: idx.byLast[cardLast], isInternal: !!idx.byLast[cardLast].isInternal };

  var keys = Object.keys(idx.byAlias);
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) >= 0) return { hit: idx.byAlias[keys[i]], isInternal: !!idx.byAlias[keys[i]].isInternal };
  }

  return { hit: null, isInternal: false };
}

function seedAccounts_() {
  var sh = ensureAccountsSheet_();
  var rows = [
    ['الراجحي 9767', 'بنك', '9767', 'AlrajhiBank', 'الراجحي,alrajhi,alrajhi bank', true, false],
    ['بطاقة **0305', 'بطاقة', '0305', 'MasterCard', 'mastercard,apple pay', true, false],
    ['tiqmo', 'محفظة', '', 'tiqmo', 'tiqmo,تيقمو', true, true],
    ['STC Bank', 'محفظة', '', 'STC Bank', 'stc bank,stc pay,stcpay,إس تي سي', true, true]
  ];
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  safeNotify('✅ تم زرع Accounts (عدّلها حسب بياناتك).');
}
