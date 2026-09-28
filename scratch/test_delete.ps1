$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
    'Prefer' = 'return=representation'
}

try {
    $res = Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test?id=eq.9" -Headers $headers -Method Delete
    Write-Host "Delete response: $($res | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)"
}
