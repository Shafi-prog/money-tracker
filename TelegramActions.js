
/********** Telegram_Actions.gs — Inline Actions **********/

function SOV1_TG_api_(method, payload) {
  var url = 'https://api.telegram.org/bot' + ENV.TELEGRAM_TOKEN + '/' + method;
  var resp = UrlFetchApp.fetch(url, { method:'post', payload: payload, muteHttpExceptions:true });
  var code = resp.getResponseCode();
  var body = resp.getContentText();
  if (code !== 200) {
    try { if (typeof logIngressEvent_ === 'function') logIngressEvent_('ERROR', 'tg_api_' + method, { code: code }, body); } catch (_) {}
  }
  return { code: code, body: body };
}

function SOV1_TG_answer_(cbId, text) {
  // الرد ضروري لتفادي شريط التحميل
  if (typeof SOV1_answerCallback_ === 'function') {
    SOV1_answerCallback_(cbId, text || 'تم');
  } else {
    SOV1_TG_api_('answerCallbackQuery', { callback_query_id: cbId, text: text || 'تم', show_alert: false });
  }
}

function SOV1_lastTxnRow_() {
  var s1 = _sheet('Sheet1');
  var last = s1.getLastRow();
  return (last >= 2) ? last : 0;
}

function SOV1_getTxn_(row) {
  var s1 = _sheet('Sheet1');
  var r = s1.getRange(row, 1, 1, 13).getValues()[0];
  return {
    row: row,
    date: (r[1] instanceof Date) ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : '',
    amount: Number(r[8]||0),
    merchant: r[9] || '',
    category: r[10] || '',
    type: r[11] || '',
    acc: r[6] || '',
    card: r[7] || ''
  };
}

function SOV1_getCats_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('TG_CATS');
  if (cached) { try { return JSON.parse(cached); } catch(e){} }

  var sB = _sheet('Budgets');
  var last = sB.getLastRow();
  if (last < 2) return [];
  var cats = sB.getRange(2,1,last-1,1).getValues().map(function(x){return String(x[0]||'').trim();}).filter(Boolean);

  cache.put('TG_CATS', JSON.stringify(cats), 900);
  return cats;
}

function SOV1_renderCategoryMenu_(uuidOrRow, page, useUuid) {
  var cats = SOV1_getCats_();
  if (!cats.length) return { ok: false, keyboard: [] };

  var perPage = 8;
  var totalPages = Math.max(1, Math.ceil(cats.length / perPage));
  page = Math.max(0, Math.min(Number(page || 0), totalPages - 1));
  var start = page * perPage;
  var slice = cats.slice(start, start + perPage);

  var keyboard = [];
  for (var i = 0; i < slice.length; i++) {
    var cat = slice[i];
    if (useUuid) {
      keyboard.push([{ text: cat, callback_data: 'setcat:' + uuidOrRow + ':' + cat }]);
    } else {
      keyboard.push([{ text: cat, callback_data: 'SETCAT|' + uuidOrRow + '|' + cat }]);
    }
  }

  var nav = [];
  if (page > 0) nav.push({ text: '⬅️ السابق', callback_data: (useUuid ? ('edit_cat:' + uuidOrRow + ':' + (page - 1)) : ('CATMENU|' + uuidOrRow + '|' + (page - 1))) });
  if (page < totalPages - 1) nav.push({ text: 'التالي ➡️', callback_data: (useUuid ? ('edit_cat:' + uuidOrRow + ':' + (page + 1)) : ('CATMENU|' + uuidOrRow + '|' + (page + 1))) });
  if (nav.length) keyboard.push(nav);

  keyboard.push([{ text: '❌ إلغاء', callback_data: (useUuid ? ('cancel:' + uuidOrRow) : ('BACK|' + uuidOrRow)) }]);

  return { ok: true, keyboard: keyboard, page: page, totalPages: totalPages };
}

function SOV1_renderTxnCard_(t) {
  return (
    '🧾 <b>آخر عملية</b>\n' +
    '🕒 ' + t.date + '\n' +
    '💰 <b>' + t.amount.toFixed(2) + ' SAR</b>\n' +
    '👤 ' + (t.merchant || 'غير محدد') + '\n' +
    '🏷️ ' + (t.category || '—') + ' — ' + (t.type || '—') + '\n' +
    (t.acc ? ('🏦 ' + t.acc + '\n') : '') +
    (t.card ? ('💳 ' + t.card + '\n') : '') +
    '📌 الصف: ' + t.row
  );
}

function SOV1_sendLastActionCard_(chatId) {
  var row = SOV1_lastTxnRow_();
  if (!row) { sendTelegram_(chatId, 'لا توجد عمليات بعد.'); return; }

  var kb = { inline_keyboard: [
    [{ text: '🏷️ تغيير التصنيف', callback_data: 'CATMENU|' + row }],
    [{ text: '🔁 تحويل داخلي', callback_data: 'INTERNAL|' + row }],
    [{ text: '📊 تقرير اليوم', callback_data: 'REPORT|today' }]
  ]};

  var t = SOV1_getTxn_(row);
  SOV1_TG_api_('sendMessage', {
    chat_id: chatId,
    text: SOV1_renderTxnCard_(t),
    parse_mode: 'HTML',
    reply_markup: JSON.stringify(kb)
  });
}

function SOV1_showCategoryMenu_(chatId, messageId, row, page) {
  var menu = SOV1_renderCategoryMenu_(row, page || 0, false);
  if (!menu.ok) {
    SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '⚠️ لا توجد تصنيفات في Budgets.' });
    return;
  }

  SOV1_TG_api_('editMessageReplyMarkup', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: JSON.stringify({ inline_keyboard: menu.keyboard })
  });
}

function SOV1_markInternal_(row) {
  row = Number(row||0);
  if (row < 2) throw new Error('رقم الصف غير صحيح');
  var s1 = _sheet('Sheet1');
  s1.getRange(row, 11).setValue('حوالة داخلية');
  s1.getRange(row, 12).setValue('تحويل داخلي');
  SpreadsheetApp.flush();
}

function SOV1_applyCategoryChange_(row, newCategory) {
  // نستخدم دالة الواجهة نفسها لتحديث Budgets بشكل صحيح
  return SOV1_UI_changeCategory_(row, newCategory);
}

function SOV1_handleCallback_(cb) {
  var cbId = cb.id;
  var msg = cb.message || {};
  var chatId = msg.chat ? String(msg.chat.id) : '';
  var messageId = msg.message_id;
  var data = String(cb.data || '');

  SOV1_TG_answer_(cbId, 'جاري التنفيذ...');

  try {
    // ✅ تنسيق جديد: action:uuid
    if (data.indexOf(':') !== -1) {
      var colonParts = data.split(':');
      var action = colonParts[0];
      var uuid = colonParts[1];
      var page = (colonParts.length > 2) ? Number(colonParts[2]) : 0;
      
      // حذف معاملة
      if (action === 'delete') {
        if (typeof deleteTransaction_ === 'function') {
          var result = deleteTransaction_(uuid);
          if (result.success) {
            SOV1_TG_api_('editMessageText', {
              chat_id: chatId,
              message_id: messageId,
              text: '🗑️ <b>تم الحذف</b>\n\n' +
                    '✅ تم حذف المعاملة من:\n' +
                    result.deleted.map(function(s) { return '• ' + s; }).join('\n'),
              parse_mode: 'HTML'
            });
          } else {
            SOV1_TG_api_('sendMessage', {
              chat_id: chatId,
              text: '❌ فشل الحذف: ' + (result.errors ? result.errors.join(', ') : 'خطأ غير معروف')
            });
          }
        }
        return;
      }
      
      // تعديل التصنيف
      if (action === 'edit_cat') {
        var menu = SOV1_renderCategoryMenu_(uuid, page, true);
        if (!menu.ok) {
          SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '⚠️ لا توجد تصنيفات في Budgets.' });
          return;
        }

        SOV1_TG_api_('editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({ inline_keyboard: menu.keyboard })
        });
        return;
      }
      
      // تعيين التصنيف
      if (action === 'setcat') {
        var txUUID = uuid;
        var newCat = colonParts.slice(2).join(':');
        
        if (typeof API_updateTransaction === 'function') {
          var updateResult = API_updateTransaction(txUUID, { Category: newCat });
          if (updateResult && updateResult.success) {
            SOV1_TG_api_('editMessageText', {
              chat_id: chatId,
              message_id: messageId,
              text: '✅ تم تغيير التصنيف إلى: <b>' + newCat + '</b>',
              parse_mode: 'HTML'
            });
          } else {
            SOV1_TG_api_('sendMessage', {
              chat_id: chatId,
              text: '❌ لم يتم تحديث التصنيف. تحقق من الربط بين Sheet1 و Budgets.'
            });
          }
        } else {
          SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '❌ API_updateTransaction غير موجودة.' });
        }
        return;
      }
      
      // إلغاء
      if (action === 'cancel') {
        SOV1_TG_api_('editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: JSON.stringify({ inline_keyboard: [] })
        });
        return;
      }
      
      // تقرير
      if (action === 'report') {
        if (uuid === 'today') {
          if (typeof sendTodayReport_ === 'function') sendTodayReport_(chatId);
          else if (typeof SOV1_sendDailyReport_ === 'function') SOV1_sendDailyReport_(chatId);
        } else if (uuid === 'week') {
          if (typeof sendPeriodSummary_ === 'function') sendPeriodSummary_(chatId, 'week');
        } else if (uuid === 'month') {
          if (typeof sendPeriodSummary_ === 'function') sendPeriodSummary_(chatId, 'month');
        }
        return;
      }
      
      // أرصدة الحسابات
      if (action === 'balances' || data === 'balances') {
        if (typeof sendAllBalancesToTelegram_ === 'function') {
          sendAllBalancesToTelegram_(chatId);
        } else {
          SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '⚠️ وظيفة الأرصدة غير متاحة حالياً.' });
        }
        return;
      }
      
      // آخر N عمليات
      if (action === 'last') {
        var n = Number(uuid) || 5;
        if (typeof sendLastNToTelegram_ === 'function') {
          sendLastNToTelegram_(chatId, n);
        } else if (typeof SOV1_sendLastActionCard_ === 'function') {
          SOV1_sendLastActionCard_(chatId);
        }
        return;
      }
      
      // الميزانيات
      if (action === 'budgets' || data === 'budgets') {
        if (typeof sendBudgetsSnapshotToTelegram_ === 'function') {
          sendBudgetsSnapshotToTelegram_(chatId);
        } else {
          SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '⚠️ وظيفة الميزانيات غير متاحة حالياً.' });
        }
        return;
      }
    }
    
    // ✅ تنسيق قديم: OP|param1|param2
    var parts = data.split('|');
    var op = parts[0];

    if (op === 'CATMENU') {
      var row = Number(parts[1]);
      var page2 = (parts.length > 2) ? Number(parts[2]) : 0;
      SOV1_showCategoryMenu_(chatId, messageId, row, page2);
      return;
    }

    if (op === 'SETCAT') {
      var row2 = Number(parts[1]);
      var cat = parts.slice(2).join('|');
      var res = SOV1_applyCategoryChange_(row2, cat);
      var t = SOV1_getTxn_(row2);

      var kb = { inline_keyboard: [
        [{ text: '🏷️ تغيير التصنيف', callback_data: 'CATMENU|' + row2 }],
        [{ text: '🔁 تحويل داخلي', callback_data: 'INTERNAL|' + row2 }],
        [{ text: '📊 تقرير اليوم', callback_data: 'REPORT|today' }]
      ]};

      SOV1_TG_api_('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: SOV1_renderTxnCard_(t) + '\n✅ تم تغيير التصنيف: ' + res.from + ' → ' + res.to,
        parse_mode: 'HTML',
        reply_markup: JSON.stringify(kb)
      });
      return;
    }

    if (op === 'INTERNAL') {
      var row3 = Number(parts[1]);
      SOV1_markInternal_(row3);
      var t2 = SOV1_getTxn_(row3);
      SOV1_TG_api_('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: SOV1_renderTxnCard_(t2) + '\n🔁 تم وسم العملية كتحويل داخلي (غير محتسب).',
        parse_mode: 'HTML'
      });
      return;
    }

    if (op === 'BACK') {
      var row4 = Number(parts[1]);
      var kb2 = { inline_keyboard: [
        [{ text: '🏷️ تغيير التصنيف', callback_data: 'CATMENU|' + row4 }],
        [{ text: '🔁 تحويل داخلي', callback_data: 'INTERNAL|' + row4 }],
        [{ text: '📊 تقرير اليوم', callback_data: 'REPORT|today' }]
      ]};
      SOV1_TG_api_('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: JSON.stringify(kb2)
      });
      return;
    }

    if (op === 'REPORT') {
      if (typeof sendTodayReport_ === 'function') sendTodayReport_(chatId);
      else if (typeof SOV1_sendDailyReport_ === 'function') SOV1_sendDailyReport_(chatId);
      return;
    }

  } catch (err) {
    SOV1_TG_api_('sendMessage', { chat_id: chatId, text: '⚠️ خطأ أثناء تنفيذ الإجراء:\n' + String(err).slice(0,300) });
  }
}

