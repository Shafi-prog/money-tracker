# PowerShell script to parse docs/grok_sms_samples.md for the RAW DUMP section,
# split the massive text blocks into individual messages, and import them.

$baseUrl = "https://script.google.com/macros/s/AKfycbwGLWI1CB0BydH6o82gkw_KD9LmfBSEGhOngpf8TauTkt6A9XvcjwI723fYEtqWbnij/exec"
$inputPath = "../docs/grok_sms_samples.md"

if (!(Test-Path $inputPath)) {
    Write-Error "File not found: $inputPath"
    exit 1
}

# 1. Extract RAW DUMP section
$content = Get-Content $inputPath -Raw -Encoding UTF8
$marker = "## FULL RAW SMS DUMP (user-provided)"
$idx = $content.IndexOf($marker)
if ($idx -lt 0) {
    $marker = "## FULL RAW SMS DUMP"
    $idx = $content.IndexOf($marker)
}

if ($idx -ge 0) {
    $rawDump = $content.Substring($idx + $marker.Length)
    if ($rawDump -match '(?s)```\w*\s*(.*?)```') {
        $rawDump = $matches[1]
    }
} else {
    Write-Error "Could not find '## FULL RAW SMS DUMP' section in $inputPath"
    exit 1
}

$groups = $rawDump -split '(\r?\n){2,}'
$candidates = @()

# 2. Fetch existing accounts
Write-Host "Fetching existing accounts..."
try {
    $uriGet = "$baseUrl" + "?mode=cli&cmd=GET_ACCOUNTS"
    Write-Host "GET URI: $uriGet"
    $existResp = Invoke-RestMethod -Uri $uriGet -Method Get -ErrorAction Stop
    $existing = if ($existResp -is [array]) { $existResp } else { @() }
} catch {
    Write-Host "Warning: Failed to fetch existing accounts. $_"
    $existing = @()
}
Write-Host "Existing accounts: $($existing.Count)"

# 3. Process groups
foreach ($g in $groups) {
    $blockText = $g.Trim()
    if ($blockText.Length -lt 10) { continue }
    
    # Extract bank from header if present (e.g., "tiqmo=")
    $bankHint = ""
    $lines = $blockText -split '\r?\n'
    if ($lines[0] -match '^(\w+)=$') {
        $bankHint = $matches[1]
        Write-Host "Detected bank header: $bankHint"
        # Remove the header line
        $blockText = $lines[1..($lines.Length-1)] -join "`n"
    }
    
    $keywords = "شراء|Online|Reverse|إضافة|رصيد|رمز|Payment|Transfer|Deposit|Withdrawal|Purchase|Refund|One Time Pass|The amount|Your account|Op:"
    $splitPattern = "(?:\r?\n)(?=\s*(?:$keywords))"
    
    $subMessages = $blockText -split $splitPattern | Where-Object { $_.Trim().Length -gt 10 }
    if ($subMessages.Count -eq 0) { $subMessages = @($blockText) }

    Write-Host "Processing block (len=$($blockText.Length)) -> Found $($subMessages.Count) sub-messages"
    
    # Process in batches of 1, but split large messages
    for ($i = 0; $i -lt $subMessages.Count; $i += 1) {
        $msg = $subMessages[$i]
        # If message is too long, split by lines
        if ($msg.Length -gt 500) {
            $lines = $msg -split '\r?\n' | Where-Object { $_.Trim().Length -gt 10 }
            foreach ($line in $lines) {
                if ($line.Length -gt 10) {
                    if ($bankHint) { $line = "Bank: $bankHint`n$line" }
                    $batch = @($line)
                    $jsonSms = $batch | ConvertTo-Json -Compress
                    $encodedSms = [Uri]::EscapeDataString($jsonSms)
                    
                    try {
                        $uriExtract = "$baseUrl" + "?mode=cli&cmd=BULK_EXTRACT_ACCOUNTS&smsText=" + $encodedSms
                        
                        if ($uriExtract.Length -gt 2000) {
                           Write-Host "  [WARN] URI too long ($($uriExtract.Length)), skipping line."
                           continue
                        }

                        $resp = Invoke-RestMethod -Uri $uriExtract -Method Get -ErrorAction Stop
                        
                        $data = $resp
                        if ($resp.result) { $data = $resp.result }
                        if ($data -is [string]) { $data = $data | ConvertFrom-Json }
                        
                        if ($data.success -and $data.results) {
                            foreach ($r in $data.results) {
                                if ($r.result.success -and $r.result.account) {
                                    $acc = $r.result.account
                                    
                                    $isDuplicate = $false
                                    if ($acc.number -and $acc.number.Length -gt 2) {
                                        foreach ($ex in $existing) {
                                            if ($ex.number -and ($ex.number.EndsWith($acc.number) -or $acc.number.EndsWith($ex.number))) { 
                                                $isDuplicate = $true; break 
                                            }
                                        }
                                    }
                                    if (-not $isDuplicate) {
                                        foreach ($cand in $candidates) {
                                            if ($cand.number -eq $acc.number -and $cand.bank -eq $acc.bank) {
                                                $isDuplicate = $true; break
                                            }
                                        }
                                    }

                                    if (-not $isDuplicate) {
                                        Write-Host "  [+] Found: $($acc.bank) - $($acc.number) (Bal: $($acc.balance))"
                                        $candidates += $acc
                                    }
                                } 
                            }
                        }
                    } catch {
                        # Silent fail for lines
                    }
                }
            }
        } else {
            # Normal processing
            if ($bankHint) { $msg = "Bank: $bankHint`n$msg" }
            $batch = @($msg)
            $jsonSms = $batch | ConvertTo-Json -Compress
            $encodedSms = [Uri]::EscapeDataString($jsonSms)
            
            try {
                $uriExtract = "$baseUrl" + "?mode=cli&cmd=BULK_EXTRACT_ACCOUNTS&smsText=" + $encodedSms
                
                if ($uriExtract.Length -gt 2000) {
                   Write-Host "  [WARN] URI too long ($($uriExtract.Length)), skipping batch."
                   continue
                }

                $resp = Invoke-RestMethod -Uri $uriExtract -Method Get -ErrorAction Stop
                
                $data = $resp
                if ($resp.result) { $data = $resp.result }
                if ($data -is [string]) { $data = $data | ConvertFrom-Json }
                
                if ($data.success -and $data.results) {
                    foreach ($r in $data.results) {
                        if ($r.result.success -and $r.result.account) {
                            $acc = $r.result.account
                            
                            $isDuplicate = $false
                            if ($acc.number -and $acc.number.Length -gt 2) {
                                foreach ($ex in $existing) {
                                    if ($ex.number -and ($ex.number.EndsWith($acc.number) -or $acc.number.EndsWith($ex.number))) { 
                                        $isDuplicate = $true; break 
                                    }
                                }
                            }
                            if (-not $isDuplicate) {
                                foreach ($cand in $candidates) {
                                    if ($cand.number -eq $acc.number -and $cand.bank -eq $acc.bank) {
                                        $isDuplicate = $true; break
                                    }
                                }
                            }

                            if (-not $isDuplicate) {
                                Write-Host "  [+] Found: $($acc.bank) - $($acc.number) (Bal: $($acc.balance))"
                                $candidates += $acc
                            }
                        } 
                    }
                } elseif ($data.error) {
                     Write-Host "  [ERR] API Error: $($data.error)"
                }
            } catch {
                Write-Host "  [ERR] Batch failed: $_"
            }
        }
    }
}

Write-Host "------------------------------------------------"
Write-Host "Total new candidates found: $($candidates.Count)"

if ($candidates.Count -gt 0) {
    Write-Host "Importing..."
    for ($i = 0; $i -lt $candidates.Count; $i += 1) {
         $batch = @($candidates[$i])
         $jsonBatch = $batch | ConvertTo-Json -Depth 5 -Compress
         $encodedBatch = [Uri]::EscapeDataString($jsonBatch)

         try {
             $uriImp = "$baseUrl" + "?mode=cli&cmd=BULK_ADD_ACCOUNTS&accounts=" + $encodedBatch
             if ($uriImp.Length -gt 2000) {
                 Write-Host "  [WARN] Import URI too long, skipping."
                 continue
             }
             $impResp = Invoke-RestMethod -Uri $uriImp -Method Get -ErrorAction Stop
             
             $impData = if ($impResp.result -is [string]) { ($impResp.result | ConvertFrom-Json) } else { $impResp.result }
             if ($impData -is [string]) { $impData = $impData | ConvertFrom-Json }

             Write-Host "  Batch result: Success=$($impData.success)"
         } catch {
             Write-Host "  Import Batch Failed: $_"
         }
    }
} else {
    Write-Host "No new accounts to import."
}
