/**
 * SETTINGS.js - Professional Settings Management
 * Inspired by Firefly III's configuration system
 * 
 * Features:
 * - Load/Save user preferences
 * - Form validation
 * - Error handling
 * - Success/failure responses
 */

/**
 * Get current user email safely (web app friendly)
 */
function getCurrentUserEmail_() {
  var email = '';
  try {
    email = Session.getActiveUser().getEmail() || '';
  } catch (e1) {}
  if (!email) {
    try {
      email = Session.getEffectiveUser().getEmail() || '';
    } catch (e2) {}
  }
  if (!email) {
    try {
      email = PropertiesService.getUserProperties().getProperty('USER_EMAIL') || '';
    } catch (e3) {}
  }
  if (!email) {
    try {
      email = PropertiesService.getScriptProperties().getProperty('USER_EMAIL') || '';
    } catch (e4) {}
  }
  return email;
}

/**
 * Get current settings
 */
function getSettings() {
  try {
    const ss = _ss();
    let config = ss.getSheetByName('Config');
    
    const defaultSettings = {
      user_name: '',
      user_email: getCurrentUserEmail_(),
      default_currency: 'USD',
      language: 'ar',
      salary_day: 1,
      enable_notifications: true,
      telegram_notifications: true,
      budget_alerts: true,
      auto_apply_rules: true
    };
    
    // Auto-create Config sheet if missing
    if (!config) {
      config = ss.insertSheet('Config');
      var currentEmail = getCurrentUserEmail_();
      config.getRange(1, 1, 1, 11).setValues([[
        'Status', 'Name', 'Email', 'Currency', 'Language', 'Salary_Day', 
        'Notifications', 'Auto_Apply_Rules', 'Telegram_Notifications', 'Budget_Alerts', 'Save_Temp_Codes'
      ]]);
      config.getRange(2, 1, 1, 11).setValues([[
        'ACTIVE', '', currentEmail, 'SAR', 'ar', 27, 
        true, true, true, true, false
      ]]);
      Logger.log('✅ Auto-created Config sheet with defaults, email: ' + currentEmail);
    }
    
    // Ensure email is populated if empty (fix for existing blank emails)
    var storedEmail = config.getRange('C2').getValue();
    if (!storedEmail) {
      var currentEmail = getCurrentUserEmail_();
      if (currentEmail) {
        config.getRange('C2').setValue(currentEmail);
        Logger.log('✅ Auto-filled missing email: ' + currentEmail);
      }
    }
    
    // Read settings from Config sheet
    const settings = {
      user_name: config.getRange('B2').getValue() || '',
      user_email: config.getRange('C2').getValue() || getCurrentUserEmail_(),
      default_currency: config.getRange('D2').getValue() || 'USD',
      language: config.getRange('E2').getValue() || 'ar',
      salary_day: config.getRange('F2').getValue() || 1,
      enable_notifications: config.getRange('G2').getValue() !== 'false',
      auto_apply_rules: config.getRange('H2').getValue() !== 'false',
      telegram_notifications: config.getRange('I2').getValue() !== 'false',
      budget_alerts: config.getRange('J2').getValue() !== 'false',
      save_temp_codes: config.getRange('K2').getValue() === true || config.getRange('K2').getValue() === 'true'
    };
    
    return {
      success: true,
      settings: settings
    };
    
  } catch (error) {
    Logger.log('Error loading settings: ' + error);
    return {
      success: false,
      error: error.message,
      settings: {
        user_name: '',
        user_email: getCurrentUserEmail_(),
        default_currency: 'USD',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        telegram_notifications: true,
        budget_alerts: true,
        auto_apply_rules: true,
        save_temp_codes: false
      }
    };
  }
}

/**
 * Save settings (Professional pattern from Firefly III)
 */
function saveSettings(settingsData) {
  try {
    // Validation
    if (!settingsData) {
      return {
        success: false,
        error: 'لا توجد بيانات للحفظ'
      };
    }
    
    const ss = _ss();
    let config = ss.getSheetByName('Config');
    
    // Create Config sheet if doesn't exist
    if (!config) {
      config = ss.insertSheet('Config');
      config.getRange('A1:K1').setValues([
        ['Status', 'Name', 'Email', 'Currency', 'Language', 'Salary Day', 'Notifications', 'Auto Rules', 'Telegram Notify', 'Budget Alerts', 'Save_Temp_Codes']
      ]);
      config.getRange('A1:K1').setFontWeight('bold');
      config.setFrozenRows(1);
    }
    
    // Save settings with proper validation
    const row = 2; // Data starts at row 2
    
    // Save user name
    if (settingsData.user_name) {
      config.getRange('B' + row).setValue(settingsData.user_name);
    }
    
    // Save email
    const userEmail = settingsData.user_email || getCurrentUserEmail_();
    config.getRange('C' + row).setValue(userEmail);
    
    // Save currency
    if (settingsData.default_currency) {
      config.getRange('D' + row).setValue(settingsData.default_currency);
    }
    
    // Save language
    if (settingsData.language) {
      config.getRange('E' + row).setValue(settingsData.language);
    }
    
    // Save salary day
    const salaryDay = parseInt(settingsData.salary_day);
    if (salaryDay >= 1 && salaryDay <= 31) {
      config.getRange('F' + row).setValue(salaryDay);
    }
    
    // Save boolean settings
    config.getRange('G' + row).setValue(settingsData.enable_notifications ? 'true' : 'false');
    config.getRange('H' + row).setValue(settingsData.auto_apply_rules ? 'true' : 'false');
    config.getRange('I' + row).setValue(settingsData.telegram_notifications !== false ? 'true' : 'false');
    config.getRange('J' + row).setValue(settingsData.budget_alerts !== false ? 'true' : 'false');
    config.getRange('K' + row).setValue(settingsData.save_temp_codes ? 'true' : 'false');
    
    // Sync critical settings to ScriptProperties for fast access
    const props = PropertiesService.getScriptProperties();
    props.setProperty('DEFAULT_CURRENCY', settingsData.default_currency || 'USD');
    props.setProperty('LANGUAGE', settingsData.language || 'ar');
    props.setProperty('SAVE_TEMP_CODES', settingsData.save_temp_codes ? 'true' : 'false');
    if (userEmail) {
      props.setProperty('USER_EMAIL', userEmail);
      try { PropertiesService.getUserProperties().setProperty('USER_EMAIL', userEmail); } catch (e) {}
    }
    
    // Mark onboarding as complete
    config.getRange('A' + row).setValue('SETTINGS_SAVED');
    
    // Log the action (Professional pattern)
    Logger.log('Settings saved successfully by: ' + (getCurrentUserEmail_() || 'unknown'));
    Logger.log('Settings: ' + JSON.stringify(settingsData));
    
    return {
      success: true,
      message: 'تم حفظ الإعدادات بنجاح! 🎉'
    };
    
  } catch (error) {
    Logger.log('Error saving settings: ' + error);
    return {
      success: false,
      error: 'فشل حفظ الإعدادات: ' + error.message
    };
  }
}

/**
 * Setup Telegram webhook (placeholder)
 */
function setupTelegramWebhook(botToken) {
  try {
    if (!botToken) {
      return {
        success: false,
        error: 'Bot Token is required'
      };
    }
    
    // Get webapp URL
    const webappUrl = ScriptApp.getService().getUrl();
    
    // Set webhook
    const webhookUrl = 'https://api.telegram.org/bot' + botToken + '/setWebhook';
    const payload = {
      url: webappUrl,
      allowed_updates: ['message', 'edited_message']
    };
    
    var options = {
      'method': 'POST',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(webhookUrl, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      return {
        success: true,
        message: 'Webhook configured successfully!'
      };
    } else {
      return {
        success: false,
        error: result.description || 'Failed to set webhook'
      };
    }
    
  } catch (error) {
    Logger.log('Webhook setup error: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reset all data (dangerous operation)
 */
function resetAllData() {
  try {
    const ss = _ss();
    
    // Confirmation required
    const sheets = ['Config', 'Transactions', 'Accounts', 'Budgets'];
    
    sheets.forEach(function(sheetName) {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        sheet.clear();
      }
    });
    
    return {
      success: true,
      message: 'All data reset successfully'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
