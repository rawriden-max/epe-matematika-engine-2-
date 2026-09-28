$targetFiles = @(
    "js\multimodal\multimodalInputUI.js",
    "js\ui\aiAgentManager.js",
    "index.html"
)

$pattern = '[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]'

foreach ($relPath in $targetFiles) {
    if (Test-Path $relPath) {
        $lines = [System.IO.File]::ReadAllLines($relPath, [System.Text.Encoding]::UTF8)
        Write-Host "=== $relPath ==="
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match $pattern) {
                Write-Host "Line $($i+1): $($lines[$i].Trim())"
            }
        }
    }
}
