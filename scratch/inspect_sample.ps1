$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

$pre = Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test?limit=1" -Headers $headers -Method Get
Write-Host "=== SAMPLE PRE-TEST ROW ==="
$pre | ConvertTo-Json -Depth 5 | Write-Host

$post = Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test?limit=1" -Headers $headers -Method Get
Write-Host "=== SAMPLE POST-TEST ROW ==="
$post | ConvertTo-Json -Depth 5 | Write-Host
