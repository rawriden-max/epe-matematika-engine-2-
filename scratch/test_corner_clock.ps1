# test_corner_clock.ps1 - Automated Verification for Corner/Sidebar Clock & Multi-Mode Toggle

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
Write-Host "VERIFYING CORNER / SIDEBAR CLOCK & MULTI-MODE TIME TOGGLE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$html = Get-Content "index.html" -Raw
$css = Get-Content "css/style.css" -Raw
$app = Get-Content "js/app.js" -Raw
$widget = Get-Content "js/ui/headerCreativeWidget.js" -Raw

# 1. HTML Verification for Sidebar Clock Card
Assert-Test ($html -match 'id="sidebar-live-clock-card"') "index.html has sidebar-live-clock-card in epe-sidebar-nav"
Assert-Test ($html -match 'id="sidebar-clock-display"') "index.html has sidebar-clock-display"
Assert-Test ($html -match 'id="sidebar-clock-suffix"') "index.html has sidebar-clock-suffix"
Assert-Test ($html -match 'id="sidebar-session-timer"') "index.html has sidebar-session-timer"

# 2. JS HeaderCreativeWidget Implementation Verification
Assert-Test ($widget -match 'sidebarClockCard\s*=\s*document\.getElementById\("sidebar-live-clock-card"\)') "headerCreativeWidget binds sidebarClockCard"
Assert-Test ($widget -match 'sidebarClockDisplay\s*=\s*document\.getElementById\("sidebar-clock-display"\)') "headerCreativeWidget binds sidebarClockDisplay"
Assert-Test ($widget -match 'sidebarClockSuffix\s*=\s*document\.getElementById\("sidebar-clock-suffix"\)') "headerCreativeWidget binds sidebarClockSuffix"
Assert-Test ($widget -match 'sidebarSessionTimer\s*=\s*document\.getElementById\("sidebar-session-timer"\)') "headerCreativeWidget binds sidebarSessionTimer"
Assert-Test ($widget -match 'toggleClockMode') "headerCreativeWidget implements toggleClockMode"
Assert-Test ($widget -match '"wita"') "headerCreativeWidget supports WITA mode"
Assert-Test ($widget -match '"wit"') "headerCreativeWidget supports WIT mode"
Assert-Test ($widget -match 'bindClockCard\(this\.sidebarClockCard\)') "headerCreativeWidget binds click/keyboard events to sidebarClockCard"
Assert-Test ($widget -match 'bindClockCard\(this\.clockCard\)') "headerCreativeWidget binds click/keyboard events to header clockCard"
Assert-Test ($widget -match 'NotificationToast') "headerCreativeWidget announces time mode change via toast"

# 3. CSS Verification
Assert-Test ($css -match '\.creative-header-card#sidebar-live-clock-card') "style.css has rules for sidebar-live-clock-card"
Assert-Test ($css -match '#sidebar-live-clock-card:active') "style.css has active scaling feedback for sidebar clock"
Assert-Test ($css -match 'touch-action:\s*manipulation') "style.css ensures fast touch manipulation for clocks"

# 4. App Nav Layout Integration
Assert-Test ($app -match 'headerCreativeWidget\.tick\(\)') "app.js synchronizes clock immediately on nav layout switch"

Write-Host "`n----------------------------------------------------------"
Write-Host "Total Tests: $($passed + $failed) | Passed: $passed | Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
  Write-Host "ALL CORNER CLOCK TESTS PASSED!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "SOME TESTS FAILED." -ForegroundColor Red
  exit 1
}
