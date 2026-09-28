# test_creative_widget.ps1 - Test Verification for Creative Header Widget

$passed = 0
$failed = 0

function Assert-Test([bool]$condition, [string]$msg) {
  if ($condition) {
    Write-Host "[PASS] $msg" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:failed++
  }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "VERIFYING CREATIVE HEADER WIDGET (CLOCK, STOPWATCH, STATS)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$html = Get-Content "index.html" -Raw
$css = Get-Content "css/style.css" -Raw
$app = Get-Content "js/app.js" -Raw
$widget = Get-Content "js/ui/headerCreativeWidget.js" -Raw

# 1. HTML Markup Check
Assert-Test ($html -match 'id="header-creative-left"') "index.html has header-creative-left container"
Assert-Test ($html -match 'id="widget-live-clock-card"') "index.html has widget-live-clock-card"
Assert-Test ($html -match 'id="widget-clock-display"') "index.html has widget-clock-display element"
Assert-Test ($html -match 'id="widget-session-timer"') "index.html has widget-session-timer element"
Assert-Test ($html -match 'id="widget-learning-stats-card"') "index.html has widget-learning-stats-card"
Assert-Test ($html -match 'id="widget-cubes-count"') "index.html has widget-cubes-count element"
Assert-Test ($html -match 'id="widget-motivation-quote"') "index.html has widget-motivation-quote element"
Assert-Test ($html -match 'id="header-action-tools"[^>]*flex-nowrap') "index.html has header-action-tools with flex-nowrap"
Assert-Test ($html -match 'id="header-avatar-pill"[^>]*shrink-0') "index.html has header-avatar-pill with shrink-0"
Assert-Test ($html -match 'id="header-motivation-strip"') "index.html has header-motivation-strip centered bottom row"
Assert-Test ($html -match 'id="header-quote-banner"') "index.html has header-quote-banner for full text display"

# 2. JS Module Implementation Check
Assert-Test ($widget -match 'class HeaderCreativeWidget') "headerCreativeWidget.js exports HeaderCreativeWidget class"
Assert-Test ($widget -match 'startClockAndTimer') "HeaderCreativeWidget implements live clock and study session stopwatch"
Assert-Test ($widget -match 'startQuoteRotator') "HeaderCreativeWidget implements rotating motivation quote"
Assert-Test ($widget -match 'updateCubeStats') "HeaderCreativeWidget synchronizes learning cubes count"
Assert-Test ($widget -match 'Imam Syafi''i') "HeaderCreativeWidget has authentic Imam Syafi'i quote"
Assert-Test ($widget -match 'Malcolm X') "HeaderCreativeWidget has authentic Malcolm X quote"
Assert-Test ($app -match 'HeaderCreativeWidget') "app.js imports and initializes HeaderCreativeWidget"

# 3. CSS Styling Check
Assert-Test ($css -match '\.creative-header-card') "style.css has .creative-header-card styles"
Assert-Test ($css -match 'body:not\(\.theme-dark\)\s+\.creative-header-card#widget-live-clock-card') "style.css has light mode rules for live clock card"
Assert-Test ($css -match 'body\.theme-dark\s+\.creative-header-card#widget-live-clock-card') "style.css has dark mode rules for live clock card"
Assert-Test ($css -match '#header-action-tools\s*\{[^}]*flex-wrap:\s*nowrap') "style.css enforces flex-wrap nowrap on header-action-tools"
Assert-Test ($css -match '#header-avatar-pill\s*\{[^}]*flex-shrink:\s*0') "style.css enforces flex-shrink 0 on header-avatar-pill"
Assert-Test ($css -match 'body\.nav-pos-sidebar #header-action-tools') "style.css locks header-action-tools in sidebar (pojok) layout"
Assert-Test ($css -match 'body\.nav-pos-bottom #header-action-tools') "style.css locks header-action-tools in bottom (bawah) layout"
Assert-Test ($css -match '#header-motivation-strip\s*\{[^}]*justify-content:\s*center') "style.css centers header-motivation-strip exactly in the middle"

Write-Host "`n----------------------------------------------------------"
Write-Host "Total Tests: $($passed + $failed) | Passed: $passed | Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
  Write-Host "ALL CREATIVE HEADER WIDGET TESTS PASSED!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "SOME TESTS FAILED." -ForegroundColor Red
  exit 1
}
