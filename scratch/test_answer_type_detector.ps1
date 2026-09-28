# test_answer_type_detector.ps1 - Test AnswerTypeDetector Engine
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "ANSWER TYPE DETECTOR (EPE V3) VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Test($condition, [string]$testName, [string]$detail = "") {
    if ($condition) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "[FAIL] $testName : $detail" -ForegroundColor Red
        $script:failed++
    }
}

$root = if ($PSScriptRoot) { (Resolve-Path "$PSScriptRoot\..").Path } else { (Get-Location).Path }
$code = Get-Content (Join-Path $root "js\multimodal\answerTypeDetector.js") -Raw -Encoding UTF8

# 1. Structural Checks
Write-Host "`n--- 1. Class Structure & Method Exports ---" -ForegroundColor Yellow
Assert-Test ($code -match "export class AnswerTypeDetector") "AnswerTypeDetector class defined and exported"
Assert-Test ($code -match "static detect\(rawInput") "detect method defined"
Assert-Test ($code -match "matchMultipleChoice") "matchMultipleChoice defined"
Assert-Test ($code -match "matchMatrix") "matchMatrix defined"
Assert-Test ($code -match "matchMultiStep") "matchMultiStep defined"
Assert-Test ($code -match "matchNumeric") "matchNumeric defined"
Assert-Test ($code -match "matchEquation") "matchEquation defined"
Assert-Test ($code -match "matchWrittenExplanation") "matchWrittenExplanation defined"

# 2. Key Heuristics Checks
Write-Host "`n--- 2. Detection Heuristics Patterns ---" -ForegroundColor Yellow
Assert-Test ($code -match "multiple_choice" -and $code -match "numeric" -and $code -match "equation") "Covers standard algebraic answer types"
Assert-Test ($code -match "matrix" -and $code -match "multi_step_solution" -and $code -match "written_explanation") "Covers advanced multi-modal types"
Assert-Test ($code -match "\\begin\{(pmatrix|bmatrix") "LaTeX matrix regex pattern present"
Assert-Test ($code -match "fractionMatch") "Fraction numerical matching present"

Write-Host "`n===================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY: Total $($passed + $failed) | PASSED: $passed | FAILED: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "===================================================================" -ForegroundColor Cyan

if ($failed -eq 0) { exit 0 } else { exit 1 }
