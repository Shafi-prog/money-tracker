# CLI & Testing Guide (Bypass Method)

Since `clasp run` often hits Google Cloud Project permission errors ("You do not have permission to call SpreadsheetApp.openById"), we have established a **stable** alternative using the Web App itself as an execution engine.

## 🚀 How to Run Tests (Stable Method)

This is the recommended way to checks tests before pushing changes.

### Option 1: VS Code Task (Easiest)
We have configured a pre-made task for this.

1. Press `Ctrl+Shift+P` in VS Code.
2. Type `Run Task` and press Enter.
3. Select **`GAS: Run Automated Tests (Reliable)`**.

### Option 2: Terminal / PowerShell
You can run the tests directly from any PowerShell terminal using the Web App URL:

```powershell
Invoke-RestMethod -Uri "https://script.google.com/macros/s/AKfycbxLxyhp4sbOajYCTlaKvrVr1FQQ8N1msvdj1AZzBdFt2JFBS9dle9LOgJkiIbWO9Cdr/exec?mode=cli&cmd=RUN_AUTOMATED_CHECKLIST" | ConvertTo-Json -Depth 10
```

## ⚙️ How It Works ("The Backdoor")

Instead of asking Google's API to run the function (which requires strict IAM permissions), we simply make an HTTP request to your deployed Web App.

1. **`WebUI.js`** has a special `doGet` handler that looks for `?mode=cli`.
2. It executes internal functions (like `RUN_AUTOMATED_CHECKLIST`) as the script owner (You).
3. It returns the results as a JSON object.

## ⚠️ Maintenance Note

If you redeploy the Web App as a **new deployment** (changing the Deployment ID), you must update the URL in `.vscode/tasks.json`.

1. Open `.vscode/tasks.json`.
2. Find the task `GAS: Run Automated Tests (Reliable)`.
3. Update the execution URL in the `args` section.

---

## 🔧 Quick CLI Commands (PowerShell examples)

Use these from **VS Code Terminal** (PowerShell) or any machine with PowerShell available. Replace <WEBAPP_URL> with your deployed web app URL (the same URL used in the VS Code task).

- List available CLI commands:

```powershell
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=LIST_CLI" | ConvertTo-Json -Depth 6
```

- Run setup checklist (automated verification):

```powershell
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=RUN_AUTOMATED_CHECKLIST" | ConvertTo-Json -Depth 6
```

- Run the manual setup helpers (runs the six setup functions we use for final setup):

```powershell
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=RUN_MANUAL_SETUP" | ConvertTo-Json -Depth 6
```

- Run the full end-to-end test (may take up to a minute):

```powershell
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=RUN_COMPLETE_SYSTEM_TEST" -TimeoutSec 3600 | ConvertTo-Json -Depth 6
```

- Debug Telegram status & webhook info:

```powershell
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=DEBUG_TELEGRAM_STATUS" | ConvertTo-Json -Depth 6
```

- Add a test transaction (simulate front-end save):

```powershell
$txt = [System.Web.HttpUtility]::UrlEncode('أضف: 10 | CLI Test | طعام')
Invoke-RestMethod -Uri "<WEBAPP_URL>?mode=cli&cmd=TEST_ADD_TX&text=$txt" | ConvertTo-Json -Depth 6
```

Notes & tips:
- If the result is `Unknown command`, ensure you deployed the web app after the latest changes and you're using the correct URL.
- Some functions still require the Apps Script owner to authorize scopes (first-time run in the Apps Script Editor). If you see permissions errors, open the Apps Script project and run any one of the setup functions manually and accept the auth prompts.
- For long-running tests use `-TimeoutSec 3600` to avoid early termination.

---

## Telegram troubleshooting checklist

If slash commands (e.g., `/balances`) are not working in a group:
1. Confirm `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (or `CHANNEL_ID`) are set in Script Properties or `ENV`.
2. Run the debug command in this guide `DEBUG_TELEGRAM_STATUS` and inspect `webhook` and `botInfo` fields.
3. Ensure the bot is added to the group and has permission to read messages (for commands to be delivered to the bot, add `/` → the chat should suggest commands). In groups, you may need to use `/command@YourBotUsername`.
4. If you expect the bot to react to plain messages, disable privacy mode (BotFather) so the bot receives all group messages, or use explicit command form.
5. You can also re-run `SETUP_BOT_COMMANDS` in the Apps Script Editor or via CLI to register commands again.

If you want, add these examples to your own scripts or create a PowerShell function to wrap them for convenience.

---

## Quick verification steps after running `RUN_MANUAL_SETUP`

- Check `Sheet1` to confirm transactions were not cleared unless you intentionally reset them.
- Verify categories and budgets exist (open `Categories` and `Budgets` sheets).
- Confirm web UI is saving to the backend: use the `TEST_ADD_TX` command above, then open `Sheet1` or click **عرض الكل** in the UI to confirm the transaction appears.

If anything behaves unexpectedly, run `RUN_AUTOMATED_CHECKLIST` and inspect the JSON output for failing subsystems. If you want, I can add short PowerShell wrapper functions to the repo for repeated usage (e.g., `Run-CompleteTest`, `Add-TestTx`).
