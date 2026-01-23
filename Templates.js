
/********** Templates.gs — قوالب البنوك (مُصحح) **********/

function ensureTemplatesSheet_() {
  var sh = _sheet('Sms_Templates');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['مفعل', 'الجهة', 'Regex', 'map']);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
  }
  return sh;
}

function getTemplates_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('SMS_TEMPLATES');
  if (cached) { try { return JSON.parse(cached); } catch (e) {} }

  var sh = ensureTemplatesSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];

  var rows = sh.getRange(2, 1, last - 1, 4).getValues();
  var out = [];
  rows.forEach(function (r) {
    var enabled = String(r[0] || '').toLowerCase();
    if (!(enabled === 'true' || enabled === '1' || enabled === 'yes')) return;
    out.push({ org: String(r[1] || ''), re: String(r[2] || ''), map: String(r[3] || '') });
  });

  cache.put('SMS_TEMPLATES', JSON.stringify(out), 300);
  return out;
}

function parseByTemplates_(text) {
  var tpls = getTemplates_();
  var s = String(text || '');

  for (var i = 0; i < tpls.length; i++) {
    var re;
    try { re = new RegExp(tpls[i].re, 'i'); } catch (e) { continue; }
    var m = s.match(re);
    if (!m) continue;

    var map = {};
    tpls[i].map.split(';').forEach(function (p) {
      var kv = p.split('=');
      if (kv.length >= 2) map[kv[0].trim()] = kv.slice(1).join('=').trim();
    });

    var amount = map.amount ? Number(String(m[Number(map.amount)] || '0').replace(/,/g, '')) : null;
    var merchant = map.merchant ? String(m[Number(map.merchant)] || '').trim() : '';
    var cardLast = map.card ? String(m[Number(map.card)] || '').trim() : '';
    var date = map.date ? String(m[Number(map.date)] || '').trim().replace(/\//g, '-') : '';
    var time = map.time ? String(m[Number(map.time)] || '').trim() : '';
    var dateTime = (date && time) ? (date + ' ' + time) : '';

    return { ok: true, extracted: { dateTime: dateTime, cardLast: cardLast, merchant: merchant, amount: amount, org: tpls[i].org } };
  }
  return { ok: false };
}

function seedTemplates_() {
  var sh = ensureTemplatesSheet_();
  var rows = [
    [true, 'عام', 'شراء\\s+POS\\s+بـ\\s*(\\d[\\d\\.,]*)\\s*SAR\\s+من\\s+(.+?)\\s+عبر\\s+.*?\\*\\*(\\d{3,6}).*?في\\s+(\\d{4}-\\d{2}-\\d{2})\\s+(\\d{2}:\\d{2}:\\d{2})',
      'amount=1;merchant=2;card=3;date=4;time=5'],

    [true, 'محافظ', '(شحن|إضافة|Add\\s*Money|Top\\s*Up).*?(tiqmo|stc\\s*pay|stc\\s*bank|Apple\\s*Pay).*?(\\d[\\d\\.,]*)\\s*(SAR|ريال)',
      'merchant=2;amount=3']
  ];
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
  safeNotify('✅ تم زرع قوالب Sms_Templates. عدّل/أضف حسب رسائل بنوكك.');
}
