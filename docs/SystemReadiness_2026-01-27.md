# System Readiness Report – January 27, 2026

## Scope

This document summarizes the production readiness of the SJA MoneyTracker V2.5 system as of 2026-01-27, covering backend sheets, AI reasoning, Telegram integration, web UI, and tests.

## Core Guarantees

- **Single master audit:** `RUN_MASTER_VERIFICATION` in `SystemAudit.js` executes 7 checks (integrity, backend hygiene, accounts setup, SMS processing, balance linkage, smart reasoning, frontend API).
- **Clean backend schema:** `ENSURE_ALL_SHEETS` and `SCHEMA` in `Integrity.js` enforce headers for `Sheet1`, `Budgets`, `Debt_Ledger`, `Dashboard`, with UUID-based linking.
- **Unified Accounts sheet:** `Accounts.js` + `ENSURE_ALL_SHEETS` + `DataLinkage.js` now agree on a 10-column `Accounts` schema (name, type, number, bank, balance, lastUpdate, isMine, isInternal, aliases, notes).
- **AI pipeline:** `AI.js` uses Groq first, then Gemini, then a safe local fallback; all responses are sanitized into a strict structure.
- **Grok account extraction:** `extractAccountFromSMS_` uses `GROK_API_KEY` to propose structured account definitions for new SMS patterns.
- **Notifications:** Per-transaction Telegram reports and budget alerts respect settings from `Settings.js` via the notification helpers in `Notify.js`.

## Frontend–Backend Connectivity

- Web entry point `doGet` in `WebUI.js` delegates to `SOV1_UI_doGet_`, serving the main app pages (index, dashboard, settings, reports, onboarding, features, auto-tests).
- Fast dashboard data is provided by `SOV1_FAST_getDashboard` in `DataLinkage.js`, returning `success`, `data.kpi`, and `data.accounts`, and is used both by the UI and the audit tests.
- Categories, accounts, and settings are all exposed via `SOV1_UI_*` APIs in `WebUI.js` and `Accounts.js` for the HTML frontend.

## Telegram & Commands

- `Telegram.js` handles rich HTML formatting for transaction reports, balances, budgets, and period summaries.
- `TelegramCommands.js` defines the official bot commands: `/start`, `/menu`, `/menu_off`, `/today`, `/week`, `/month`, `/budgets`, `/balances`, `/last`, `/search`, `/add`, `/status`, `/help`.
- Inline actions in `TelegramActions.js` allow category changes, marking internal transfers, and requesting summaries from inside Telegram.
- Per-transaction reports now check `areTelegramNotificationsEnabled()` before sending, so notifications obey user settings.

## Backend Sheets & Columns

- `Sheet1` is the single source of truth for transactions, keyed by `UUID` with derived day/week tags and raw SMS text.
- `Budgets` tracks budget, spent, remaining, and `LinkedUUIDs` for every category, with cascade updates on insert/delete via `Integrity.js`.
- `Debt_Ledger` records internal transfers (when not resolved as pure self-transfers), maintaining a running balance column.
- `Accounts` is seeded by `SETUP_MY_ACCOUNTS` with real SAIB, Alrajhi, STC Pay, tiqmo, urpay, and Tamara accounts, and is used for balance tracking and internal-transfer detection.

## AI, Classification, and Rules

- `Flow.js` orchestrates parsing: templates via `Templates.js`, AI classification via `classifyWithAI`, optional classifier map + smart rules (controlled by `auto_apply_rules` in settings), then account enrichment via `DataLinkage.js`.
- Smart rules and classifier maps provide deterministic overrides for recurring merchants and loan-related messages.
- OTP / verification / declined / hold messages are filtered early in `Ingress.js` by `shouldIgnoreMessage_`, with behavior controlled by the `SAVE_TEMP_CODES` flag.

## Tests & Comparison with Open Source Patterns

- `_tests/` retains legacy test harnesses (AUTO_TEST_RUNNER, FULL_SYSTEM_AUDIT, etc.) for advanced scenarios, but the canonical entry point is `RUN_MASTER_VERIFICATION` in `SystemAudit.js`.
- The testing pattern mirrors mature open-source money trackers (such as Firefly III): integrity checks, schema verification, API ping tests, and rule/logic sanity checks.
- Automated-testing documentation in `_tests/AUTOMATED_TESTING.md` explains how to wire tests into `npm` and `clasp` flows if desired.

## Known Limitations / TODOs

- Legacy tests in `_tests/` are kept for reference but not fully rewritten to the new UUID/DataLinkage design; new users should rely on `RUN_MASTER_VERIFICATION`.
- Real-world edge cases (very unusual SMS formats, heavy multi-user usage) should still be validated in your own environment.

## Operator Checklist

1. Configure `Script Properties` (`SHEET_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GROQ_KEY`, `GROK_API_KEY` as needed).
2. Run `ENSURE_ALL_SHEETS` (via `initialsystem`) and `SETUP_MY_ACCOUNTS`.
3. Run `SETUP_BOT_COMMANDS` to publish Telegram commands.
4. Open the sheet and run `RUN_MASTER_VERIFICATION` from `SystemAudit.js`.
5. Use the **MoneyTracker Admin** menu to clean junk sheets and categories as needed.

If all 7 checks pass and Telegram/Web UI behave as described, the system is considered production ready for single-user personal finance tracking as of 2026-01-27.
