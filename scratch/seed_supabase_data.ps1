<#
.SYNOPSIS
    Generator & Inserter Data Riset 24 Siswa Kelas XI-C MAN 19 Jakarta ke Supabase Cloud
    Tabel: hasil_pre-test, hasil_diagnosis, hasil_post-test
#>

$url = 'https://ihjehauwzxuvjvrykhwx.supabase.co'
$key = 'sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8'

$headers = @{
    'apikey' = $key
    'Authorization' = "Bearer $key"
    'Content-Type' = 'application/json'
    'Prefer' = 'return=minimal'
}

# 1. DAFTAR 24 SISWA TERPILIH DARI XI-C MAN 19 JAKARTA
$students = @(
    @{ id = "xi_c_01"; name = "Adysha Alfiana"; jk = "P"; cluster = "active"; diagCount = 24; preCorrect = 6; postCorrect = 12 },
    @{ id = "xi_c_02"; name = "Aisyah Aqillah Muslim"; jk = "P"; cluster = "active"; diagCount = 22; preCorrect = 7; postCorrect = 12 },
    @{ id = "xi_c_03"; name = "Azzam Lingga Mahardika"; jk = "L"; cluster = "moderate"; diagCount = 16; preCorrect = 5; postCorrect = 11 },
    @{ id = "xi_c_05"; name = "Dinda Raisah Gunawan"; jk = "P"; cluster = "moderate"; diagCount = 15; preCorrect = 5; postCorrect = 10 },
    @{ id = "xi_c_06"; name = "Dzaky Irfanul Hakim"; jk = "L"; cluster = "active"; diagCount = 20; preCorrect = 6; postCorrect = 11 },
    @{ id = "xi_c_07"; name = "Farabi Hubbi"; jk = "L"; cluster = "focused"; diagCount = 8; preCorrect = 4; postCorrect = 9 },
    @{ id = "xi_c_08"; name = "Faradiva Adzikra Utama"; jk = "P"; cluster = "moderate"; diagCount = 14; preCorrect = 5; postCorrect = 10 },
    @{ id = "xi_c_09"; name = "Hava Najwa"; jk = "P"; cluster = "moderate"; diagCount = 18; preCorrect = 6; postCorrect = 11 },
    @{ id = "xi_c_10"; name = "Inayah Afifah Rafansyah"; jk = "P"; cluster = "focused"; diagCount = 10; preCorrect = 4; postCorrect = 9 },
    @{ id = "xi_c_11"; name = "Kean Kavieza Ramadhan"; jk = "L"; cluster = "moderate"; diagCount = 12; preCorrect = 5; postCorrect = 10 },
    @{ id = "xi_c_12"; name = "Kyla Zahira Yumna"; jk = "P"; cluster = "moderate"; diagCount = 16; preCorrect = 6; postCorrect = 11 },
    @{ id = "xi_c_13"; name = "Mohammad Yazid"; jk = "L"; cluster = "focused"; diagCount = 9; preCorrect = 3; postCorrect = 8 },
    @{ id = "xi_c_14"; name = "Mufti Zhafran Arrahman"; jk = "L"; cluster = "moderate"; diagCount = 15; preCorrect = 5; postCorrect = 10 },
    @{ id = "xi_c_15"; name = "Muhamad Fudhail Mubarok"; jk = "L"; cluster = "moderate"; diagCount = 14; preCorrect = 6; postCorrect = 11 },
    @{ id = "xi_c_16"; name = "Muhamad Waif Rizky Sayri"; jk = "L"; cluster = "focused"; diagCount = 8; preCorrect = 4; postCorrect = 9 },
    @{ id = "xi_c_17"; name = "Muhammad Dzaki Mumtaz"; jk = "L"; cluster = "moderate"; diagCount = 17; preCorrect = 6; postCorrect = 11 },
    @{ id = "xi_c_18"; name = "Muhammad Fatih Dafis Ramadhan"; jk = "L"; cluster = "focused"; diagCount = 11; preCorrect = 4; postCorrect = 10 },
    @{ id = "xi_c_19"; name = "Muhammad Razka Khadafi"; jk = "L"; cluster = "focused"; diagCount = 7; preCorrect = 3; postCorrect = 8 },
    @{ id = "xi_c_20"; name = "Muhammad Sulistiana Ramdani"; jk = "L"; cluster = "focused"; diagCount = 9; preCorrect = 4; postCorrect = 9 },
    @{ id = "xi_c_21"; name = "Muhammad Yaqhdan Rizki Ramadhan"; jk = "L"; cluster = "moderate"; diagCount = 13; preCorrect = 5; postCorrect = 10 },
    @{ id = "xi_c_23"; name = "Naila Putri Hidayat"; jk = "P"; cluster = "active"; diagCount = 24; preCorrect = 7; postCorrect = 12 },
    @{ id = "xi_c_24"; name = "Nida Rifda Maulidia"; jk = "P"; cluster = "moderate"; diagCount = 16; preCorrect = 5; postCorrect = 11 },
    @{ id = "xi_c_25"; name = "Raisya Aghniya Rizqi"; jk = "P"; cluster = "active"; diagCount = 21; preCorrect = 6; postCorrect = 12 },
    @{ id = "xi_c_26"; name = "Rizki Imam Addahiri"; jk = "L"; cluster = "focused"; diagCount = 10; preCorrect = 4; postCorrect = 9 }
)

# 2. DEFINISI SOAL PRE-TEST (FORM A - 12 BUTIR)
$preQuestions = @(
    @{ id = "PRE_Q01"; cId = "C01"; dom = "D1"; name = "Konsep Dasar"; correct = "B"; opts = @{ "A"="E1"; "B"="E0"; "C"="E1"; "D"="E2" } },
    @{ id = "PRE_Q02"; cId = "C02"; dom = "D1"; name = "Konsep Dasar"; correct = "B"; opts = @{ "A"="E1"; "B"="E0"; "C"="E3"; "D"="E2" } },
    @{ id = "PRE_Q03"; cId = "C03"; dom = "D2"; name = "Faktorisasi"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E1"; "D"="E3" } },
    @{ id = "PRE_Q04"; cId = "C04"; dom = "D2"; name = "Faktorisasi"; correct = "C"; opts = @{ "A"="E2"; "B"="E3"; "C"="E0"; "D"="E1" } },
    @{ id = "PRE_Q05"; cId = "C05"; dom = "D3"; name = "Rumus ABC"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E1"; "D"="E3" } },
    @{ id = "PRE_Q06"; cId = "C06"; dom = "D3"; name = "Rumus ABC"; correct = "B"; opts = @{ "A"="E2"; "B"="E0"; "C"="E1"; "D"="E3" } },
    @{ id = "PRE_Q07"; cId = "C07"; dom = "D4"; name = "Diskriminan"; correct = "C"; opts = @{ "A"="E3"; "B"="E2"; "C"="E0"; "D"="E1" } },
    @{ id = "PRE_Q08"; cId = "C08"; dom = "D4"; name = "Diskriminan"; correct = "B"; opts = @{ "A"="E1"; "B"="E0"; "C"="E2"; "D"="E3" } },
    @{ id = "PRE_Q09"; cId = "C09"; dom = "D5"; name = "Hubungan Akar"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E1"; "D"="E3" } },
    @{ id = "PRE_Q10"; cId = "C10"; dom = "D5"; name = "Hubungan Akar"; correct = "B"; opts = @{ "A"="E2"; "B"="E0"; "C"="E3"; "D"="E1" } },
    @{ id = "PRE_Q11"; cId = "C11"; dom = "D6"; name = "Penerapan"; correct = "B"; opts = @{ "A"="E1"; "B"="E0"; "C"="E2"; "D"="E3" } },
    @{ id = "PRE_Q12"; cId = "C12"; dom = "D6"; name = "Penerapan"; correct = "B"; opts = @{ "A"="E3"; "B"="E0"; "C"="E4"; "D"="E1" } }
)

# 3. DEFINISI SOAL POST-TEST (FORM B - 12 BUTIR)
$postQuestions = @(
    @{ id = "POST_Q01"; cId = "C01"; dom = "D1"; name = "Konsep Dasar"; correct = "C"; opts = @{ "A"="E1"; "B"="E1"; "C"="E0"; "D"="E2" } },
    @{ id = "POST_Q02"; cId = "C02"; dom = "D1"; name = "Konsep Dasar"; correct = "A"; opts = @{ "A"="E0"; "B"="E1"; "C"="E3"; "D"="E2" } },
    @{ id = "POST_Q03"; cId = "C03"; dom = "D2"; name = "Faktorisasi"; correct = "B"; opts = @{ "A"="E2"; "B"="E0"; "C"="E1"; "D"="E3" } },
    @{ id = "POST_Q04"; cId = "C04"; dom = "D2"; name = "Faktorisasi"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E3"; "D"="E1" } },
    @{ id = "POST_Q05"; cId = "C05"; dom = "D3"; name = "Rumus ABC"; correct = "C"; opts = @{ "A"="E2"; "B"="E1"; "C"="E0"; "D"="E3" } },
    @{ id = "POST_Q06"; cId = "C06"; dom = "D3"; name = "Rumus ABC"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E1"; "D"="E3" } },
    @{ id = "POST_Q07"; cId = "C07"; dom = "D4"; name = "Diskriminan"; correct = "B"; opts = @{ "A"="E3"; "B"="E0"; "C"="E2"; "D"="E1" } },
    @{ id = "POST_Q08"; cId = "C08"; dom = "D4"; name = "Diskriminan"; correct = "C"; opts = @{ "A"="E1"; "B"="E2"; "C"="E0"; "D"="E3" } },
    @{ id = "POST_Q09"; cId = "C09"; dom = "D5"; name = "Hubungan Akar"; correct = "B"; opts = @{ "A"="E2"; "B"="E0"; "C"="E1"; "D"="E3" } },
    @{ id = "POST_Q10"; cId = "C10"; dom = "D5"; name = "Hubungan Akar"; correct = "A"; opts = @{ "A"="E0"; "B"="E2"; "C"="E3"; "D"="E1" } },
    @{ id = "POST_Q11"; cId = "C11"; dom = "D6"; name = "Penerapan"; correct = "C"; opts = @{ "A"="E1"; "B"="E2"; "C"="E0"; "D"="E3" } },
    @{ id = "POST_Q12"; cId = "C12"; dom = "D6"; name = "Penerapan"; correct = "A"; opts = @{ "A"="E0"; "B"="E3"; "C"="E4"; "D"="E1" } }
)

# 4. TEMPLATE DATA DIAGNOSTIK BAKU (Q1 s/d Q24)
$diagTemplates = @{
    "Q1" = @{ dom = "D1 - Konsep Dasar"; err = "[E1] Miskonsepsi Identifikasi Koefisien"; ans = "b = 6, c = -5"; steps = "Persamaan: x^2 - 5x + 6 = 0 | b = 6, c = -5"; ev = "Siswa menulis koefisien b = 6 padahal persamaan x^2 - 5x + 6 = 0"; rem = "Tinjau kembali bentuk baku ax^2 + bx + c = 0 dan perhatikan tanda minus pada koefisien b." };
    "Q2" = @{ dom = "D1 - Konsep Dasar"; err = "[E1] Konseptual: Miskonsepsi Tanda Koefisien"; ans = "a = 3, b = 4, c = 8"; steps = "3x^2 - 4x - 8 = 0 | a = 3, b = 4, c = 8"; ev = "Siswa mengabaikan tanda negatif pada koefisien b dan konstanta c."; rem = "Tinjau kembali bahwa tanda negatif di depan angka merupakan bagian integral dari koefisien." };
    "Q3" = @{ dom = "D1 - Konsep Dasar"; err = "[E1] Konseptual: Koefisien Dianggap Akar Persamaan"; ans = "x1 = 5 dan x2 = 6"; steps = "x^2 - 5x + 6 = 0 | Karena ada angka 5 dan 6 maka akar-akarnya x = 5 dan x = 6."; ev = "Siswa langsung menyimpulkan akar persamaan adalah angka koefisien b dan c."; rem = "Akar persamaan kuadrat adalah nilai pengganti variabel x yang membuat persamaan bernilai nol, bukan koefisiennya." };
    "Q4" = @{ dom = "D1 - Konsep Dasar"; err = "[E3] Komputasi: Kekeliruan Operasi Kuadrat Negatif"; ans = "D = -25"; steps = "D = b^2 - 4ac = (-3)^2 - 4(1)(4) = -9 - 16 = -25"; ev = "Siswa menghitung (-3)^2 = -9 saat menguji diskriminan dasar."; rem = "Bilangan negatif berpangkat genap selalu menghasilkan bilangan positif: (-a)^2 = +a^2." };
    "Q5" = @{ dom = "D2 - Faktorisasi"; err = "[E0] Akurat / Solusi Tepat"; ans = "x = 3 atau x = 4"; steps = "x^2 - 7x + 12 = 0 | Cari p+q=-7 dan p*q=12 -> p=-3, q=-4 | (x - 3)(x - 4) = 0 | x = 3 atau x = 4"; ev = "Siswa memfaktorkan (x - 3)(x - 4) = 0 dan mencari pembuat nol secara benar."; rem = "Langkah pemfaktoran sempurna. Lanjutkan ke pemfaktoran a > 1." };
    "Q6" = @{ dom = "D2 - Faktorisasi"; err = "[E2] Prosedural: Tanda Faktor Terbalik"; ans = "x = -3 atau x = 4"; steps = "x^2 + x - 12 = 0 | (x + 3)(x - 4) = 0 | x = -3 atau x = 4"; ev = "Siswa menuliskan (x + 3)(x - 4) padahal seharusnya (x - 3)(x + 4)."; rem = "Uji kembali hasil perkalian suku tengah: (x+p)(x+q) = x^2 + (p+q)x + pq." };
    "Q7" = @{ dom = "D2 - Faktorisasi"; err = "[E2] Prosedural: Salah Pemfaktoran Koefisien a > 1"; ans = "x = 2 atau x = 5"; steps = "2x^2 + 7x + 3 = 0 | (2x + 1)(x + 3) = 0 | x = 2 atau x = 5"; ev = "Siswa tidak membagi hasil penguraian dengan koefisien a pada metode pemfaktoran silang."; rem = "Gunakan metode pengelompokan suku tengah untuk pemfaktoran ax^2 + bx + c dengan a > 1." };
    "Q8" = @{ dom = "D2 - Faktorisasi"; err = "[E1] Konseptual: Pelanggaran Sifat Perkalian Nol"; ans = "x = 5 (hanya 1 akar)"; steps = "x^2 - 5x = 0 | x^2 = 5x | Bagi x kedua ruas -> x = 5"; ev = "Siswa mencoret variabel x pada kedua ruas sehingga menghilangkan salah satu akar x = 0."; rem = "Jangan membagi kedua ruas dengan variabel x karena x bisa bernilai nol. Gunakan pemfaktoran x(ax + b) = 0." };
    "Q9" = @{ dom = "D3 - Rumus ABC"; err = "[E0] Akurat / Solusi Tepat"; ans = "x = 1 atau x = -5"; steps = "x = (-b +- sqrt(b^2 - 4ac)) / (2a) | x = (-4 +- sqrt(16 - 4(1)(-5))) / 2 | x = (-4 +- sqrt(36)) / 2 | x1 = 1, x2 = -5"; ev = "Substitusi rumus ABC tepat, evaluasi diskriminan dan pembagian 2a runtut."; rem = "Penguasaan rumus ABC sangat baik." };
    "Q10" = @{ dom = "D3 - Rumus ABC"; err = "[E3] Komputasi: Kesalahan Tanda pada Operasi -4ac"; ans = "x = (5 +- sqrt(-23)) / 4"; steps = "D = b^2 - 4ac = 25 - 4(2)(-3) = 25 - 24 = 1 tapi siswa menulis 25 - 48 = -23"; ev = "Siswa menghitung -4(2)(-3) = -24 padahal seharusnya +24."; rem = "Perkalian dua bilangan bertanda negatif menghasilkan bilangan positif: (-4) * (-c) = +4c." };
    "Q11" = @{ dom = "D3 - Rumus ABC"; err = "[E2] Prosedural: Lupa Membagi dengan 2a"; ans = "x = 6 +- 4"; steps = "x = -b +- sqrt(D) = 6 +- 4 = 10 atau 2 (lupa bagi 2a)"; ev = "Siswa hanya membagi bagian akar kuadrat atau lupa membagi seluruh pembilang dengan 2a."; rem = "Garis pembagi rumus kuadratik membentang sepanjang seluruh pembilang: (-b +- sqrt(D)) / (2a)." };
    "Q12" = @{ dom = "D3 - Rumus ABC"; err = "[E1] Konseptual: Substitusi Nilai -b Keliru"; ans = "x = (-6 +- 8) / 2"; steps = "b = -6 -> rumus -b ditulis -6 bukannya +6"; ev = "Siswa mensubstitusikan -b menjadi negatif padahal b sudah negatif (-(-b) = +b)."; rem = "Jika koefisien b bernilai negatif (-6), maka suku pertama rumus ABC menjadi -(-6) = +6." };
    "Q13" = @{ dom = "D4 - Diskriminan"; err = "[E0] Akurat / Solusi Tepat"; ans = "D = 0, mempunyai dua akar real kembar"; steps = "x^2 - 6x + 9 = 0 | D = (-6)^2 - 4(1)(9) = 36 - 36 = 0 | Karena D = 0 maka akar kembar real."; ev = "Menghitung D = 0 secara tepat dan menyimpulkan persamaan memiliki dua akar real kembar."; rem = "Analisis karakteristik diskriminan sangat baik." };
    "Q14" = @{ dom = "D4 - Diskriminan"; err = "[E1] Konseptual: Miskonsepsi Makna D < 0"; ans = "Akar-akarnya bernilai negatif"; steps = "D = -16 < 0 maka nilai x yang dihasilkan negatif semua."; ev = "Siswa menganggap D < 0 berarti akar-akarnya bernilai negatif real."; rem = "D < 0 mengindikasikan akar tidak real / imajiner (grafik tidak memotong sumbu X), bukan akar bernilai negatif." };
    "Q15" = @{ dom = "D4 - Diskriminan"; err = "[E2] Prosedural: Keliru Menentukan Syarat Parameter k"; ans = "k > 4 (seharusnya k < 4)"; steps = "D > 0 -> 16 - 4k > 0 -> -4k > -16 -> k > 4"; ev = "Siswa salah dalam membalik tanda pertidaksamaan saat membagi dengan koefisien negatif."; rem = "Ketika kedua ruas pertidaksamaan dibagi bilangan negatif, arah tanda pertidaksamaan harus dibalik." };
    "Q16" = @{ dom = "D4 - Diskriminan"; err = "[E3] Komputasi: Salah Hitung Kuadrat Variabel Parameter"; ans = "k = +- 6"; steps = "b = 2k -> b^2 ditulis 2k^2 bukannya 4k^2"; ev = "Siswa menghitung (2k)^2 menjadi 2k^2 bukan 4k^2."; rem = "Pangkat dua berlaku untuk koefisien dan variabel: (ck)^2 = c^2 * k^2." };
    "Q17" = @{ dom = "D5 - Hubungan Akar"; err = "[E0] Akurat / Solusi Tepat"; ans = "x1 + x2 = 5, x1 * x2 = 6"; steps = "x^2 - 5x + 6 = 0 | x1 + x2 = -(-5)/1 = 5 | x1 * x2 = 6/1 = 6"; ev = "Siswa menerapkan Teorema Vieta x1 + x2 = -b/a dan x1 * x2 = c/a secara sempurna."; rem = "Penguasaan Teorema Vieta sangat komprehensif." };
    "Q18" = @{ dom = "D5 - Hubungan Akar"; err = "[E2] Prosedural: Lupa Tanda Negatif pada Jumlah Akar"; ans = "x1 + x2 = -4"; steps = "x1 + x2 = b/a = -4/1 = -4 bukannya -b/a"; ev = "Siswa menghitung x1 + x2 = b/a (lupa tanda minus pada rumus Teorema Vieta)."; rem = "Rumus jumlah akar adalah x1 + x2 = -b/a (ada tanda negatif di depan pecahan)." };
    "Q19" = @{ dom = "D5 - Hubungan Akar"; err = "[E2] Prosedural: Salah Tanda Operasi Persamaan Baru"; ans = "x^2 + 5x - 6 = 0"; steps = "x^2 + (x1+x2)x + x1*x2 = 0 ditulis + bukannya -"; ev = "Siswa menggunakan tanda tambah sebelum suku tengah pada rumus pembentukan persamaan kuadrat."; rem = "Bentuk umum penyusunan persamaan kuadrat baru adalah x^2 - (x1 + x2)x + (x1 * x2) = 0." };
    "Q20" = @{ dom = "D5 - Hubungan Akar"; err = "[E1] Konseptual: Miskonsepsi Jumlah Kuadrat Akar"; ans = "x1^2 + x2^2 = (x1 + x2)^2"; steps = "x1^2 + x2^2 = 5^2 = 25 (lupa dikurangi 2x1x2)"; ev = "Siswa menganggap (a + b)^2 = a^2 + b^2 sehingga tidak mengurangkan 2x1x2."; rem = "Gunakan identitas aljabar kuadrat: x1^2 + x2^2 = (x1 + x2)^2 - 2(x1 * x2)." };
    "Q21" = @{ dom = "D6 - Penerapan"; err = "[E0] Akurat / Solusi Tepat"; ans = "Panjang = 10 m, Lebar = 6 m"; steps = "p = l + 4 | Luas = l(l + 4) = 60 | l^2 + 4l - 60 = 0 | (l + 10)(l - 6) = 0 | l = 6 (karena l > 0) | p = 10"; ev = "Pemodelan dan eliminasi nilai panjang fisis negatif sangat tepat."; rem = "Pemahaman pemodelan fisis sangat baik." };
    "Q22" = @{ dom = "D6 - Penerapan"; err = "[E4] Interpretasi: Tidak Mengeliminasi Nilai Negatif"; ans = "t = 4 detik atau t = -2 detik"; steps = "(t - 4)(t + 2) = 0 -> t = 4 atau t = -2. Siswa menulis kedua waktu tersebut."; ev = "Siswa menyertakan nilai waktu t = -2 detik yang secara fisis tidak memiliki arti matematis konteks nyata."; rem = "Ukuran waktu, panjang, atau dimensi fisis selalu bernilai non-negatif (t >= 0)." };
    "Q23" = @{ dom = "D6 - Penerapan"; err = "[E1] Konseptual: Salah Memodelkan Keliling Persegi Panjang"; ans = "x(28 - x) = 48"; steps = "Keliling 28 langsung dipakai tanpa dibagi 2: p + l = 28"; ev = "Siswa menganggap panjang + lebar = keliling, padahal seharusnya p + l = K / 2."; rem = "Keliling persegi panjang adalah 2(p + l), sehingga jumlah panjang dan lebar adalah setengah keliling (K/2)." };
    "Q24" = @{ dom = "D6 - Penerapan"; err = "[E1] Konseptual: Miskonsepsi Nilai Diskriminan Negatif"; ans = "Benar, akarnya negatif"; steps = "Karena D negatif maka akar-akar x juga bernilai negatif."; ev = "Siswa mengira nilai diskriminan negatif menghasilkan akar bilangan riil bertanda negatif."; rem = "D < 0 berarti persamaan kuadrat tidak mempunyai akar real (akarnya imajiner), bukan akarnya bernilai negatif." }
}

# =========================================================================
# 5. GENERASI DATA PRE-TEST (24 SISWA)
# =========================================================================
Write-Host "`n1. Menyiapkan dan Mengirim Data Pre-Test (24 Siswa)..."
$prePayloads = @()

for ($i = 0; $i -lt $students.Count; $i++) {
    $st = $students[$i]
    $attemptId = "att_pretest_1789456200_$($st.id)"
    
    # Jadwal pengiriman Pre-Test: 15 Sep & 16 Sep 2026
    $day = if ($i -lt 16) { 15 } else { 16 }
    $baseHour = if ($i -lt 8) { 8 } elseif ($i -lt 16) { 10 } else { 8 }
    $min = 10 + ($i % 8) * 6
    $sec = 12 + ($i * 7) % 45
    $duration = 750 + ($i * 29) % 360
    
    $utcHour = $baseHour - 7 # Convert WIB to UTC
    if ($utcHour -lt 0) { $utcHour += 24 }
    $createdAt = [DateTime]::new(2026, 9, $day, $utcHour, $min, $sec, [DateTimeKind]::Utc).ToString("o")
    
    # Generate responses
    $targetCorrect = $st.preCorrect
    $errDist = @{ "E0" = 0; "E1" = 0; "E2" = 0; "E3" = 0; "E4" = 0 }
    $domStats = @{
        "D1" = @{ correct = 0; total = 0 }; "D2" = @{ correct = 0; total = 0 };
        "D3" = @{ correct = 0; total = 0 }; "D4" = @{ correct = 0; total = 0 };
        "D5" = @{ correct = 0; total = 0 }; "D6" = @{ correct = 0; total = 0 }
    }
    
    $responses = @()
    $correctAssigned = 0
    
    for ($qIdx = 0; $qIdx -lt 12; $qIdx++) {
        $q = $preQuestions[$qIdx]
        $domStats[$q.dom].total++
        
        # Determine if this question is answered correctly
        $isCorr = $false
        if ($correctAssigned -lt $targetCorrect) {
            # Distribute correct answers across D1, D2, D3, D5
            if ($q.dom -in @("D1", "D2", "D5") -or ($correctAssigned + (12 - $qIdx) -le $targetCorrect)) {
                $isCorr = $true
                $correctAssigned++
            } elseif (($qIdx + $i) % 3 -eq 0) {
                $isCorr = $true
                $correctAssigned++
            }
        }
        
        if ($isCorr) {
            $userAns = $q.correct
            $errCode = "E0"
            $errDist["E0"]++
            $domStats[$q.dom].correct++
        } else {
            # Pick a distractor error option
            $distractors = $q.opts.Keys | Where-Object { $_ -ne $q.correct }
            $userAns = $distractors[($i + $qIdx) % $distractors.Count]
            $errCode = $q.opts[$userAns]
            $errDist[$errCode]++
        }
        
        $responses += @{
            questionId = $q.id
            competencyId = $q.cId
            domain = $q.dom
            domainName = $q.name
            userAnswer = $userAns
            correctAnswer = $q.correct
            isCorrect = $isCorr
            errorCode = $errCode
            timeSpentSeconds = 45 + (($i * 3 + $qIdx * 7) % 50)
        }
    }
    
    $domAcc = @{}
    foreach ($d in $domStats.Keys) {
        $tot = $domStats[$d].total
        $cor = $domStats[$d].correct
        $domAcc[$d] = if ($tot -gt 0) { [Math]::Round(($cor / $tot) * 100, 1) } else { 0 }
    }
    
    $acc = [Math]::Round(($correctAssigned / 12), 4)
    $sc = [Math]::Round(($correctAssigned / 12) * 100, 1)
    
    $prePayloads += @{
        attempt_id = $attemptId
        student_id = $st.id
        student_name = $st.name
        test_type = "pretest"
        test_form = "Form A"
        score = $sc
        accuracy = $acc
        correct_count = $correctAssigned
        total_questions = 12
        duration_seconds = $duration
        error_distribution = $errDist
        domain_accuracy = $domAcc
        responses = $responses
        created_at = $createdAt
    }
}

# Kirim Pre-Test ke Supabase
try {
    $preJson = $prePayloads | ConvertTo-Json -Depth 6
    $resPre = Invoke-RestMethod -Uri "$url/rest/v1/hasil_pre-test" -Headers $headers -Method Post -Body $preJson
    Write-Host " [OK] Berhasil mengunggah $($prePayloads.Count) data Pre-Test ke Supabase!"
} catch {
    Write-Host " [FAIL] Gagal Pre-Test: $($_.Exception.Message)"
}

# =========================================================================
# 6. GENERASI DATA DIAGNOSTIK (24 SISWA, VARIASI 7-24 BUTIR)
# =========================================================================
Write-Host "`n2. Menyiapkan dan Mengirim Data Diagnostik Pengerjaan Soal..."
$allDiagRows = @()

for ($i = 0; $i -lt $students.Count; $i++) {
    $st = $students[$i]
    $countToAnswer = $st.diagCount
    
    # Pilih nomor soal dari Q1 s/d Q24
    $answeredQuestionKeys = @()
    if ($countToAnswer -eq 24) {
        $answeredQuestionKeys = 1..24 | ForEach-Object { "Q$_" }
    } elseif ($countToAnswer -ge 20) {
        $answeredQuestionKeys = 1..$countToAnswer | ForEach-Object { "Q$_" }
    } else {
        # Ambil sampel soal yang mencakup D1, D2, D3, D4, D5, D6 secara terdistribusi
        $subset = @(1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 4, 8, 12, 16, 20, 24)
        $answeredQuestionKeys = $subset[0..($countToAnswer - 1)] | ForEach-Object { "Q$_" }
    }
    
    # Timestamp diagnostik: 17, 18, 19 September 2026
    $diagDay = 17 + ($i % 3)
    $startHour = 8 + ($i * 2) % 10
    
    for ($qNum = 0; $qNum -lt $answeredQuestionKeys.Count; $qNum++) {
        $qKey = $answeredQuestionKeys[$qNum]
        $tpl = $diagTemplates[$qKey]
        
        $diagMin = ($qNum * 12 + ($i * 3)) % 55
        $diagSec = ($qNum * 17 + ($i * 7)) % 55
        $diagUtcHour = $startHour - 7
        if ($diagUtcHour -lt 0) { $diagUtcHour += 24 }
        $diagTimestamp = [DateTime]::new(2026, 9, $diagDay, $diagUtcHour, $diagMin, $diagSec, [DateTimeKind]::Utc).ToString("o")
        
        # Tingkat akurasi dalam latihan adaptif: siswa aktif memiliki lebih banyak E0
        $isAccurate = $false
        if ($st.cluster -eq "active" -and (($qNum + $i) % 3 -ne 0)) {
            $isAccurate = $true
        } elseif ($st.cluster -eq "moderate" -and ($qNum % 2 -eq 0)) {
            $isAccurate = $true
        }
        
        $primaryError = if ($isAccurate) { "[E0] Akurat / Solusi Tepat" } else { $tpl.err }
        $secError = if ($isAccurate) { "-" } else { "none" }
        $confidence = if ($isAccurate) { 92 + ($qNum % 7) } else { 78 + ($qNum % 13) }
        $learningNeed = if ($isAccurate) { "Pemahaman konsep dan langkah aljabar sudah sangat baik." } else { $tpl.rem }
        
        $allDiagRows += @{
            student_id = $st.name
            question_id = $qKey
            domain = $tpl.dom
            primary_error = $primaryError
            secondary_error = $secError
            evidence = $tpl.ev
            confidence = $confidence
            learning_need = $learningNeed
            student_answer = $tpl.ans
            student_steps = $tpl.steps
            created_at = $diagTimestamp
        }
    }
}

Write-Host " Total respon diagnostik terkumpul: $($allDiagRows.Count) rekaman."
# Kirim dalam batch per 50 baris untuk efisiensi HTTP
$batchSize = 50
$totalBatches = [Math]::Ceiling($allDiagRows.Count / $batchSize)

for ($b = 0; $b -lt $totalBatches; $b++) {
    $startIndex = $b * $batchSize
    $currentCount = [Math]::Min($batchSize, $allDiagRows.Count - $startIndex)
    $chunk = $allDiagRows[$startIndex..($startIndex + $currentCount - 1)]
    
    try {
        $chunkJson = $chunk | ConvertTo-Json -Depth 4
        $resDiag = Invoke-RestMethod -Uri "$url/rest/v1/hasil_diagnosis" -Headers $headers -Method Post -Body $chunkJson
        Write-Host "  -> Batch $($b + 1)/$totalBatches ($($chunk.Count) baris) berhasil disimpan."
    } catch {
        Write-Host "  -> Batch $($b + 1) gagal: $($_.Exception.Message)"
    }
}

# =========================================================================
# 7. GENERASI DATA POST-TEST (24 SISWA, HASIL INTERVENSI REMEDIASI)
# =========================================================================
Write-Host "`n3. Menyiapkan dan Mengirim Data Post-Test (24 Siswa)..."
$postPayloads = @()

for ($i = 0; $i -lt $students.Count; $i++) {
    $st = $students[$i]
    $attemptId = "att_posttest_1789882200_$($st.id)"
    
    # Jadwal pengiriman Post-Test: 20 Sep & 21 Sep 2026
    $day = if ($i -lt 16) { 20 } else { 21 }
    $baseHour = if ($i -lt 8) { 8 } elseif ($i -lt 16) { 13 } else { 7 }
    $min = 15 + ($i % 8) * 5
    $sec = 10 + ($i * 9) % 48
    $duration = 680 + ($i * 23) % 250
    
    $utcHour = $baseHour - 7
    if ($utcHour -lt 0) { $utcHour += 24 }
    $createdAt = [DateTime]::new(2026, 9, $day, $utcHour, $min, $sec, [DateTimeKind]::Utc).ToString("o")
    
    # Generate responses
    $targetCorrect = $st.postCorrect
    $errDist = @{ "E0" = 0; "E1" = 0; "E2" = 0; "E3" = 0; "E4" = 0 }
    $domStats = @{
        "D1" = @{ correct = 0; total = 0 }; "D2" = @{ correct = 0; total = 0 };
        "D3" = @{ correct = 0; total = 0 }; "D4" = @{ correct = 0; total = 0 };
        "D5" = @{ correct = 0; total = 0 }; "D6" = @{ correct = 0; total = 0 }
    }
    
    $responses = @()
    $correctAssigned = 0
    
    for ($qIdx = 0; $qIdx -lt 12; $qIdx++) {
        $q = $postQuestions[$qIdx]
        $domStats[$q.dom].total++
        
        $isCorr = $false
        if ($correctAssigned -lt $targetCorrect) {
            # Siswa benar pada hampir seluruh soal setelah perlakuan diagnostik
            if ($correctAssigned + (12 - $qIdx) -le $targetCorrect -or ($qIdx -ne 6 -and $qIdx -ne 11)) {
                $isCorr = $true
                $correctAssigned++
            } elseif ($targetCorrect -eq 12) {
                $isCorr = $true
                $correctAssigned++
            }
        }
        
        if ($isCorr) {
            $userAns = $q.correct
            $errCode = "E0"
            $errDist["E0"]++
            $domStats[$q.dom].correct++
        } else {
            $distractors = $q.opts.Keys | Where-Object { $_ -ne $q.correct }
            $userAns = $distractors[($i + $qIdx) % $distractors.Count]
            $errCode = $q.opts[$userAns]
            $errDist[$errCode]++
        }
        
        $responses += @{
            questionId = $q.id
            competencyId = $q.cId
            domain = $q.dom
            domainName = $q.name
            userAnswer = $userAns
            correctAnswer = $q.correct
            isCorrect = $isCorr
            errorCode = $errCode
            timeSpentSeconds = 35 + (($i * 2 + $qIdx * 5) % 40)
        }
    }
    
    $domAcc = @{}
    foreach ($d in $domStats.Keys) {
        $tot = $domStats[$d].total
        $cor = $domStats[$d].correct
        $domAcc[$d] = if ($tot -gt 0) { [Math]::Round(($cor / $tot) * 100, 1) } else { 0 }
    }
    
    $acc = [Math]::Round(($correctAssigned / 12), 4)
    $sc = [Math]::Round(($correctAssigned / 12) * 100, 1)
    
    $postPayloads += @{
        attempt_id = $attemptId
        student_id = $st.id
        student_name = $st.name
        test_type = "posttest"
        test_form = "Form B"
        score = $sc
        accuracy = $acc
        correct_count = $correctAssigned
        total_questions = 12
        duration_seconds = $duration
        error_distribution = $errDist
        domain_accuracy = $domAcc
        responses = $responses
        created_at = $createdAt
    }
}

# Kirim Post-Test ke Supabase
try {
    $postJson = $postPayloads | ConvertTo-Json -Depth 6
    $resPost = Invoke-RestMethod -Uri "$url/rest/v1/hasil_post-test" -Headers $headers -Method Post -Body $postJson
    Write-Host " [OK] Berhasil mengunggah $($postPayloads.Count) data Post-Test ke Supabase!"
} catch {
    Write-Host " [FAIL] Gagal Post-Test: $($_.Exception.Message)"
}

Write-Host "`n=== PROSES INJEKSI DATA KE SUPABASE SELESAI DENGAN SUKSES! ==="
