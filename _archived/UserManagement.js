/********** Sovereign V1.0 | UserManagement.gs **********/

/**
 * ملف إدارة المستخدمين المتعددين
 * يدعم:
 * - تسجيل مستخدمين جدد
 * - ربط حسابات وبطاقات بمستخدمين
 * - فلترة البيانات حسب المستخدم
 * - رصد مالي منفصل لكل مستخدم
 */

/**
 * تسجيل مستخدم جديد
 */
function registerUser(userId, userName, telegramId, accounts, cards) {
  try {
    var sUsers = _sheet('Users');
    
    // إنشاء الورقة إذا لم تكن موجودة
    if (sUsers.getLastRow() === 0) {
      sUsers.appendRow(['User ID', 'اسم المستخدم', 'Telegram ID', 'الحسابات', 'البطاقات', 'تاريخ التسجيل', 'حالة']);
      sUsers.setFrozenRows(1);
      sUsers.setRightToLeft(true);
    }

    // التحقق من عدم وجود المستخدم
    var vals = sUsers.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0] === userId) {
        return { success: false, message: 'المستخدم موجود بالفعل' };
      }
    }

    // إضافة المستخدم
    var accountsList = Array.isArray(accounts) ? accounts.join(',') : accounts;
    var cardsList = Array.isArray(cards) ? cards.join(',') : cards;

    sUsers.appendRow([
      userId,
      userName,
      telegramId || '',
      accountsList || '',
      cardsList || '',
      new Date(),
      'نشط'
    ]);

    // إنشاء أوراق خاصة بالمستخدم
    createUserSheets_(userId);

    return { success: true, message: 'تم تسجيل المستخدم بنجاح' };
  } catch (e) {
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

/**
 * إنشاء أوراق خاصة بمستخدم
 */
function createUserSheets_(userId) {
  var ss = _ss();
  
  // ورقة معاملات المستخدم
  var sUser = ss.getSheetByName('User_' + userId);
  if (!sUser) {
    sUser = ss.insertSheet('User_' + userId);
    sUser.appendRow(['التاريخ','المصدر','الفترة١','الفترة٢','القناة/المصدر','رقم الحساب','رقم البطاقة/الطرف','المبلغ','الجهة/التاجر','التصنيف','النوع','النص الخام']);
    sUser.setFrozenRows(1);
    sUser.setRightToLeft(true);
  }

  // ورقة ميزانية المستخدم
  var sBudget = ss.getSheetByName('Budget_' + userId);
  if (!sBudget) {
    sBudget = ss.insertSheet('Budget_' + userId);
    sBudget.appendRow(['التصنيف','الموازنة','المصروف','المتبقي']);
    sBudget.setFrozenRows(1);
    sBudget.setRightToLeft(true);
  }
}

/**
 * الحصول على معلومات مستخدم
 */
function getUserInfo(userId) {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0] === userId) {
        return {
          userId: vals[i][0],
          userName: vals[i][1],
          telegramId: vals[i][2],
          accounts: String(vals[i][3] || '').split(',').filter(Boolean),
          cards: String(vals[i][4] || '').split(',').filter(Boolean),
          registrationDate: vals[i][5],
          status: vals[i][6]
        };
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * التحقق من ملكية حساب أو بطاقة لمستخدم
 */
function isUserAccount(userId, accountOrCard) {
  var userInfo = getUserInfo(userId);
  if (!userInfo) return false;

  var all = userInfo.accounts.concat(userInfo.cards);
  return all.indexOf(accountOrCard) !== -1;
}

/**
 * الحصول على userId من رقم الحساب أو البطاقة
 */
function getUserIdByAccount(accountOrCard) {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      var accounts = String(vals[i][3] || '').split(',');
      var cards = String(vals[i][4] || '').split(',');
      var all = accounts.concat(cards);

      if (all.indexOf(accountOrCard) !== -1) {
        return vals[i][0]; // userId
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * الحصول على userId من Telegram ID
 */
function getUserIdByTelegramId(telegramId) {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      if (vals[i][2] === telegramId) {
        return vals[i][0]; // userId
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * الحصول على جميع المستخدمين
 */
function getAllUsers() {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();
    var users = [];

    for (var i = 1; i < vals.length; i++) {
      users.push({
        userId: vals[i][0],
        userName: vals[i][1],
        telegramId: vals[i][2],
        accounts: String(vals[i][3] || '').split(',').filter(Boolean),
        cards: String(vals[i][4] || '').split(',').filter(Boolean),
        registrationDate: vals[i][5],
        status: vals[i][6]
      });
    }

    return users;
  } catch (e) {
    return [];
  }
}

/**
 * تحديث حسابات/بطاقات مستخدم
 */
function updateUserAccounts(userId, accounts, cards) {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0] === userId) {
        var accountsList = Array.isArray(accounts) ? accounts.join(',') : accounts;
        var cardsList = Array.isArray(cards) ? cards.join(',') : cards;

        sUsers.getRange(i + 1, 4).setValue(accountsList);
        sUsers.getRange(i + 1, 5).setValue(cardsList);

        return { success: true, message: 'تم تحديث الحسابات' };
      }
    }

    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

/**
 * حذف مستخدم (تعطيل فقط)
 */
function deactivateUser(userId) {
  try {
    var sUsers = _sheet('Users');
    var vals = sUsers.getDataRange().getValues();

    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0] === userId) {
        sUsers.getRange(i + 1, 7).setValue('معطل');
        return { success: true, message: 'تم تعطيل المستخدم' };
      }
    }

    return { success: false, message: 'المستخدم غير موجود' };
  } catch (e) {
    return { success: false, message: 'خطأ: ' + e.toString() };
  }
}

/**
 * احصل على الرصد المالي لمستخدم
 */
function getUserFinancialSummary(userId) {
  try {
    var sUser = _sheet('User_' + userId);
    if (!sUser || sUser.getLastRow() < 2) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0
      };
    }

    var vals = sUser.getDataRange().getValues();
    var totalIncome = 0;
    var totalExpense = 0;

    for (var i = 1; i < vals.length; i++) {
      var amount = Number(vals[i][7]) || 0;
      var type = String(vals[i][10] || '');
      var raw = String(vals[i][11] || '');
      
      var isIncoming = /(وارد|إيداع|استلام)/i.test(type) || /(وارد|إيداع|استلام)/i.test(raw);

      if (isIncoming) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }
    }

    return {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: vals.length - 1
    };
  } catch (e) {
    return {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
      error: e.toString()
    };
  }
}
