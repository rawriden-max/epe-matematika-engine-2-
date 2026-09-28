$lines = [System.IO.File]::ReadAllLines("index.html", [System.Text.Encoding]::UTF8)
$results = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]') {
        $results += "Line $($i+1): $($lines[$i].Trim())"
    }
}
$results | Out-File -FilePath "scratch/html_emojis.txt" -Encoding UTF8
Write-Host "Found $($results.Count) lines with emojis."
