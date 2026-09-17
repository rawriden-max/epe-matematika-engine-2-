$port = 8080
$prefix = "http://127.0.0.1:$port/"
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Server listening at $prefix"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".webm" = "audio/webm"
    ".mp3"  = "audio/mpeg"
    ".wav"  = "audio/wav"
    ".csv"  = "text/csv; charset=utf-8"
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        try {
            $req = $ctx.Request
            $res = $ctx.Response

            $res.Headers["Access-Control-Allow-Origin"] = "*"
            $res.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

            if ($req.HttpMethod -eq "OPTIONS") {
                $res.StatusCode = 204
                $res.Close()
                continue
            }

            $rawPath = $req.Url.LocalPath
            if ($rawPath -eq "/" -or $rawPath -eq "") {
                $rawPath = "/index.html"
            }

            if ($rawPath -eq "/api/gemini") {
                $res.ContentType = "application/json; charset=utf-8"
                
                # Check for GEMINI_API_KEY in environment or .env file
                $apiKey = $env:GEMINI_API_KEY
                if (-not $apiKey) {
                    $envFile = Join-Path $root ".env"
                    if (Test-Path $envFile) {
                        $lines = Get-Content $envFile
                        foreach ($line in $lines) {
                            if ($line -match '^\s*GEMINI_API_KEY\s*=\s*(.+)$') {
                                $apiKey = $matches[1].Trim()
                                break
                            }
                        }
                    }
                }

                if ($apiKey -and $apiKey -ne "AIzaSy_YOUR_GEMINI_API_KEY_HERE" -and $apiKey.Length -gt 15) {
                    try {
                        $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
                        $reqBody = $reader.ReadToEnd()
                        $reqObj = $reqBody | ConvertFrom-Json
                        $prompt = $reqObj.prompt

                        $prompt = $reqObj.prompt
                        $activeQ = $reqObj.activeQuestion
                        $sAnswer = $reqObj.studentAnswer

                        $systemInstruction = "Kamu adalah Matrix, Asisten AI Cerdas di platform Error Pattern Engine (EPE). Berikan penjelasan edukatif, akurat, santun, dan lengkap. Format rumus matematika dengan KaTeX LaTeX `$..$`."
                        $systemInstruction += "`n`nPRINSIP UTAMA CONTEXT ROUTING:`nMatrix memiliki dua konteks simultan:`n1. CONVERSATIONAL CONTEXT: Percakapan bebas, sains umum, astronomi, transportasi publik (MRT), rumus umum, atau pertanyaan sehari-hari.`n2. APPLICATION / LEARNING CONTEXT: Latihan soal aktif di aplikasi."
                        $systemInstruction += "`n`nATURAN CONTEXT ROUTING (CONTEXT AWARENESS != CONTEXT FORCING):`n- JANGAN OTOMATIS MEMAKSAKAN atau mengarahkan siswa kembali ke soal aktif jika siswa bertanya tentang topik umum, sains, astronomi, transportasi, atau rumus umum!`n- Contoh: 'sekarang kita hidup di planet apa?', 'MRT rutenya darimana ke mana', 'rumus avogadro' -> Jawab topik tersebut secara tuntas dan edukatif TANPA menyelipkan ajakan kembali ke soal aktif.`n- Gunakan konteks Soal Aktif HANYA JIKA siswa menanyakan jawaban mereka ('kenapa jawaban saya salah?', 'kenapa B?'), meminta petunjuk soal aktif, atau berkata 'balik ke soal tadi'."
                        $systemInstruction += "`n`nATURAN SAPAAN (PERCAKAPAN BERJALAN):`nIni adalah percakapan chat yang SEDANG BERLANGSUNG. JANGAN mengulang kata sapaan ('Halo!', 'Halo Siswa!', 'Hai!') atau memperkenalkan diri ('Saya Matrix...') di awal jawaban setiap respon baru! Langsung jawab ke inti pertanyaan atau topik secara natural dan mengalir."
                        
                        if ($activeQ) {
                            $systemInstruction += "`n`n[Konteks Soal Aktif di Aplikasi - Hanya rujuk jika siswa menanyakannya]:`n- Soal: " + $activeQ.id + " (" + $activeQ.title + "): " + $activeQ.promptText
                            if ($sAnswer) {
                                $systemInstruction += "`n- Jawaban Siswa: $sAnswer"
                            }
                        }

                        $fullPrompt = "$systemInstruction`n`nPertanyaan Pengguna: $prompt"

                        $modelsToTry = @("gemini-3.6-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest")
                        $geminiRes = $null
                        $usedModel = ""

                        foreach ($mName in $modelsToTry) {
                            $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=$apiKey"
                            $payloadObj = @{
                                contents = @(
                                    @{
                                        role = "user"
                                        parts = @(
                                            @{ text = $fullPrompt }
                                        )
                                    }
                                )
                                generationConfig = @{
                                    maxOutputTokens = 4096
                                    temperature = 0.7
                                }
                            }

                            try {
                                $payload = $payloadObj | ConvertTo-Json -Depth 6
                                $geminiRes = Invoke-RestMethod -Uri $geminiUrl -Method Post -ContentType "application/json; charset=utf-8" -Body $payload -TimeoutSec 20
                                if ($geminiRes -and $geminiRes.candidates) {
                                    $usedModel = $mName
                                    break
                                }
                            } catch {
                                # Try next model
                            }
                        }

                        if ($geminiRes -and $geminiRes.candidates) {
                            $replyText = ($geminiRes.candidates[0].content.parts | ForEach-Object { $_.text }) -join "`n"
                            $respObj = @{
                                success = $true
                                provider = "gemini-cloud-$usedModel"
                                text = $replyText.Trim()
                            }
                            $body = $respObj | ConvertTo-Json -Depth 6
                        } else {
                            $body = '{"success":false,"message":"Semua model Gemini sedang sibuk. Beralih ke pencarian web dan AI kognitif lokal."}'
                        }
                    } catch {
                        $errMsg = $_.Exception.Message.Replace('"', '\"')
                        $body = '{"success":false,"message":"' + $errMsg + '"}'
                    }
                } else {
                    $body = '{"success":false,"hasKey":false,"message":"GEMINI_API_KEY belum dikonfigurasi di .env. Menggunakan AI kognitif lokal & pencarian web."}'
                }

                $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                $res.Close()
                continue
            }

            $relativePath = $rawPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $filePath = Join-Path $root $relativePath

            if (Test-Path -Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $res.ContentType = $contentType
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentLength64 = $bytes.Length
                if ($req.HttpMethod -ne "HEAD") {
                    $res.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $res.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawPath")
                $res.ContentType = "text/plain; charset=utf-8"
                $res.ContentLength64 = $msg.Length
                $res.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
        } finally {
            try { $ctx.Response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
