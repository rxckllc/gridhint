$ErrorActionPreference = "Stop"
$gamesDir = "C:\Users\Admin\Downloads\lexical\daily-grid-help\src\app\(games)"
Set-Location $gamesDir

function Move-Overwrite {
    param($Source, $Dest)
    if (Test-Path $Source) {
        $destDir = Split-Path $Dest
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Dest -Force -Recurse
    }
}

Move-Overwrite "connections\hints\page.tsx" "connections-hints\page.tsx"
Remove-Item "connections\hints\page.tsx" -Force
if (Test-Path "connections-hint") { Remove-Item "connections-hint" -Recurse -Force }

Move-Overwrite "wordle\today\page.tsx" "wordle-hints\page.tsx"
if (Test-Path "wordle\today") { Remove-Item "wordle\today" -Recurse -Force }

Move-Overwrite "spelling-bee\today\page.tsx" "spelling-bee-answers\page.tsx"
if (Test-Path "spelling-bee\today") { Remove-Item "spelling-bee\today" -Recurse -Force }
if (Test-Path "spelling-bee-hints") { Remove-Item "spelling-bee-hints" -Recurse -Force }

Move-Overwrite "wordle\solver\page.tsx" "wordle-solver\page.tsx"
if (Test-Path "wordle\solver") { Remove-Item "wordle\solver" -Recurse -Force }

Move-Overwrite "spelling-bee\helper\page.tsx" "spelling-bee-helper\page.tsx"
if (Test-Path "spelling-bee\helper") { Remove-Item "spelling-bee\helper" -Recurse -Force }

if (Test-Path "unscramble\[letters]") {
    New-Item -ItemType Directory -Path "unscramble-letters\[letters]" -Force | Out-Null
    Copy-Item "unscramble\[letters]\*" "unscramble-letters\[letters]\" -Recurse -Force
}
Move-Overwrite "anagram-jumble\unscramble\page.tsx" "unscramble-letters\page.tsx"
if (Test-Path "anagram-jumble\unscramble") { Remove-Item "anagram-jumble\unscramble" -Recurse -Force }
if (Test-Path "unscramble") { Remove-Item "unscramble" -Recurse -Force }

Move-Overwrite "anagram-jumble\anagram-solver\page.tsx" "anagram-solver\page.tsx"
if (Test-Path "anagram-jumble\anagram-solver") { Remove-Item "anagram-jumble\anagram-solver" -Recurse -Force }

Move-Overwrite "anagram-jumble\word-descrambler\page.tsx" "word-descrambler\page.tsx"
if (Test-Path "anagram-jumble\word-descrambler") { Remove-Item "anagram-jumble\word-descrambler" -Recurse -Force }

Move-Overwrite "anagram-jumble\word-scrambler\page.tsx" "word-scrambler\page.tsx"
if (Test-Path "anagram-jumble\word-scrambler") { Remove-Item "anagram-jumble\word-scrambler" -Recurse -Force }

Move-Overwrite "crossword\solver\page.tsx" "crossword-solver\page.tsx"
if (Test-Path "crossword\solver") { Remove-Item "crossword\solver" -Recurse -Force }

Move-Overwrite "hangman\solver\page.tsx" "hangman-solver\page.tsx"
if (Test-Path "hangman\solver") { Remove-Item "hangman\solver" -Recurse -Force }

Move-Overwrite "word-ladder\solver\page.tsx" "word-ladder-solver\page.tsx"
if (Test-Path "word-ladder\solver") { Remove-Item "word-ladder\solver" -Recurse -Force }

Get-ChildItem -Recurse -File -Name