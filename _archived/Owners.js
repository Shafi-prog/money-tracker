
/***************
 * Owners.gs
 * تحديد صاحب العملية (Owner) لدعم زوج/زوجة/مشترك
 ***************/

/**
 * إعدادات مقترحة في Script Properties:
 * OWNER_1_NAME = شافي
 * OWNER_1_KEYS = 4912,8001,Card****,Acc****
 * OWNER_2_NAME = زوجة
 * OWNER_2_KEYS = 1234,9002,...
 * JOINT_KEYS   = (اختياري) مفاتيح تعتبر مشتركة
 */

function resolveOwnerV120_(ai, sourceLabel) {
  var src = String(sourceLabel || '').toLowerCase();

  // 1) من المصدر إن كان واضحًا
  if (src.indexOf('زوج') >= 0 || src.indexOf('wife') >= 0) return getProp_('OWNER_2_NAME', 'زوجة');
  if (src.indexOf('شافي') >= 0 || src.indexOf('shafi') >= 0) return getProp_('OWNER_1_NAME', 'شافي');

  // 2) من مفاتيح الحساب/البطاقة
  var key = (String(ai && ai.accNum || '') + ' ' + String(ai && ai.cardNum || '')).toLowerCase();

  if (matchesOwnerKeys_(key, getProp_('JOINT_KEYS', ''))) return 'مشترك';

  var o1 = getProp_('OWNER_1_NAME', 'شافي');
  var k1 = getProp_('OWNER_1_KEYS', '');
  if (matchesOwnerKeys_(key, k1)) return o1;

  var o2 = getProp_('OWNER_2_NAME', 'زوجة');
  var k2 = getProp_('OWNER_2_KEYS', '');
  if (matchesOwnerKeys_(key, k2)) return o2;

  return 'غير محدد';
}

function matchesOwnerKeys_(text, csvKeys) {
  var keys = String(csvKeys || '')
    .split(',')
    .map(function(s){ return s.trim().toLowerCase(); })
    .filter(Boolean);

  if (!keys.length) return false;

  for (var i = 0; i < keys.length; i++) {
    if (keys[i] && text.indexOf(keys[i]) >= 0) return true;
  }
  return false;
}

function getProp_(k, fallback) {
  try {
    return PropertiesService.getScriptProperties().getProperty(k) || fallback || '';
  } catch (e) {
    return fallback || '';
  }
}
