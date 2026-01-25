/********** Sovereign V120 – R3.3 | Utils.gs **********/

function safeNotify(msg, optChatId) {
  try {
    SpreadsheetApp.getUi().alert(msg);
    return;
  } catch (e) { /* ignore */ }

  try {
    sendTelegram_(optChatId || ENV.CHAT_ID, msg);
  } catch (e2) { /* ignore */ }

  console.log(msg);
}

/** محلّل مدخلات عام: Telegram JSON أو JSON عام {text:"..."} أو نص عادي */
function _parseIncoming_(raw) {
  if (!raw) return { kind: 'none' };
  var s = String(raw).trim();

  if (s.charAt(0) === '{') {
    try {
      var obj = JSON.parse(s);

      // Telegram-like?
      if (obj.update_id || obj.message || obj.channel_post || obj.callback_query) {
        return { kind: 'telegram', update: obj };
      }

      // Generic JSON -> text/body/message/content
      var txt = obj.text || obj.message || obj.body || obj.content;
      if (typeof txt === 'string' && txt.length) return { kind: 'text', text: txt };

    } catch (e) {
      // treat as plain text
    }
  }
  return { kind: 'text', text: raw };
}

function isDuplicateV120(key) {
  var cache = CacheService.getScriptCache();
  if (cache.get(key)) return true;
  cache.put(key, '1', 600);
  return false;
}

function emergencyResetV114() {
  CacheService.getScriptCache().removeAll(['last_id']);
}

function normalizeNumber_(s) {
  s = String(s || '').trim();
  var map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','٫':'.','٬':','};
  s = s.replace(/[٠-٩٫٬]/g, function(ch){ return map[ch] || ch; });
  s = s.replace(/,/g, '').replace(/\s+/g, '');
  return s;
}
