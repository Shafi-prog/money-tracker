/* Temporary debug helpers - remove after use */
function CLI_getTelegramProps() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TELEGRAM_TOKEN') || props.getProperty('TELEGRAM_BOT_TOKEN') || (typeof ENV !== 'undefined' ? ENV.TELEGRAM_TOKEN : null);
  var chat = props.getProperty('TELEGRAM_CHAT_ID') || props.getProperty('TELEGRAM_CHATID') || (typeof ENV !== 'undefined' ? (ENV.CHAT_ID || ENV.CHANNEL_ID) : null);
  return { tokenPresent: !!token, token: token ? '*****' : null, chatId: chat || null };
}

// Send test message to configured chat id
function CLI_sendTestToConfiguredChat(text) {
  var p = CLI_getTelegramProps();
  if (!p.chatId) return { success: false, error: 'no chat id configured' };
  var t = String(text || 'Hello from CLI test');
  if (typeof SEND_TEST_TELEGRAM === 'function') {
    return SEND_TEST_TELEGRAM(p.chatId, t);
  } else if (typeof sendTelegramLogged_ === 'function') {
    return sendTelegramLogged_(p.chatId, t, {});
  } else {
    return { success: false, error: 'No telegram send function available' };
  }
}

// Temporary: return the raw token (remove after debugging)
function CLI_getTelegramToken() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('TELEGRAM_TOKEN') || props.getProperty('TELEGRAM_BOT_TOKEN') || (typeof ENV !== 'undefined' ? ENV.TELEGRAM_TOKEN : null);
}

// Simulate a Telegram update (message text) and run handleTelegramWebhook_
function CLI_simulateTelegramCommand(text, fromId) {
  var props = PropertiesService.getScriptProperties();
  var chat = props.getProperty('TELEGRAM_CHAT_ID') || props.getProperty('TELEGRAM_CHATID') || (typeof ENV !== 'undefined' ? (ENV.CHAT_ID || ENV.CHANNEL_ID) : null);
  if (!chat) return { success: false, error: 'No chat configured' };

  var u = {
    update_id: Math.floor(Math.random() * 1000000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      date: Math.floor(Date.now() / 1000),
      chat: { id: Number(chat) },
      text: String(text || '/help'),
      from: { id: Number(fromId || 11111111), is_bot: false, first_name: 'Debug' }
    }
  };

  // If this is a command (starts with '/'), call handleTelegramCommand_ directly
  if (String(u.message.text || '').trim().charAt(0) === '/') {
    if (typeof handleTelegramCommand_ === 'function') {
      try {
        return handleTelegramCommand_(u.message.chat.id, u.message.text, u.message);
      } catch (e) {
        return { success: false, error: String(e) };
      }
    }
    return { success: false, error: 'handleTelegramCommand_ not available' };
  }

  // Otherwise, queue for async processing (simulate enqueue)
  if (typeof SOV1_enqueue_ === 'function') {
    try {
      SOV1_enqueue_('تليجرام_Sim', u.message.text, { chatId: u.message.chat.id, fromId: u.message.from.id }, null);
      return { success: true, queued: true };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  return { success: false, error: 'No queue or command handler available' };
}

// Shortcut to simulate /balances without params (avoids JSON quoting issues on Windows)
function CLI_simulateBalances() {
  return CLI_simulateTelegramCommand('/balances');
}

// Shortcut to simulate /budgets
function CLI_simulateBudgets() {
  return CLI_simulateTelegramCommand('/budgets');
}

// Dump last N rows from Ingress_Debug sheet
function CLI_dumpIngressDebug(n) {
  try {
    n = Math.max(1, Math.min(100, Number(n) || 20));
    var sh = _sheet('Ingress_Debug');
    if (!sh) return { success: false, error: 'Ingress_Debug sheet not found' };
    var last = sh.getLastRow();
    if (last < 2) return { success: true, rows: [] };
    var start = Math.max(2, last - n + 1);
    var rows = sh.getRange(start, 1, last - start + 1, 5).getValues();
    var out = rows.map(function(r) {
      return { time: r[0], level: r[1], where: r[2], meta: r[3], raw: r[4] };
    });
    return { success: true, rows: out };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Read last N rows from Ingress_Debug sheet (safe helper)
function CLI_dumpIngressDebug(n) {
  try {
    n = Math.max(1, Number(n) || 20);
    var sh = _sheet('Ingress_Debug');
    if (!sh) return { success: true, rows: [] };
    var last = sh.getLastRow();
    if (last < 2) return { success: true, rows: [] };
    var start = Math.max(2, last - n + 1);
    var rows = sh.getRange(start, 1, last - start + 1, 5).getValues();
    var out = rows.map(function(r){ return { time: r[0], level: r[1], where: r[2], meta: r[3], raw: r[4] }; });
    return { success: true, rows: out };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
