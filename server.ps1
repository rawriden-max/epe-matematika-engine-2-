$port = 8080
$prefix1 = "http://127.0.0.1:$port/"
$prefix2 = "http://localhost:$port/"
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix1)
try {
    $listener.Prefixes.Add($prefix2)
} catch {
    Write-Host "Catatan: Prefiks localhost memerlukan reservasi khusus, server aktif di 127.0.0.1"
}

try {
    $listener.Start()
} catch {
    # Jika gagal dengan kedua prefiks, coba hanya dengan 127.0.0.1
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix1)
    $listener.Start()
}
Write-Host "Server listening at $prefix1 and $prefix2"

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
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

                $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
                $reqBody = $reader.ReadToEnd()
                $reqObj = $null
                try {
                    $reqObj = $reqBody | ConvertFrom-Json
                } catch {}

                # If client provided API key in body, use it if env key is missing
                if ((-not $apiKey -or $apiKey.Length -lt 15) -and $reqObj -and $reqObj.apiKey -and $reqObj.apiKey.Trim().Length -gt 15) {
                    $apiKey = $reqObj.apiKey.Trim()
                }

                if ($apiKey -and $apiKey -ne "AIzaSy_YOUR_GEMINI_API_KEY_HERE" -and $apiKey.Length -gt 15 -and $reqObj) {
                    try {
                        $prompt = $reqObj.prompt
                        $attachedImage = $reqObj.image
                        $history = $reqObj.history
                        $activeQ = $reqObj.activeQuestion
                        $sAnswer = $reqObj.studentAnswer

                        $systemInstruction = "Kamu adalah Matrix, Asisten AI Cerdas di platform Error Pattern Engine (EPE). Berikan penjelasan edukatif, akurat, santun, dan lengkap. Format rumus matematika dengan KaTeX LaTeX `$..$` atau `$$..$$`."
                        $systemInstruction += "`n`nATURAN FORMAT RUMUS & TAUTAN INTERAKTIF:`n- SANGAT DIANJURKAN menyertakan tautan referensi belajar Markdown interaktif menggunakan format [Nama Materi/Sumber](https://url-valid) (misal: 3Blue1Brown, Khan Academy, Brilliant, MIT OpenCourseWare, Wikipedia).`n- DILARANG KERAS membuat disclaimer seperti 'Sebagai AI saya tidak dapat menulis tautan dengan href dalam mode plaintext' atau meminta siswa menyalin-tempel manual! Web EPE telah memiliki parser link interaktif penuh yang otomatis merender tautan menjadi tombol/link klik aktif."
                        $systemInstruction += "`n`nPENGEMBANGAN CATATAN EDUKATIF ('Catatan dari AI'):`n- Di akhir penjelasan konsep, berikan bagian '> [!NOTE] Catatan Pendalaman Konsep' yang kaya, terstruktur, dan aplikatif!`n- Jika topik menyangkut aljabar/matriks/geometri, perluas ke topik mendalam: Rotasi dalam 3-Dimensi (Euler angles, keterbatasan Gimbal Lock, Quaternions pada game 3D & robotika), Dekomposisi SVD ($A = U \Sigma V^T$) pada Machine Learning & kompresi gambar, Nilai Eigen ($Av = \lambda v$) pada PageRank, serta aplikasi diskriminan pada lintasan gerak kuadratik."
                        $systemInstruction += "`n`nPRINSIP UTAMA CONTEXT ROUTING & HISTORY:`nMatrix mengingat seluruh alur percakapan sebelumnya bersama siswa.`n1. CONVERSATIONAL CONTEXT: Percakapan bebas, sains umum, astronomi, video game, pop culture, transportasi publik (MRT), rumus umum, atau pertanyaan sehari-hari.`n2. APPLICATION / LEARNING CONTEXT: Latihan soal aktif di aplikasi."
                        $systemInstruction += "`n`nATURAN CONTEXT ROUTING (CONTEXT AWARENESS != CONTEXT FORCING):`n- Sambungkan jawabanmu secara logis dengan pertanyaan atau topik di riwayat percakapan sebelumnya!`n- JANGAN OTOMATIS MEMAKSAKAN atau mengarahkan siswa kembali ke soal aktif jika siswa bertanya tentang topik umum, sains, game, astronomi, transportasi, atau rumus umum!`n- Gunakan konteks Soal Aktif HANYA JIKA siswa menanyakan jawaban mereka ('kenapa jawaban saya salah?', 'kenapa B?'), meminta petunjuk soal aktif, atau berkata 'balik ke soal tadi'."
                        $systemInstruction += "`n`nATURAN SAPAAN (PERCAKAPAN BERJALAN):`nIni adalah percakapan chat yang SEDANG BERLANGSUNG. JANGAN mengulang kata sapaan ('Halo!', 'Halo Siswa!') atau memperkenalkan diri ('Saya Matrix...') di awal jawaban setiap respon baru! Langsung jawab ke inti pertanyaan atau topik secara natural dan mengalir."
                        
                        $geminiContents = @()

                        # Injeksi riwayat percakapan multi-turn
                        if ($history -and $history.Count -gt 0) {
                            $firstTurn = $true
                            $lastRole = ""
                            foreach ($hItem in $history) {
                                $hRole = if ($hItem.role -eq "model" -or $hItem.role -eq "assistant") { "model" } else { "user" }
                                if ($hRole -eq $lastRole) { continue }
                                $hText = $hItem.text
                                if (-not $hText) { continue }
                                if ($firstTurn) {
                                    $hText = "$systemInstruction`n`n[Pesan Siswa Sebelumnya]:`n$hText"
                                    $firstTurn = $false
                                }
                                $geminiContents += @{
                                    role = $hRole
                                    parts = @( @{ text = $hText } )
                                }
                                $lastRole = $hRole
                            }
                        }

                        # Giliran pengguna saat ini (current user turn)
                        $currentUserParts = @()

                        if ($attachedImage -and $attachedImage -match '^data:(image/\w+);base64,(.+)$') {
                            $mimeType = $Matches[1]
                            $base64Data = $Matches[2]
                            $currentUserParts += @{
                                inlineData = @{
                                    mimeType = $mimeType
                                    data = $base64Data
                                }
                            }
                            $systemInstruction += "`n`n[PENTING - ANALISIS GAMBAR TERLAMPIR]:`nPengguna melampirkan sebuah gambar visual (bisa screenshot video game seperti Hogwarts Legacy, foto alam, hewan/makhluk, objek sehari-hari, maupun soal matematika). Analisis gambar tersebut secara visual, kenali objek/game/elemennya secara akurat, dan jawab pertanyaan pengguna dengan FOKUS PENUH PADA GAMBAR TERSEBUT. JANGAN mengasumsikan gambar ini terkait dengan soal latihan aljabar/matematika di aplikasi jika gambar yang ditampilkan bukan soal matematika!"
                        } elseif ($activeQ -and (-not $history -or $history.Count -eq 0)) {
                            $systemInstruction += "`n`n[Konteks Soal Aktif di Aplikasi - Hanya rujuk jika siswa menanyakannya]:`n- Soal: " + $activeQ.id + " (" + $activeQ.title + "): " + $activeQ.promptText
                            if ($sAnswer) {
                                $systemInstruction += "`n- Jawaban Siswa: $sAnswer"
                            }
                        }

                        $curPromptText = if ($geminiContents.Count -eq 0) { "$systemInstruction`n`nPertanyaan Pengguna: $prompt" } else { "Pertanyaan Pengguna: $prompt" }
                        $currentUserParts += @{ text = $curPromptText }

                        $geminiContents += @{
                            role = "user"
                            parts = $currentUserParts
                        }

                        $modelsToTry = @("gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.1-pro-preview", "gemini-pro-latest", "gemini-2.5-flash", "gemini-1.5-flash")
                        $geminiRes = $null
                        $usedModel = ""

                        foreach ($mName in $modelsToTry) {
                            $geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=$apiKey"
                            $payloadObj = @{
                                contents = $geminiContents
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
                    $body = '{"success":false,"hasKey":false,"message":"GEMINI_API_KEY belum dikonfigurasi di .env atau pengaturan. Menggunakan AI kognitif lokal & pencarian web."}'
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
