function DEBUG_SCOPES() {
  console.log("Attempting to open spreadsheet...");
  try {
     var ss = SpreadsheetApp.openById('1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A');
     console.log("Success! Opened sheet: " + ss.getName());
     return "Success: " + ss.getName();
  } catch (e) {
     console.log("Failed to open sheet: " + e.message);
     return "Failed: " + e.message;
  }
}

/**
 * ⚠️ RUN THIS MANUALLY IN EDITOR TO FORCE AUTH PROMPT
 */
function FORCE_AUTH_REQUEST() {
  SpreadsheetApp.openById('1-_yM5c7bt2ALoSnpDfO1yBhqqof8tyAZv5JlsYxUZ0A');
  ScriptApp.getProjectTriggers();
  GmailApp.getInboxThreads(0,1); // Force email scope
  UrlFetchApp.fetch('https://google.com'); // Force external request
}