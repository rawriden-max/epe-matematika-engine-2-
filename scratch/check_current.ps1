$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

$diag = Invoke-RestMethod -Uri "$url/rest/v1/hasil_diagnosis?select=student_id" -Headers $headers -Method Get
Write-Host "hasil_diagnosis total rows: $($diag.Count)"
$diagStudents = $diag | ForEach-Object { $_.student_id } | Select-Object -Unique
Write-Host "hasil_diagnosis unique students ($($diagStudents.Count)): $($diagStudents -join ', ')"

$pre = Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test?select=student_name,score,created_at" -Headers $headers -Method Get
Write-Host "hasil_pre-test total rows: $($pre.Count)"
$pre | ForEach-Object { Write-Host "  Pre: $($_.student_name) - Score: $($_.score) - $($_.created_at)" }

$post = Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test?select=student_name,score,created_at" -Headers $headers -Method Get
Write-Host "hasil_post-test total rows: $($post.Count)"
$post | ForEach-Object { Write-Host "  Post: $($_.student_name) - Score: $($_.score) - $($_.created_at)" }
