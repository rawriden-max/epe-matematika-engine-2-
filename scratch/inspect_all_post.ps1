$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

$post = Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test?select=id,attempt_id,student_id,student_name,score,created_at" -Headers $headers -Method Get
Write-Host "Total rows in hasil_post-test: $($post.Count)"
foreach ($r in $post) {
    Write-Host "$($r.id) :: $($r.student_id) :: $($r.student_name) :: $($r.score) :: $($r.attempt_id)"
}
