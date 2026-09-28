# test_creator_antidetector.ps1 - Test Creator Anti-Detector & Futuristic SVG Iconography

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "CREATOR ANTI-DETECTOR AND FUTURISTIC SVG ICONS VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Test($condition, [string]$testName, [string]$detail = "") {
    $boolCondition = $false
    if ($condition -is [bool]) {
        $boolCondition = $condition
    } elseif ($null -ne $condition) {
        $boolCondition = [bool]$condition
    }

    if ($boolCondition) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $testName : $detail" -ForegroundColor Red
        $script:failed++
    }
}

$root = if ($PSScriptRoot) { (Resolve-Path "$PSScriptRoot\..").Path } else { (Get-Location).Path }

# 1. Check Creator Identifiers & Whitelist
Write-Host "`n--- 1. Creator Whitelist and Anti-Detector Engine ---" -ForegroundColor Yellow

$detectorCode = Get-Content (Join-Path $root "js\services\integrityDetector.js") -Raw -Encoding UTF8

Assert-Test ($detectorCode -match "CREATOR_IDENTIFIERS") "CREATOR_IDENTIFIERS defined in IntegrityDetector"
Assert-Test ($detectorCode -match '"mr\. ilyas"' -and $detectorCode -match '"muhammad ilyas"' -and $detectorCode -match '"kreator"') "Whitelist covers mr. ilyas, muhammad ilyas, creator, kreator"
Assert-Test ($detectorCode -match "isAntiDetectorActive") "isAntiDetectorActive method defined"
Assert-Test ($detectorCode -match "setAntiDetector") "setAntiDetector method defined"
Assert-Test ($detectorCode -match "isCreator") "isCreator method defined"
Assert-Test ($detectorCode -match "isCreatorBypass") "isCreatorBypass telemetry flag defined"
Assert-Test ($detectorCode -match 'reviewStatus\s*=\s*"reviewed_normal"') "Creator sessions automatically verified as normal reviewStatus"

# 2. Check Interactive UI Toggle & Badges in Dashboard
Write-Host "`n--- 2. Integrity Dashboard Creator Controls ---" -ForegroundColor Yellow

$dashCode = Get-Content (Join-Path $root "js\ui\integrityDashboardUI.js") -Raw -Encoding UTF8

Assert-Test ($dashCode -match 'id="btn-toggle-creator-antidetector"') "Dashboard has Creator Anti-Detector toggle button in header"
Assert-Test ($dashCode -match "btn-toggle-creator-antidetector") "Dashboard binds click listener to toggle Anti-Detector mode"
Assert-Test ($dashCode -match "CREATOR") "Dashboard renders CREATOR badge on table and modal"
Assert-Test ($dashCode -match "Creator Anti-Detector Bypass") "Dashboard displays Creator Anti-Detector status in modal"

# 3. Check Minimalist Futuristic SVG Icons in Question Bank
Write-Host "`n--- 3. Futuristic Minimalist SVG Icons in Question Bank ---" -ForegroundColor Yellow

$qbankCode = Get-Content (Join-Path $root "js\ui\questionBankUI.js") -Raw -Encoding UTF8

Assert-Test ($qbankCode -match 'data-action="preview"') "Preview action button intact"
Assert-Test ($qbankCode -match 'data-action="edit"') "Edit action button intact"
Assert-Test ($qbankCode -match 'data-action="duplicate"') "Duplicate action button intact"
Assert-Test ($qbankCode -match 'data-action="delete"') "Delete action button intact"
Assert-Test ($qbankCode -match 'viewBox="0 0 24 24"') "QuestionBankUI uses vector SVG viewBox"

# 4. Check Subject Registry SVG Icons
Write-Host "`n--- 4. Multi-Subject Futuristic SVG Icons ---" -ForegroundColor Yellow

$subjCode = Get-Content (Join-Path $root "js\engine\universal\subjectRegistry.js") -Raw -Encoding UTF8

Assert-Test ($subjCode -match 'svgIcon:\s*`<svg') "Subject definitions contain futuristic svgIcon"
Assert-Test ($subjCode -match "getSubjectSvg") "SubjectRegistry provides getSubjectSvg helper"

# 5. Check index.html Minimalist Futuristic Navigation
Write-Host "`n--- 5. Minimalist Futuristic Navigation and Brand in index.html ---" -ForegroundColor Yellow

$htmlCode = Get-Content (Join-Path $root "index.html") -Raw -Encoding UTF8

Assert-Test ($htmlCode -match "polygon points=.12,2 22,8.5") "Brand emblem upgraded with futuristic isometric cube SVG"
Assert-Test ($htmlCode -match 'subtab-btn-research-epe' -and $htmlCode -match 'subtab-btn-research-qbank' -and $htmlCode -match 'subtab-btn-research-integrity') "All 3 research subtabs present"
Assert-Test ($htmlCode -match 'btn-export-combined-csv') "Combined Dataset CSV export present"

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY: Total $($passed + $failed) | PASSED: $passed | FAILED: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "===================================================================" -ForegroundColor Cyan

if ($failed -eq 0) { exit 0 } else { exit 1 }
