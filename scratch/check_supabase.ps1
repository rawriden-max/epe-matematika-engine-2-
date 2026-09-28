$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

$tables = @('hasil_diagnosis', 'hasil_pretest', 'hasil_posttest', 'pretest', 'posttest', 'pre_test', 'post_test', 'pretest_responses', 'posttest_responses', 'pretest_scores', 'posttest_scores')

foreach ($t in $tables) {
    try {
        $res = Invoke-RestMethod -Uri "$url/rest/v1/$t?limit=1" -Headers $headers -Method Get -TimeoutSec 5
        Write-Host "TABLE EXISTS: $t"
        if ($res.Count -gt 0) {
            Write-Host "  Columns: $($res[0].PSObject.Properties.Name -join ', ')"
        } else {
            Write-Host "  (Table exists, 0 rows)"
        }
    } catch {
        Write-Host "Table $t error: $($_.Exception.Message)"
    }
}
