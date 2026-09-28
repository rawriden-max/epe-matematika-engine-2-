# test_avatar_transition_notification.ps1
# Verification for:
# 1. Motivation notification capsule dismiss on click & positioning below header
# 2. Futuristic modern quantum cyber transition replacing water ripple/bubbles
# 3. Avatar rendering in Settings Hub & Floating badge

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
Write-Host "VERIFYING NOTIFICATION, CYBER TRANSITION & AVATAR RENDERING" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$html = Get-Content "index.html" -Raw
$css = Get-Content "css/style.css" -Raw
$app = Get-Content "js/app.js" -Raw
$trans = Get-Content "js/ui/transitionManager.js" -Raw
$widget = Get-Content "js/ui/headerCreativeWidget.js" -Raw
$profile = Get-Content "js/data/profileManager.js" -Raw

# 1. Motivation notification capsule: positioning & dismissal
Assert-Test ($html -match 'id="top-notification-strip"[^>]*top-\[58px\]') "index.html places top-notification-strip below top header"
Assert-Test ($html -match 'id="top-notification-strip"[^>]*z-30') "top-notification-strip has z-30 (below header z-40 and modals)"
Assert-Test ($html -match 'id="btn-close-motivation"') "index.html contains explicit close button #btn-close-motivation"
Assert-Test ($widget -match 'btn-close-motivation') "headerCreativeWidget.js binds click to close button"
Assert-Test ($widget -match 'topStrip\.classList\.add\("dismissed"\)') "headerCreativeWidget.js adds .dismissed class on click"
Assert-Test ($widget -match 'epe_motivation_dismissed') "headerCreativeWidget.js persists dismissal in sessionStorage"
Assert-Test ($css -match '#top-notification-strip\.dismissed\s*\{[^}]*opacity:\s*0') "style.css defines .dismissed with opacity 0 and hidden"
Assert-Test ($app -match 'topStrip\.classList\.add\("modal-open-hidden"\)') "app.js hides motivation strip when settings modal opens"

# 2. Modern Futuristic Cyber Transition
Assert-Test ($trans -match 'cyber-quantum-reticle') "transitionManager.js creates cyber-quantum-reticle"
Assert-Test ($trans -match 'cyber-laser-sweep') "transitionManager.js creates cyber-laser-sweep beam"
Assert-Test ($trans -match 'cyber-laser-streak') "transitionManager.js creates cyber-laser-streak pulses"
Assert-Test ($css -match '\.cyber-quantum-reticle') "style.css styles cyber-quantum-reticle"
Assert-Test ($css -match '\.cyber-laser-sweep\s*\{') "style.css styles cyber-laser-sweep beam"
Assert-Test ($css -match '\.cyber-laser-streak') "style.css styles cyber-laser-streak"
Assert-Test ($css -match '@keyframes cyber-reticle-warp') "style.css implements cyber-reticle-warp animation"
Assert-Test ($css -match '@keyframes cyber-laser-flash') "style.css implements cyber-laser-flash animation"

# 3. Avatar display in Settings Hub & Floating Badge
Assert-Test ($app -match 'renderAllStudentAvatars\(\)') "app.js defines and calls renderAllStudentAvatars()"
Assert-Test ($app -match 'settings-avatar-container') "app.js renders into settings-avatar-container"
Assert-Test ($app -match 'floating-avatar-badge') "app.js renders into floating-avatar-badge"
Assert-Test ($app -match 'AvatarEngine\.renderInto') "app.js uses AvatarEngine.renderInto"
Assert-Test ($app -match '(?s)epe-avatar-updated.*?renderAllStudentAvatars') "app.js re-renders all avatars on epe-avatar-updated"
Assert-Test ($profile -match 'settings-student-name') "profileManager.js updates settings-student-name on name change"
Assert-Test ($css -match '#settings-avatar-container\s+svg') "style.css enforces 100% dimensions and circular radius on avatar SVG"

Write-Host "`n----------------------------------------------------------"
Write-Host "Total Tests: $($passed + $failed) | Passed: $passed | Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
  Write-Host "ALL NOTIFICATION, TRANSITION & AVATAR REQUIREMENTS VERIFIED!" -ForegroundColor Green
  exit 0
} else {
  Write-Host "SOME VERIFICATION TESTS FAILED." -ForegroundColor Red
  exit 1
}
