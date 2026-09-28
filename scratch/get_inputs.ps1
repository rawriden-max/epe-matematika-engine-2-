$path = "C:\Users\Mr. Ilyas\.gemini\antigravity-ide\brain\4c3fc36b-33f5-4d55-9089-467afa820f84\.system_generated\logs\transcript.jsonl"
$lines = [System.IO.File]::ReadAllLines($path)
foreach ($line in $lines) {
    if ($line.Contains('"type":"USER_INPUT"')) {
        $data = $line | ConvertFrom-Json
        Write-Output "--- STEP $($data.step_index) ---"
        Write-Output $data.content
    }
}
