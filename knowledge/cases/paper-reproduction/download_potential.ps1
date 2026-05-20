$ErrorActionPreference = 'Stop'
try {
    $url = 'https://www.ctcms.nist.gov/potentials/atomistic/Ti-Al/Zope_Mishin_2003/TiAl.eam.fs'
    $out = 'F:\opencode\claude-code-main\claude-code-main\knowledge\cases\paper-reproduction\TiAl.eam.fs'
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 20
    Write-Host 'SUCCESS'
} catch {
    Write-Host "FAILED: $($_.Exception.Message)"
}
