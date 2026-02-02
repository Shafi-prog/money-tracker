/********** Dedup.gs — Idempotency (مُصحح) **********/

function SOV1_normalizeMerchant_(s) {
  s = String(s || '').trim().toLowerCase();
  s = s.replace(/[\u200E\u200F]/g, '');
  s = s.replace(/[^\p{L}\p{N}\s]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/\b(co|company|ltd|sa|ksa)\b/g, '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 100);
}

function SOV1_extractFingerprintParts_(text) {
  var t = String(text || '').replace(/\s+/g, ' ').trim();

  var dateTime = '';
  var mDT = t.match(/في\s+(\d{4}[-\/]\d{2}[-\/]\d{2})\s+(\d{2}:\d{2}:\d{2})/);
  if (mDT) dateTime = mDT[1].replace(/\//g, '-') + ' ' + mDT[2];
  if (!dateTime) {
    var mD = t.match(/(\d{4}[-\/]\d{2}[-\/]\d{2})/);
    var mT = t.match(/(\d{1,2}:\d{2}:\d{2})/);
    if (mD && mT) dateTime = mD[1].replace(/\//g, '-') + ' ' + mT[1];
  }

  var cardLast = '';
  var mCard = t.match(/\*\*(\d{3,6})/);
  if (mCard) cardLast = mCard[1];

  var merchant = '';
  var mMer = t.match(/من\s+(.+?)(?:\s+عبر|\s+في|$)/i);
  if (mMer) merchant = mMer[1].trim();

  return { dateTime: dateTime, cardLast: cardLast, merchant: merchant };
}

function SOV1_buildFingerprint_(text) {
  var p = SOV1_extractFingerprintParts_(text);
  var dt = p.dateTime || 'NA';
  var card = p.cardLast || 'NA';
  var merch = SOV1_normalizeMerchant_(p.merchant || '') || 'na';
  return dt + '|' + card + '|' + merch;
}

function SOV1_isDupQuick_(fingerprint) {
  var cache = CacheService.getScriptCache();
  var k = 'SOV1_DUPQ_' + String(fingerprint || '').slice(0, 200);
  if (cache.get(k)) return true;
  cache.put(k, '1', 3600);
  return false;
}

function SOV1_isDuplicatePersistent_(fingerprint, ttlHours) {
  ttlHours = ttlHours || 72;
  fingerprint = String(fingerprint || '');

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return false; // Fail open if can't lock? Or fail safe? Better fail safe but assume duplicate if unsure? No, assume NOT duplicate if locked out, or just wait. waitLock handles it.

  try {
    var sh = _sheet('Dedup_Events');
    if (sh.getLastRow() === 0) {
      sh.appendRow(['الوقت', 'البصمة', 'الحالة']);
      sh.setFrozenRows(1);
      sh.setRightToLeft(true);
      sh.getRange('A:A').setNumberFormat('yyyy-MM-dd HH:mm:ss');
    }

    // Optimization: Only clean occasionally or if too big? 
    // Cleaning every check is expensive. Let's trust the cleanup logic is efficient enough or do it randomly.
    if (Math.random() < 0.1) SOV1_cleanupDedup_(sh, ttlHours);

    var last = sh.getLastRow();
    var n = Math.min(2500, Math.max(0, last - 1));
    if (n > 0) {
      var vals = sh.getRange(last - n + 1, 2, n, 1).getValues();
      for (var i = 0; i < vals.length; i++) {
        if (String(vals[i][0] || '') === fingerprint) return true;
      }
    }

    sh.appendRow([new Date(), fingerprint, 'OK']);
    return false;
  } catch (e) {
    // If error accessing sheet, assume not duplicate to allow processing, or maybe log error.
    return false;
  } finally {
    lock.releaseLock();
  }
}

function SOV1_cleanupDedup_(sh, ttlHours) {
  try {
    var cutoff = new Date(Date.now() - ttlHours * 3600 * 1000);
    var last = sh.getLastRow();
    if (last < 2) return;

    // Read timestamps
    // Optimization: Check only top rows? The sheet appends, so old are at top.
    // Actually AppendRow adds to bottom. So old are at TOP usually? 
    // Wait, AppendRow adds to the end. So index 2 is oldest.
    
    var times = sh.getRange(2, 1, Math.min(last-1, 500), 1).getValues(); 
    var deleteCount = 0;

    for (var i = 0; i < times.length; i++) {
      var d = times[i][0];
      if (d instanceof Date && d < cutoff) { 
        deleteCount++;
      } else {
        break; 
      }
    }
    if (deleteCount > 0) sh.deleteRows(2, deleteCount);
  } catch (e) {}
}
