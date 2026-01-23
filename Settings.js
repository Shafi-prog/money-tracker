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
 * Get current settings
 */
function getSettings() {
  try {
    const ss = SpreadsheetApp.getActive();
    let config = ss.getSheetByName('Config');
    
    const defaultSettings = {
      user_name: '',
      user_email: Session.getActiveUser().getEmail(),
      default_currency: 'USD',
      language: 'ar',
      salary_day: 1,
      enable_notifications: true,
      auto_apply_rules: true
    };
    
    if (!config) {
      return {
        success: true,
        settings: defaultSettings
      };
    }
    
    // Read settings from Config sheet
    const settings = {
      user_name: config.getRange('B2').getValue() || '',
      user_email: config.getRange('C2').getValue() || Session.getActiveUser().getEmail(),
      default_currency: config.getRange('D2').getValue() || 'USD',
      language: config.getRange('E2').getValue() || 'ar',
      salary_day: config.getRange('F2').getValue() || 1,
      enable_notifications: config.getRange('G2').getValue() !== 'false',
      auto_apply_rules: config.getRange('H2').getValue() !== 'false'
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
        user_email: Session.getActiveUser().getEmail(),
        default_currency: 'USD',
        language: 'ar',
        salary_day: 1,
        enable_notifications: true,
        auto_apply_rules: true
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
    
    const ss = SpreadsheetApp.getActive();
    let config = ss.getSheetByName('Config');
    
    // Create Config sheet if doesn't exist
    if (!config) {
      config = ss.insertSheet('Config');
      config.getRange('A1:H1').setValues([
        ['Status', 'Name', 'Email', 'Currency', 'Language', 'Salary Day', 'Notifications', 'Auto Rules']
      ]);
      config.getRange('A1:H1').setFontWeight('bold');
      config.setFrozenRows(1);
    }
    
    // Save settings with proper validation
    const row = 2; // Data starts at row 2
    
    // Save user name
    if (settingsData.user_name) {
      config.getRange('B' + row).setValue(settingsData.user_name);
    }
    
    // Save email
    const userEmail = settingsData.user_email || Session.getActiveUser().getEmail();
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
    
    // Mark onboarding as complete
    config.getRange('A' + row).setValue('SETTINGS_SAVED');
    
    // Log the action (Professional pattern)
    Logger.log('Settings saved successfully by: ' + Session.getActiveUser().getEmail());
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
    const ss = SpreadsheetApp.getActive();
    
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
