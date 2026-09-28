$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

try {
    $res = Invoke-RestMethod -Uri "$url/rest/v1/?apikey=$key" -Headers $headers -Method Get
    Write-Host "Paths:"
    $res.paths.PSObject.Properties.Name | ForEach-Object { Write-Host "  $_" }
    Write-Host "Definitions:"
    $res.definitions.PSObject.Properties.Name | ForEach-Object { Write-Host "  $_" }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
