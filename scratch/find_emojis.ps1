$files = Get-ChildItem -Path . -Recurse -Include *.js, *.html | Where-Object { $_.FullName -notmatch "node_modules|\.git|dist" }
$pattern = '[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]'

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $matches = [regex]::Matches($content, $pattern)
    if ($matches.Count -gt 0) {
        $sample = ($matches | Select-Object -First 5 | ForEach-Object { $_.Value }) -join " "
        Write-Host "$($file.Name) : $($matches.Count) emojis (e.g. $sample)"
    }
}
