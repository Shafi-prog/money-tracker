/**
 * 🚀 COMPLETE SYSTEM SETUP - Run this in Google Apps Script Editor
 * This function will properly configure your Money Tracker system
 */

function COMPLETE_SYSTEM_SETUP() {
  var result = {
    success: false,
    steps: [],
    errors: [],
    warnings: []
  };

  try {
    Logger.log('🚀 Starting Complete System Setup...');

    // ===== STEP 1: Configure SHEET_ID =====
    result.steps.push('Step 1: Configuring SHEET_ID...');
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetId = ss.getId();
    PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId);
    Logger.log('✅ SHEET_ID configured: ' + sheetId);

    // ===== STEP 2: Ensure All Sheets Exist =====
    result.steps.push('Step 2: Creating required sheets...');
    if (typeof ENSURE_ALL_SHEETS === 'function') {
      var sheetsResult = ENSURE_ALL_SHEETS();
      result.steps.push('✅ Sheets created: ' + sheetsResult.created.join(', '));
      result.steps.push('✅ Sheets existed: ' + sheetsResult.existed.join(', '));
    } else {
      result.errors.push('ENSURE_ALL_SHEETS function not found');
    }

    // ===== STEP 3: Clean Categories =====
    result.steps.push('Step 3: Cleaning test categories...');
    if (typeof CLEAN_CATEGORIES_SHEET === 'function') {
      var cleanResult = CLEAN_CATEGORIES_SHEET();
      if (cleanResult.success) {
        result.steps.push('✅ Cleaned ' + cleanResult.count + ' test categories');
      }
    }

    // ===== STEP 4: Initialize Category Manager =====
    result.steps.push('Step 4: Initializing category system...');
    if (typeof ensureCategoriesSheet_ === 'function') {
      ensureCategoriesSheet_();
      result.steps.push('✅ Categories sheet initialized');
    }

    // ===== STEP 5: Setup Default Categories =====
    result.steps.push('Step 5: Setting up default categories...');
    if (typeof setupDefaultCategories_ === 'function') {
      setupDefaultCategories_();
      result.steps.push('✅ Default categories created');
    }

    // ===== STEP 6: Clean System Sheets =====
    result.steps.push('Step 6: Cleaning unnecessary sheets...');
    if (typeof CLEAN_SYSTEM_SHEETS === 'function') {
      var cleanSheets = CLEAN_SYSTEM_SHEETS();
      if (cleanSheets.success && cleanSheets.deleted.length > 0) {
        result.steps.push('✅ Cleaned sheets: ' + cleanSheets.deleted.join(', '));
      } else {
        result.steps.push('✅ No unnecessary sheets found');
      }
    }

    // ===== STEP 7: Setup Bot Commands =====
    result.steps.push('Step 7: Setting up Telegram bot commands...');
    if (typeof SETUP_BOT_COMMANDS === 'function') {
      try {
        SETUP_BOT_COMMANDS();
        result.steps.push('✅ Bot commands configured');
      } catch (e) {
        result.warnings.push('Bot commands setup failed (may need token): ' + e.message);
      }
    }

    // ===== STEP 8: Run Automated Checklist =====
    result.steps.push('Step 8: Running system verification...');
    if (typeof RUN_AUTOMATED_CHECKLIST === 'function') {
      var checklist = RUN_AUTOMATED_CHECKLIST();
      var passed = checklist.results.filter(function(r) { return r.success; }).length;
      var total = checklist.results.length;
      result.steps.push('✅ Checklist: ' + passed + '/' + total + ' tests passed');

      // Log failed tests
      checklist.results.forEach(function(test) {
        if (!test.success) {
          result.warnings.push(test.name + ': ' + test.message);
        }
      });
    }

    // ===== STEP 9: Final Configuration Check =====
    result.steps.push('Step 9: Final configuration check...');
    var config = SOV1_UI_checkConfig_();
    result.steps.push('✅ Sheet configured: ' + (config.hasSheet ? 'Yes' : 'No'));
    result.steps.push('✅ Telegram configured: ' + (config.hasTelegram ? 'Yes' : 'No'));
    result.steps.push('✅ AI configured: ' + (config.hasAI ? 'Yes' : 'No'));
    result.steps.push('✅ Webhook configured: ' + (config.hasWebhook ? 'Yes' : 'No'));

    result.success = true;
    result.message = '🎉 System setup completed successfully!';

    Logger.log('✅ Complete System Setup finished successfully');
    Logger.log('Next steps: Configure Telegram bot token, AI keys, and test the system');

  } catch (e) {
    result.success = false;
    result.errors.push('Setup failed: ' + e.message);
    Logger.log('❌ Complete System Setup failed: ' + e.message);
  }

  // Display results
  var ui = SpreadsheetApp.getUi();
  var message = result.success ? result.message : 'Setup failed with errors';

  if (result.errors.length > 0) {
    message += '\n\n❌ Errors:\n' + result.errors.join('\n');
  }

  if (result.warnings.length > 0) {
    message += '\n\n⚠️ Warnings:\n' + result.warnings.join('\n');
  }

  message += '\n\n📋 Steps completed:\n' + result.steps.join('\n');

  ui.alert('Money Tracker Setup Results', message, ui.ButtonSet.OK);

  return result;
}

/**
 * 🧪 Test the setup by running a simple transaction
 */
function TEST_SETUP_WITH_SAMPLE_TRANSACTION() {
  try {
    Logger.log('🧪 Testing setup with sample transaction...');

    // Test transaction
    var testSMS = "تم خصم 50 ريال من حسابك";
    var result = processTransaction(testSMS, 'test', '');

    Logger.log('✅ Test transaction result: ' + JSON.stringify(result));

    var ui = SpreadsheetApp.getUi();
    ui.alert('Test Results',
      'Sample transaction processed successfully!\n\n' +
      'Check Sheet1 for the new transaction.\n\n' +
      'Result: ' + JSON.stringify(result, null, 2),
      ui.ButtonSet.OK
    );

    return { success: true, result: result };

  } catch (e) {
    Logger.log('❌ Test failed: ' + e.message);

    var ui = SpreadsheetApp.getUi();
    ui.alert('Test Failed', 'Error: ' + e.message, ui.ButtonSet.OK);

    return { success: false, error: e.message };
  }
}

/**
 * 📋 Get setup status and next steps
 */
function GET_SETUP_STATUS() {
  var status = {
    sheetId: PropertiesService.getScriptProperties().getProperty('SHEET_ID'),
    config: SOV1_UI_checkConfig_(),
    sheets: [],
    recommendations: []
  };

  // Check sheets
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  sheets.forEach(function(sheet) {
    status.sheets.push({
      name: sheet.getName(),
      rows: sheet.getLastRow(),
      cols: sheet.getLastColumn()
    });
  });

  // Generate recommendations
  if (!status.config.hasSheet) {
    status.recommendations.push('❌ SHEET_ID not configured - Run COMPLETE_SYSTEM_SETUP()');
  } else {
    status.recommendations.push('✅ SHEET_ID configured');
  }

  if (!status.config.hasTelegram) {
    status.recommendations.push('⚠️ Telegram not configured - Add bot token and chat ID');
  } else {
    status.recommendations.push('✅ Telegram configured');
  }

  if (!status.config.hasAI) {
    status.recommendations.push('⚠️ AI not configured - Add Groq or Gemini API key');
  } else {
    status.recommendations.push('✅ AI configured');
  }

  // Display status
  var ui = SpreadsheetApp.getUi();
  var message = '📊 System Status:\n\n';

  message += 'Sheets: ' + status.sheets.length + ' found\n';
  status.sheets.forEach(function(sheet) {
    message += '  - ' + sheet.name + ' (' + sheet.rows + 'x' + sheet.cols + ')\n';
  });

  message += '\nRecommendations:\n' + status.recommendations.join('\n');

  ui.alert('Setup Status', message, ui.ButtonSet.OK);

  return status;
}