
function FIX_AND_CALIBRATE_BALANCES() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sTransactions = ss.getSheetByName('Sheet1');
  var sAccounts = ss.getSheetByName('Accounts');
  
  if (!sTransactions || !sAccounts) return "Missing sheets";
  
  // 1. FIX DATA: Map **0305 to '0305' (Tiqmo)
  var tData = sTransactions.getDataRange().getValues();
  // Columns: Row=Index+1. Acc=Col 6 (Index 6?), Card=Col 7 (Index 7).
  // Let's verify headers. Assuming standard schema.
  // Col G (Index 6) is Account.
  
  var fixedCount = 0;
  for (var i = 1; i < tData.length; i++) {
    var raw = String(tData[i][12] || ''); // Raw SMS usually col 12 (Index 12)
    var currentAcc = String(tData[i][6] || '');
    var currentCard = String(tData[i][7] || '');
    
    if (raw.indexOf('**0305') !== -1 || raw.indexOf('Card No. (last 4 digit): 0305') !== -1) {
      if (currentAcc !== '0305') {
         sTransactions.getRange(i+1, 7).setValue('0305'); // Set Account Column (G)
         fixedCount++;
      }
    }
    
    // Fix Nasser Transfer (Row 6)
    // "حوالة محلية صادرة... من:9767" -> Account should be 9767
    if (raw.indexOf('من:9767') !== -1 && currentAcc !== '9767') {
         sTransactions.getRange(i+1, 7).setValue('9767');
         fixedCount++;
    }
  }
  
  SpreadsheetApp.flush(); // Commit data fixes
  
  // 2. CALIBRATE OPENING BALANCES
  // Targets at 13:28 (Row 7 - Azoom)
  var targets = {
    '0305': 780,     // Tiqmo
    '9682': 780,     // Tiqmo Alt
    'Tiqmo': 780,
    '8001': 2590,    // SAIB
    'SAIB': 2590,
    '1929': 50,      // STC
    'STC Bank': 50,
    '3449': 9,       // D360
    'D360': 9,
    '9765': 2136,    // Rajhi 1
    'AlrajhiBank-9765': 2136,
    '9767': 0,       // Rajhi 2 (Nasser)
    'AlrajhiBank-9767': 0,
    '1626': 0,       // Rajhi 3 (Awad)
    'AlrajhiBank-1626': 0
  };
  
  // Calculate Flow up to Row 7 (Inclusive)
  var flow = {};
  // Refetch data after fixes
  tData = sTransactions.getDataRange().getValues();
  
  for (var i = 1; i < tData.length; i++) {
    // Stop after Row 7
    // Using timestamp 13:28 as cutoff or exact row index if reliable
    // User said "Azoom" (Row 7 in debug) was the set point
    if (i >= 8) break; // Process rows 1..7 (Indices 1..7)
    
    var acc = String(tData[i][6]).trim(); // Account
    var type = String(tData[i][10]).trim(); // Category (Col K) -> logic check?
    // Actually use the Rebuild logic: Income vs Expense
    // Col 8 is Amount (I).
    var amt = Number(tData[i][8]);
    var cat = String(tData[i][10]); // Category
    var isInc = (cat === 'income' || cat === 'دخل' || cat === 'إيداع');
    
    if (acc) {
      if (!flow[acc]) flow[acc] = 0;
      flow[acc] += isInc ? amt : -amt;
    }
  }
  
  // 3. Set Opening Balances
  var accData = sAccounts.getDataRange().getValues();
  var log = [];
  
  for (var j = 1; j < accData.length; j++) {
     var name = String(accData[j][0]);
     var num = String(accData[j][2]);
     var aliases = String(accData[j][8]);
     
     // Find Target
     var target = targets[num] !== undefined ? targets[num] : (targets[name] !== undefined ? targets[name] : null);
     
     if (target !== null) {
       // Look up flow (check num, name, aliases)
       var f = flow[num] || flow[name] || 0;
       
       // Tiqmo special: check flow for 0305
       if (name === 'Tiqmo') {
         f = (flow['Tiqmo'] || 0) + (flow['0305'] || 0) + (flow['9682'] || 0);
         
         // FORCE ADD ALIAS 0305
         var aliasCell = sAccounts.getRange(j+1, 9);
         var curAliases = String(aliasCell.getValue());
         if (curAliases.indexOf('0305') === -1) {
            aliasCell.setValue(curAliases ? curAliases + ',0305' : '0305');
         }
       }
       
       var opening = target - f;
       sAccounts.getRange(j+1, 11).setValue(opening); // Set Opening
       log.push(name + ': Target=' + target + ', Flow=' + f + ', SetOpening=' + opening);
     }
  }
  
  return { fixed: fixedCount, calibration: log };
}
