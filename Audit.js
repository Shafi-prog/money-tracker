
function AUDIT_SYSTEM_HEALTH() {
  var report = {
    transactions: { total: 0, uncategorized: 0, internal_transfers: 0, samples: [] },
    accounts: { total: 0, zero_balance: 0 },
    frontend_connection: "OK" 
  };
  
  try {
    // 1. Audit Transactions
    var s1 = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    if (s1 && s1.getLastRow() > 1) {
      var data = s1.getDataRange().getValues();
      report.transactions.total = data.length - 1;
      
      // Collect last 15 transactions for inspection
      var startIdx = Math.max(1, data.length - 15);
      for (var k = startIdx; k < data.length; k++) {
         report.transactions.samples.push({
           row: k+1,
           date: String(data[k][1]).substring(0, 15), 
           merchant: String(data[k][9]), 
           category: String(data[k][10]),
           amount: Number(data[k][8])
         });
      }

      for (var i = 1; i < data.length; i++) {
        var cat = String(data[i][10] || ''); // Category Column
        var type = String(data[i][11] || ''); // Type Column
        
        if (cat === 'أخرى' || cat === 'Other' || cat === '') report.transactions.uncategorized++;
        if (type.indexOf('تحويل') !== -1 || cat.indexOf('حوالة') !== -1) report.transactions.internal_transfers++;
      }
    }
    
    // 2. Audit Accounts
    var sAcc = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Accounts');
    if (sAcc && sAcc.getLastRow() > 1) {
       var accData = sAcc.getDataRange().getValues();
       report.accounts.total = accData.length - 1;
       for (var j = 1; j < accData.length; j++) {
         var bal = Number(accData[j][4] || 0);
         if (bal === 0) report.accounts.zero_balance++;
       }
    }
    
    // 3. Frontend Check (Implicit)
    // If this runs via WebApp, frontend connection is technically functional.
    
    return report;
    
  } catch (e) {
    return { error: e.message };
  }
}
