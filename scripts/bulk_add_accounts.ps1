$baseUrl = 'https://script.google.com/macros/s/AKfycbwGLWI1CB0BydH6o82gkw_KD9LmfBSEGhOngpf8TauTkt6A9XvcjwI723fYEtqWbnij/exec'

$accounts = @(
  @{name='SAIB - Main'; type='Bank'; number='8001'; bank='SAIB'; balance=0; isMine=$true; isInternal=$false; aliases='SAIB,Saudi Investment Bank,saib'; notes='Main account'},
  @{name='SAIB - Card'; type='Card'; number='3474'; bank='SAIB'; balance=0; isMine=$true; isInternal=$false; aliases='*3474,mada'; notes='ATM card'},
  @{name='Alrajhi - Account 1'; type='Bank'; number='9767'; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,alrajhibank,ALBI'; notes='Transfers'},
  @{name='Alrajhi - Account 2'; type='Bank'; number='9765'; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Deposits'},
  @{name='Alrajhi - Account 3'; type='Bank'; number='1626'; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Internal transfers'},
  @{name='Alrajhi - Account 4 (TBD)'; type='Bank'; number=''; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Add last-4'},
  @{name='Alrajhi - Card 1 (TBD)'; type='Card'; number=''; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Add last-4'},
  @{name='Alrajhi - Card 2 (TBD)'; type='Card'; number=''; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Add last-4'},
  @{name='Alrajhi - Card 3 (TBD)'; type='Card'; number=''; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Add last-4'},
  @{name='Alrajhi - Card 4 (TBD)'; type='Card'; number=''; bank='Alrajhi'; balance=0; isMine=$true; isInternal=$false; aliases='Alrajhi,alrajhi,ALBI'; notes='Add last-4'},
  @{name='STC Bank - Account'; type='Bank'; number='1929'; bank='STC Bank'; balance=0; isMine=$true; isInternal=$false; aliases='STC Bank,STC'; notes='Bank account'},
  @{name='STC Bank - Card 1'; type='Card'; number='3281'; bank='STC Bank'; balance=0; isMine=$true; isInternal=$false; aliases='*3281,Apple Pay,STC'; notes='Card'},
  @{name='STC Bank - Card 2 (TBD)'; type='Card'; number=''; bank='STC Bank'; balance=0; isMine=$true; isInternal=$false; aliases='STC,STC Bank'; notes='Add last-4'},
  @{name='Tiqmo - Account'; type='Wallet'; number='9682'; bank='Tiqmo'; balance=0; isMine=$true; isInternal=$true; aliases='Tiqmo,TGMO'; notes='Wallet account'},
  @{name='Tiqmo - Card'; type='Card'; number='0305'; bank='Tiqmo'; balance=0; isMine=$true; isInternal=$true; aliases='*0305,MasterCard,Apple Pay'; notes='Wallet card'},
  @{name='STC Pay'; type='Wallet'; number=''; bank='STC Pay'; balance=0; isMine=$true; isInternal=$true; aliases='stc pay,stcpay'; notes='Wallet'},
  @{name='urpay'; type='Wallet'; number=''; bank='urpay'; balance=0; isMine=$true; isInternal=$true; aliases='urpay'; notes='Wallet'},
  @{name='Tamara'; type='Commitment'; number=''; bank='Tamara'; balance=0; isMine=$false; isInternal=$false; aliases='Tamara'; notes='Installments only'}
)

$builder = New-Object System.UriBuilder $baseUrl

for ($i = 0; $i -lt $accounts.Count; $i += 3) {
  $end = [Math]::Min($i + 2, $accounts.Count - 1)
  $chunk = $accounts[$i..$end]
  $json = ConvertTo-Json -InputObject $chunk -Compress
  $encoded = [Uri]::EscapeDataString($json)
  $builder.Query = "mode=cli&cmd=BULK_ADD_ACCOUNTS&accountsJson=$encoded"
  $uri = $builder.Uri.AbsoluteUri

  if ($uri.Length -gt 1900) {
    Write-Host "[WARN] URI too long: $($uri.Length) for accounts $i..$end"
    continue
  }

  Write-Host "Sending accounts $i..$end"
  try {
    $resp = Invoke-RestMethod -Uri $uri -Method Get
    Write-Host "  Response: $($resp | ConvertTo-Json -Compress)"
  } catch {
    Write-Host "  Error: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
      Write-Host "  Inner: $($_.Exception.InnerException.Message)"
    }
  }
}

Write-Host "Done."