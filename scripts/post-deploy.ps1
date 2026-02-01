<#
Post-deploy checklist script for MoneyTracker
Usage:
  powershell -ExecutionPolicy Bypass -File scripts/post-deploy.ps1 -DeploymentId AKfycbw... -TestChatId -1003422535725

What it does:
  1. Creates a new script version with a message "post-deploy <timestamp>".
  2. Redeploys the given deployment ID to that new version (no new deployment ID created).
  3. Calls CLI endpoints on the canonical webapp: SETUP_TELEGRAM_WEBHOOK and SETUP_BOT_COMMANDS.
  4. Optionally runs smoke tests: SEND_TEST_TELEGRAM (sends /budgets) and RUN_AUTOMATED_CHECKLIST and DUMP_INGRESS_DEBUG.

Notes:
  - You must provide the canonical deployment id via -DeploymentId (the id shown in `clasp deployments`).
  - If you omit -TestChatId the script will attempt to read TELEGRAM_CHAT_ID from the webapp properties.
#>

param(
  [Parameter(Mandatory=$true)]
  [string]$DeploymentId,

  [string]$TestChatId = $null,

  [switch]$SkipTests
)

function Exec-ClaspVersion {
  $msg = "post-deploy $(Get-Date -Format o)"
  $out = clasp version "$msg" 2>&1
  if ($LASTEXITCODE -ne 0) { throw "clasp version failed: $out" }
  $m = $out -join "`n" | Select-String -Pattern "Created version (\d+)" -AllMatches
  if ($m.Matches.Count -eq 0) { throw "Could not parse version from clasp output: $out" }
  return $m.Matches[0].Groups[1].Value
}

function Exec-ClaspRedeploy($deployId, $version) {
  $out = clasp deploy -i $deployId -V $version 2>&1
  if ($LASTEXITCODE -ne 0) { throw "clasp deploy failed: $out" }
  return $out -join "`n"
}

function Invoke-CLI($deployId, $cmd, $params = @{ }) {
  $base = "https://script.google.com/macros/s/$deployId/exec"
  $uri = $base + "?mode=cli&cmd=$cmd"
  foreach ($k in $params.Keys) { $uri += "&$k=" + [System.Web.HttpUtility]::UrlEncode($params[$k]) }
  Write-Host "Calling: $uri"
  return Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 60 -ErrorAction Stop
}

try {
  Write-Host "1) Creating new version..."
  $version = Exec-ClaspVersion
  Write-Host "Created version: $version"

  Write-Host "2) Redeploying canonical deployment id $DeploymentId to version $version..."
  Exec-ClaspRedeploy -deployId $DeploymentId -version $version | Write-Host

  Write-Host "3) Re-configuring webhook and bot commands on canonical deployment..."
  Invoke-CLI $DeploymentId 'SETUP_TELEGRAM_WEBHOOK' | ConvertTo-Json -Depth 6 | Write-Host
  Start-Sleep -Seconds 1
  Invoke-CLI $DeploymentId 'SETUP_BOT_COMMANDS' | ConvertTo-Json -Depth 6 | Write-Host

  # 3.5) Enforce allowed triggers to keep project healthy
  try {
    Write-Host "3.5) Enforcing allowed triggers (SOV1_processQueueBatch_, weeklyReport, monthlyReport)..."
    $enfRes = Invoke-CLI $DeploymentId 'ENFORCE_TRIGGERS' @{ keep = 'SOV1_processQueueBatch_,weeklyReport,monthlyReport' }
    Write-Host ($enfRes | ConvertTo-Json -Depth 6)
  } catch {
    Write-Warning "ENFORCE_TRIGGERS failed: $_"
  }

  if (-not $TestChatId) {
    Write-Host "No TestChatId provided, reading properties from webapp..."
    $propsResp = Invoke-CLI $DeploymentId 'LIST_PROPERTIES'
    if ($propsResp.result) {
      $props = ($propsResp.result | ConvertFrom-Json).properties
      $TestChatId = $props.TELEGRAM_CHAT_ID
      Write-Host "Found TELEGRAM_CHAT_ID = $TestChatId"
    }
  }

  if (-not $SkipTests) {
    if (-not $TestChatId) { Write-Warning "No test chat id available; skipping SEND_TEST_TELEGRAM" }
    else {
      Write-Host "4) Sending test /budgets to chat $TestChatId..."
      Invoke-CLI $DeploymentId 'SEND_TEST_TELEGRAM' @{ chat = $TestChatId; text = '/budgets' } | ConvertTo-Json -Depth 6 | Write-Host
    }

    Write-Host "5) Running smoke checks: RUN_AUTOMATED_CHECKLIST and DUMP_INGRESS_DEBUG (n=10)"
    Invoke-CLI $DeploymentId 'RUN_AUTOMATED_CHECKLIST' | ConvertTo-Json -Depth 6 | Write-Host
    Invoke-CLI $DeploymentId 'DUMP_INGRESS_DEBUG' @{ n = 10 } | ConvertTo-Json -Depth 6 | Write-Host
  }

  Write-Host "Post-deploy checklist completed successfully." -ForegroundColor Green
  exit 0

} catch {
  Write-Error "Post-deploy checklist failed: $_"
  exit 2
}
