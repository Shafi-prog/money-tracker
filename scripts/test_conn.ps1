$url = "https://script.google.com/macros/s/AKfycbwGLWI1CB0BydH6o82gkw_KD9LmfBSEGhOngpf8TauTkt6A9XvcjwI723fYEtqWbnij/exec?mode=cli&cmd=DUMP_ACCOUNTS"
Write-Host "Testing URL: $url"
try {
    $uri = [System.Uri]$url
    Write-Host "Scheme: $($uri.Scheme)"
    Write-Host "Host: $($uri.Host)"
    $resp = Invoke-RestMethod -Uri $uri
    Write-Host "Success!"
    Write-Host $resp.substring(0, 100)
} catch {
    Write-Host "Error: $_"
    Write-Host "Exception: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        Write-Host "Inner: $($_.Exception.InnerException.Message)"
    }
}
