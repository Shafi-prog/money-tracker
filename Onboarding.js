/**
 * ONBOARDING_WIZARD.js
 * First-time user setup wizard - like Firefly III's new-user experience
 * 
 * Features inspired by professional finance apps (22k+ GitHub stars):
 * - Welcome flow for new users
 * - Personalized setup (name, currency, language)
 * - Initial account creation
 * - Budget setup guidance
 * - Sample data option
 */

/**
 * Check if user needs onboarding
 */
function needsOnboarding() {
  const ss = _ss();
  const config = ss.getSheetByName('Config');
  
  if (!config) return true;
  
  // Check if onboarding completed
  const onboardingComplete = config.getRange('A1').getValue();
  return onboardingComplete !== 'ONBOARDING_COMPLETE';
}

/**
 * Get onboarding status and user profile
 */
function getOnboardingStatus() {
  try {
    const ss = _ss();
    const config = ss.getSheetByName('Config');
    
    if (!config) {
      return {
        needs_onboarding: true,
        step: 'welcome',
        user: {
          name: '',
          email: Session.getActiveUser().getEmail(),
          language: 'en',
          currency: 'USD',
          timezone: Session.getScriptTimeZone()
        },
        has_accounts: false,
        has_transactions: false,
        has_budgets: false
      };
    }
    
    const onboardingComplete = config.getRange('A1').getValue() === 'ONBOARDING_COMPLETE';
    const userName = config.getRange('B1').getValue() || '';
    const userCurrency = config.getRange('C1').getValue() || 'USD';
    const userLanguage = config.getRange('D1').getValue() || 'en';
    
    // Check if user has data
    const accountsSheet = ss.getSheetByName('Accounts');
    const transactionsSheet = ss.getSheetByName('Transactions');
    const budgetsSheet = ss.getSheetByName('Budgets');
    
    const hasAccounts = accountsSheet && accountsSheet.getLastRow() > 1;
    const hasTransactions = transactionsSheet && transactionsSheet.getLastRow() > 1;
    const hasBudgets = budgetsSheet && budgetsSheet.getLastRow() > 1;
    
    return {
      needs_onboarding: !onboardingComplete,
      step: onboardingComplete ? 'complete' : 'welcome',
      user: {
        name: userName,
        email: Session.getActiveUser().getEmail(),
        language: userLanguage,
        currency: userCurrency,
        timezone: Session.getScriptTimeZone()
      },
      has_accounts: hasAccounts,
      has_transactions: hasTransactions,
      has_budgets: hasBudgets,
      onboarding_url: ScriptApp.getService().getUrl() + '?page=onboarding'
    };
  } catch (error) {
    Logger.log('Error getting onboarding status: ' + error);
    return {
      needs_onboarding: true,
      step: 'welcome',
      error: error.message
    };
  }
}

/**
 * Save user profile from onboarding
 */
function saveUserProfile(profileData) {
  try {
    const ss = _ss();
    let config = ss.getSheetByName('Config');
    
    if (!config) {
      config = ss.insertSheet('Config');
      config.getRange('A1:D1').setValues([['Status', 'Name', 'Currency', 'Language']]);
      config.getRange('A1:D1').setFontWeight('bold');
    }
    
    // Save user profile
    config.getRange('B1').setValue(profileData.name || '');
    config.getRange('C1').setValue(profileData.currency || 'USD');
    config.getRange('D1').setValue(profileData.language || 'en');
    
    return {
      success: true,
      message: 'User profile saved successfully'
    };
  } catch (error) {
    Logger.log('Error saving user profile: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create initial accounts for new user
 */
function createInitialAccounts(accountsData) {
  try {
    const ss = _ss();
    let accountsSheet = ss.getSheetByName('Accounts');
    
    if (!accountsSheet) {
      accountsSheet = ss.insertSheet('Accounts');
      accountsSheet.getRange('A1:F1').setValues([
        ['Account ID', 'Account Name', 'Type', 'Currency', 'Opening Balance', 'Created Date']
      ]);
      accountsSheet.getRange('A1:F1').setFontWeight('bold');
    }
    
    const timestamp = new Date();
    let newAccounts = [];
    
    // Add each account
    accountsData.accounts.forEach(function(account) {
      const accountId = 'ACC_' + Utilities.getUuid();
      newAccounts.push([
        accountId,
        account.name,
        account.type || 'Asset',
        account.currency || 'USD',
        parseFloat(account.balance || 0),
        timestamp
      ]);
    });
    
    if (newAccounts.length > 0) {
      const lastRow = accountsSheet.getLastRow();
      accountsSheet.getRange(lastRow + 1, 1, newAccounts.length, 6).setValues(newAccounts);
    }
    
    return {
      success: true,
      message: newAccounts.length + ' account(s) created',
      accounts: newAccounts.length
    };
  } catch (error) {
    Logger.log('Error creating initial accounts: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create initial budgets for new user
 */
function createInitialBudgets(budgetsData) {
  try {
    const ss = _ss();
    let budgetsSheet = ss.getSheetByName('Budgets');
    
    if (!budgetsSheet) {
      budgetsSheet = ss.insertSheet('Budgets');
      budgetsSheet.getRange('A1:E1').setValues([
        ['Budget ID', 'Category', 'Amount', 'Period', 'Created Date']
      ]);
      budgetsSheet.getRange('A1:E1').setFontWeight('bold');
    }
    
    const timestamp = new Date();
    let newBudgets = [];
    
    // Add each budget
    budgetsData.budgets.forEach(function(budget) {
      const budgetId = 'BDG_' + Utilities.getUuid();
      newBudgets.push([
        budgetId,
        budget.category,
        parseFloat(budget.amount || 0),
        budget.period || 'monthly',
        timestamp
      ]);
    });
    
    if (newBudgets.length > 0) {
      const lastRow = budgetsSheet.getLastRow();
      budgetsSheet.getRange(lastRow + 1, 1, newBudgets.length, 5).setValues(newBudgets);
    }
    
    return {
      success: true,
      message: newBudgets.length + ' budget(s) created',
      budgets: newBudgets.length
    };
  } catch (error) {
    Logger.log('Error creating initial budgets: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load demo/sample data for new users
 */
function loadSampleData() {
  try {
    const ss = _ss();
    
    // Create sample accounts
    const sampleAccounts = {
      accounts: [
        {name: 'Main Checking', type: 'Asset', currency: 'USD', balance: 5000},
        {name: 'Savings Account', type: 'Asset', currency: 'USD', balance: 10000},
        {name: 'Credit Card', type: 'Liability', currency: 'USD', balance: -1200}
      ]
    };
    
    // Create sample budgets
    const sampleBudgets = {
      budgets: [
        {category: 'Groceries', amount: 500, period: 'monthly'},
        {category: 'Transportation', amount: 200, period: 'monthly'},
        {category: 'Entertainment', amount: 150, period: 'monthly'},
        {category: 'Utilities', amount: 300, period: 'monthly'}
      ]
    };
    
    // Create sample transactions
    let transactionsSheet = ss.getSheetByName('Transactions');
    if (!transactionsSheet) {
      transactionsSheet = ss.insertSheet('Transactions');
      transactionsSheet.getRange('A1:H1').setValues([
        ['Transaction ID', 'Date', 'Description', 'Category', 'Amount', 'Type', 'Account', 'Created']
      ]);
      transactionsSheet.getRange('A1:H1').setFontWeight('bold');
    }
    
    const today = new Date();
    const sampleTransactions = [
      ['TXN_' + Utilities.getUuid(), new Date(today.getFullYear(), today.getMonth(), 1), 'Salary Deposit', 'Income', 4500, 'income', 'Main Checking', today],
      ['TXN_' + Utilities.getUuid(), new Date(today.getFullYear(), today.getMonth(), 5), 'Grocery Shopping', 'Groceries', -120, 'expense', 'Main Checking', today],
      ['TXN_' + Utilities.getUuid(), new Date(today.getFullYear(), today.getMonth(), 8), 'Gas Station', 'Transportation', -45, 'expense', 'Credit Card', today],
      ['TXN_' + Utilities.getUuid(), new Date(today.getFullYear(), today.getMonth(), 12), 'Electric Bill', 'Utilities', -85, 'expense', 'Main Checking', today],
      ['TXN_' + Utilities.getUuid(), new Date(today.getFullYear(), today.getMonth(), 15), 'Restaurant', 'Entertainment', -65, 'expense', 'Credit Card', today]
    ];
    
    // Save all sample data
    createInitialAccounts(sampleAccounts);
    createInitialBudgets(sampleBudgets);
    
    const lastRow = transactionsSheet.getLastRow();
    transactionsSheet.getRange(lastRow + 1, 1, sampleTransactions.length, 8).setValues(sampleTransactions);
    
    return {
      success: true,
      message: 'Sample data loaded successfully',
      stats: {
        accounts: sampleAccounts.accounts.length,
        budgets: sampleBudgets.budgets.length,
        transactions: sampleTransactions.length
      }
    };
  } catch (error) {
    Logger.log('Error loading sample data: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Complete onboarding
 */
function completeOnboarding() {
  try {
    const ss = _ss();
    let config = ss.getSheetByName('Config');
    
    if (!config) {
      config = ss.insertSheet('Config');
      config.getRange('A1:D1').setValues([['Status', 'Name', 'Currency', 'Language']]);
    }
    
    config.getRange('A1').setValue('ONBOARDING_COMPLETE');
    
    return {
      success: true,
      message: 'Onboarding completed! Welcome to MoneyTracker!',
      redirect: '/?page=index'
    };
  } catch (error) {
    Logger.log('Error completing onboarding: ' + error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Reset onboarding (for testing)
 */
function resetOnboarding() {
  try {
    const ss = _ss();
    const config = ss.getSheetByName('Config');
    
    if (config) {
      config.getRange('A1').setValue('');
    }
    
    return {
      success: true,
      message: 'Onboarding reset successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
