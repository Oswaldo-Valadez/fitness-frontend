$ErrorActionPreference = 'Stop'

function Invoke-VerifyStep {
    param([string]$Command)

    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

Invoke-VerifyStep 'npm run lint'
Invoke-VerifyStep 'npm run build'
