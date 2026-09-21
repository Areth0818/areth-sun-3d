param(
    [string]$Action = "test"
)

# 短縮パス (8.3形式) を取得して文字化けを完全に防止
$fso = New-Object -ComObject Scripting.FileSystemObject
$homeShort = $fso.GetFolder($env:USERPROFILE).ShortPath
$scratchDir = "$homeShort\.gemini\antigravity\brain\441a0ae5-9284-4d47-9ce9-4fb1af1e1bb6\scratch"
$workspaceDir = $PSScriptRoot | Split-Path -Parent

Write-Host "ScratchDir (ShortPath): $scratchDir"

if ($Action -eq "test") {
    robocopy $workspaceDir $scratchDir /MIR /XD node_modules dist .git /XF *.log | Out-Null
    Set-Location $scratchDir
    npx vitest run
}
elseif ($Action -eq "build") {
    robocopy $workspaceDir $scratchDir /MIR /XD node_modules dist .git /XF *.log | Out-Null
    Set-Location $scratchDir
    npm run build
    $distSrc = Join-Path $scratchDir "dist"
    $distDest = Join-Path $workspaceDir "dist"
    if (Test-Path $distSrc) {
        robocopy $distSrc $distDest /MIR | Out-Null
        Write-Host "dist synced successfully!"
    }
}
elseif ($Action -eq "preview") {
    Set-Location $scratchDir
    Write-Host "Starting Vite preview server..."
    npx vite preview --host 127.0.0.1 --port 4173
}
elseif ($Action -eq "dev") {
    robocopy $workspaceDir $scratchDir /MIR /XD node_modules dist .git /XF *.log | Out-Null
    Set-Location $scratchDir
    Write-Host "Starting Vite dev server..."
    npx vite --host 127.0.0.1 --port 5173
}
