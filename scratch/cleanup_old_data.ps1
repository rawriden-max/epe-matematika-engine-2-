$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
    'Prefer' = 'return=minimal'
}

# IDs to delete from hasil_pre-test: 9 to 32
$oldPreIds = (9..32) -join ','
Write-Host "Deleting old pre-test IDs: $oldPreIds"
try {
    Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test?id=in.($oldPreIds)" -Headers $headers -Method Delete
    Write-Host "Successfully deleted old pre-test records (IDs 9..32)!" -ForegroundColor Green
} catch {
    Write-Host "Error deleting old pre-test: $($_.Exception.Message)" -ForegroundColor Red
}

# IDs to delete from hasil_post-test: 3 to 26
$oldPostIds = (3..26) -join ','
Write-Host "Deleting old post-test IDs: $oldPostIds"
try {
    Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test?id=in.($oldPostIds)" -Headers $headers -Method Delete
    Write-Host "Successfully deleted old post-test records (IDs 3..26)!" -ForegroundColor Green
} catch {
    Write-Host "Error deleting old post-test: $($_.Exception.Message)" -ForegroundColor Red
}
