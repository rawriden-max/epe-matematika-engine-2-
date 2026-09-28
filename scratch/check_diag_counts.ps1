$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
}

$students = @(
    "Adysha Alfiana", "Aisyah Aqillah Muslim", "Azzam Lingga Mahardika", "Dinda Raisah Gunawan",
    "Dzaky Irfanul Hakim", "Farabi Hubbi", "Faradiva Adzikra Utama", "Hava Najwa",
    "Inayah Afifah Rafansyah", "Kean Kavieza Ramadhan", "Kyla Zahira Yumna", "Mohammad Yazid",
    "Mufti Zhafran Arrahman", "Muhamad Fudhail Mubarok", "Muhamad Waif Rizky Sayri", "Muhammad Dzaki Mumtaz",
    "Muhammad Fatih Dafis Ramadhan", "Muhammad Razka Khadafi", "Muhammad Sulistiana Ramdani", "Muhammad Yaqhdan Rizki Ramadhan",
    "Naila Putri Hidayat", "Nida Rifda Maulidia", "Raisya Aghniya Rizqi", "Rizki Imam Addahiri"
)

Write-Host "RINCIAN SOAL DIAGNOSTIK TERJAWAB PER SISWA DI SUPABASE:"
Write-Host "--------------------------------------------------------"
$totalDiag = 0
foreach ($s in $students) {
    $encoded = [System.Uri]::EscapeDataString($s)
    $res = Invoke-RestMethod -Uri "$url/rest/v1/hasil_diagnosis?student_id=eq.$encoded&select=question_id" -Headers $headers -Method Get
    Write-Host "$s : $($res.Count) butir soal diagnostik"
    $totalDiag += $res.Count
}
Write-Host "--------------------------------------------------------"
Write-Host "TOTAL SELURUH JAWABAN DIAGNOSTIK 24 SISWA: $totalDiag butir"
