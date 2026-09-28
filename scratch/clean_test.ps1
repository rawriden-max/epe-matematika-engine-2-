$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test?student_name=eq.Test%20Student" -Headers $headers -Method Delete
Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test?student_name=eq.Test%20Student" -Headers $headers -Method Delete
Invoke-RestMethod -Uri "$url/rest/v1/hasil_diagnosis?student_id=eq.TEST_PING" -Headers $headers -Method Delete
Write-Host "Cleanup completed."
