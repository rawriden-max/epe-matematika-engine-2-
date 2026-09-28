$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
    'Prefer' = 'count=exact'
}

$tables = @('hasil_pre-test', 'hasil_post-test', 'hasil_diagnosis')

foreach ($t in $tables) {
    try {
        $res = Invoke-WebRequest -Uri "$url/rest/v1/${t}?select=id" -Headers $headers -Method Get
        $count = $res.Headers['Content-Range']
        Write-Host "$t count: $count"
    } catch {
        Write-Host "$t error: $($_.Exception.Message)"
    }
}
