param(
  [switch]$ToolsOnly
)

$ErrorActionPreference = 'Stop'

function Test-IsAdministrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-CommandExists([string]$CommandName) {
  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Assert-CommandExists([string]$CommandName, [string]$Message) {
  if (-not (Test-CommandExists $CommandName)) {
    throw $Message
  }
}

function Assert-LastExitCode([string]$FailureMessage) {
  if ($LASTEXITCODE -ne 0) {
    throw "$FailureMessage Exit code: $LASTEXITCODE."
  }
}

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machinePath;$userPath"
}

function Test-MinimumVersion([string]$ActualVersion, [string]$MinimumVersion) {
  return ([version]$ActualVersion) -ge ([version]$MinimumVersion)
}

function Install-WingetPackage([string]$PackageId, [string]$DisplayName) {
  Write-Step "Installing $DisplayName"
  & winget install --id $PackageId --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  Assert-LastExitCode "$DisplayName installation failed."
}

function Install-VisualStudioBuildTools {
  Write-Step "Installing Visual Studio 2026 Build Tools"

  $bootstrapperPath = Join-Path $env:TEMP 'vs_BuildTools_2026.exe'
  Invoke-WebRequest -Uri 'https://aka.ms/vs/18/release/vs_BuildTools.exe' -OutFile $bootstrapperPath

  $arguments = @(
    '--quiet',
    '--wait',
    '--norestart',
    '--nocache',
    '--installWhileDownloading',
    '--add', 'Microsoft.VisualStudio.Workload.VCTools',
    '--includeRecommended'
  )

  $process = Start-Process -FilePath $bootstrapperPath -ArgumentList $arguments -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Visual Studio Build Tools installer exited with code $($process.ExitCode)."
  }
}

function Get-NodeVersion {
  return (& node -p "process.versions.node").Trim()
}

function Get-NpmVersion {
  return (& npm --version).Trim()
}

function Get-PythonVersion {
  $versionText = (& py -3.12 --version) 2>$null
  if (-not $versionText) {
    $versionText = (& py --version)
  }
  return ($versionText -replace '^Python\s+', '').Trim()
}

function Get-PythonExecutable {
  $pythonExecutable = (& py -3.12 -c "import sys; print(sys.executable)") 2>$null
  if (-not $pythonExecutable) {
    $pythonExecutable = (& py -c "import sys; print(sys.executable)")
  }
  return $pythonExecutable.Trim()
}

function Find-VsWithCppTools {
  $vswherePath = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
  if (-not (Test-Path $vswherePath)) {
    return $null
  }

  $installationPath = (& $vswherePath -latest -products * -requires Microsoft.VisualStudio.Workload.VCTools -property installationPath).Trim()
  if ([string]::IsNullOrWhiteSpace($installationPath)) {
    return $null
  }

  return $installationPath
}

function Get-NdiRuntimePath {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'NDI\NDI 6 Runtime\Processing.NDI.Lib.x64.dll'),
    (Join-Path $env:ProgramFiles 'NDI\NDI 5 Runtime\Processing.NDI.Lib.x64.dll')
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  foreach ($segment in ($env:PATH -split ';')) {
    if ([string]::IsNullOrWhiteSpace($segment)) {
      continue
    }

    $candidate = Join-Path $segment 'Processing.NDI.Lib.x64.dll'
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Install-NdiRuntime {
  Write-Step "Installing NDI runtime"

  & winget install --id NewTek.NDI5Runtime --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Automatic NDI runtime install failed. Opening the official NDI tools page."
    Start-Process 'https://ndi.video/tools/'
    throw "NDI runtime installation failed. Exit code: $LASTEXITCODE."
  }
}

function Ensure-Environment {
  Assert-CommandExists winget "winget is required. Install Microsoft's App Installer first, then rerun this script."

  Install-WingetPackage -PackageId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'
  Install-WingetPackage -PackageId 'Python.Python.3.12' -DisplayName 'Python 3.12'
  Install-VisualStudioBuildTools
  Install-NdiRuntime
  Refresh-ProcessPath

  Assert-CommandExists node "Node.js installation was not detected after setup."
  Assert-CommandExists npm "npm installation was not detected after setup."
  Assert-CommandExists py "Python launcher was not detected after setup."

  $nodeVersion = Get-NodeVersion
  if (-not (Test-MinimumVersion -ActualVersion $nodeVersion -MinimumVersion '22.13.0')) {
    throw "Node.js $nodeVersion is too old. Node.js 22.13.0 or newer is required."
  }

  $pythonVersion = Get-PythonVersion
  if (-not (Test-MinimumVersion -ActualVersion $pythonVersion -MinimumVersion '3.12.0')) {
    throw "Python $pythonVersion is too old. Python 3.12 or newer is required."
  }

  $vsPath = Find-VsWithCppTools
  if (-not $vsPath) {
    throw 'Visual Studio Build Tools with the Desktop development with C++ workload were not detected.'
  }

  $ndiRuntimePath = Get-NdiRuntimePath
  if (-not $ndiRuntimePath) {
    throw 'NDI runtime was not detected. Install NDI Tools/Runtime, then rerun this script.'
  }

  $pythonExecutable = Get-PythonExecutable
  [Environment]::SetEnvironmentVariable('PYTHON', $pythonExecutable, 'User')

  Write-Step "Validated toolchain"
  Write-Host "Node.js: $nodeVersion"
  Write-Host "npm: $(Get-NpmVersion)"
  Write-Host "Python: $pythonVersion"
  Write-Host "Python executable: $pythonExecutable"
  Write-Host "Visual Studio: $vsPath"
  Write-Host "NDI runtime: $ndiRuntimePath"
}

if ($env:OS -ne 'Windows_NT') {
  throw 'This script only runs on Windows.'
}

if (-not (Test-IsAdministrator)) {
  $argumentList = @(
    '-ExecutionPolicy', 'Bypass',
    '-File', "`"$PSCommandPath`""
  )

  if ($ToolsOnly) {
    $argumentList += '-ToolsOnly'
  }

  $process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argumentList -Wait -PassThru
  exit $process.ExitCode
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Ensure-Environment

if ($ToolsOnly) {
  Write-Step 'Tools-only mode complete'
  exit 0
}

Write-Step 'Installing project dependencies'
& npm.cmd install
if ($LASTEXITCODE -ne 0) {
  throw "npm install failed with exit code $LASTEXITCODE."
}

Write-Step 'Building the NDI native addon'
& npm.cmd run build:ndi-native
if ($LASTEXITCODE -ne 0) {
  throw "npm run build:ndi-native failed with exit code $LASTEXITCODE."
}

Write-Step 'Windows native setup complete'
Write-Host 'Next step: npm run dev'
