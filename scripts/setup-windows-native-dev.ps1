param(
  [switch]$ToolsOnly,
  [switch]$CheckOnly,
  [switch]$BuildNativeAddon
)

$ErrorActionPreference = 'Stop'
$MinimumNodeVersion = '22.13.0'
$MinimumPythonVersion = '3.12.0'
$MinimumNpmMajor = 10

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

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = "$machinePath;$userPath"
}

function Test-MinimumVersion([string]$ActualVersion, [string]$MinimumVersion) {
  return ([version]$ActualVersion) -ge ([version]$MinimumVersion)
}

function Get-NpmCommand {
  if (Test-CommandExists 'npm.cmd') {
    return 'npm.cmd'
  }

  if (Test-CommandExists 'npm') {
    return 'npm'
  }

  return $null
}

function Test-WingetPackageInstalled([string]$PackageId) {
  $output = (& winget list --id $PackageId --exact 2>&1 | Out-String)
  return $output -match [regex]::Escape($PackageId)
}

function Install-WingetPackage([string]$PackageId, [string]$DisplayName, [string]$OverrideArguments = '') {
  if (Test-WingetPackageInstalled $PackageId) {
    Write-Step "$DisplayName is already installed"
    return $true
  }

  Write-Step "Installing $DisplayName"
  $arguments = @(
    'install',
    '--id', $PackageId,
    '--exact',
    '--source', 'winget',
    '--silent',
    '--accept-package-agreements',
    '--accept-source-agreements'
  )

  if (-not [string]::IsNullOrWhiteSpace($OverrideArguments)) {
    $arguments += @('--override', $OverrideArguments)
  }

  & winget @arguments
  if ($LASTEXITCODE -eq 0) {
    return $true
  }

  # winget sometimes exits non-zero when package is already present/no upgrade.
  if (Test-WingetPackageInstalled $PackageId) {
    Write-Warning "$DisplayName install returned $LASTEXITCODE, but package is present."
    return $true
  }

  Write-Warning "$DisplayName installation failed. Exit code: $LASTEXITCODE."
  return $false
}

function Install-VisualStudioBuildTools {
  $override = '--wait --quiet --norestart --nocache --installWhileDownloading --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'
  $installed = Install-WingetPackage -PackageId 'Microsoft.VisualStudio.BuildTools' -DisplayName 'Visual Studio BuildTools 2026' -OverrideArguments $override
  if ($installed) {
    return
  }

  Write-Step 'Falling back to direct Visual Studio Build Tools installer'
  $bootstrapperPath = Join-Path $env:TEMP 'vs_BuildTools_2026.exe'
  Invoke-WebRequest -Uri 'https://aka.ms/vs/18/release/vs_BuildTools.exe' -OutFile $bootstrapperPath

  $arguments = @('--quiet', '--wait', '--norestart', '--nocache', '--installWhileDownloading', '--add', 'Microsoft.VisualStudio.Workload.VCTools', '--includeRecommended')
  $process = Start-Process -FilePath $bootstrapperPath -ArgumentList $arguments -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Visual Studio Build Tools installer exited with code $($process.ExitCode)."
  }
}

function Get-NodeVersion {
  return (& node -p "process.versions.node").Trim()
}

function Get-NpmVersion {
  $npmCommand = Get-NpmCommand
  if (-not $npmCommand) {
    return $null
  }

  return (& $npmCommand --version).Trim()
}

function Get-PythonExecutable {
  $configuredPython = [Environment]::GetEnvironmentVariable('PYTHON', 'User')
  if (-not [string]::IsNullOrWhiteSpace($configuredPython) -and (Test-Path $configuredPython)) {
    return $configuredPython
  }

  $candidates = @(
    (Join-Path $env:LocalAppData 'Programs\Python\Python312\python.exe'),
    (Join-Path $env:ProgramFiles 'Python312\python.exe'),
    (Join-Path $env:ProgramFiles 'Python311\python.exe')
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  if (Test-CommandExists 'py') {
    $pythonExecutable = (& py -3.12 -c "import sys; print(sys.executable)") 2>$null
    if ($pythonExecutable) {
      return $pythonExecutable.Trim()
    }

    $pythonExecutable = (& py -c "import sys; print(sys.executable)") 2>$null
    if ($pythonExecutable) {
      return $pythonExecutable.Trim()
    }
  }

  if (Test-CommandExists 'python') {
    $pythonExecutable = (& python -c "import sys; print(sys.executable)") 2>$null
    if ($pythonExecutable) {
      return $pythonExecutable.Trim()
    }
  }

  return $null
}

function Get-PythonVersion([string]$PythonExecutable) {
  if ([string]::IsNullOrWhiteSpace($PythonExecutable) -or -not (Test-Path $PythonExecutable)) {
    return $null
  }

  $versionText = (& $PythonExecutable --version) 2>&1
  if (-not $versionText) {
    return $null
  }

  return ($versionText -replace '^Python\s+', '').Trim()
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
  $configuredRuntimePath = [Environment]::GetEnvironmentVariable('CAST_NDI_RUNTIME_PATH', 'User')
  if (-not [string]::IsNullOrWhiteSpace($configuredRuntimePath) -and (Test-Path $configuredRuntimePath)) {
    return $configuredRuntimePath
  }

  $configuredRuntimeDir = [Environment]::GetEnvironmentVariable('NDI_RUNTIME_DIR', 'User')
  if (-not [string]::IsNullOrWhiteSpace($configuredRuntimeDir)) {
    $candidate = Join-Path $configuredRuntimeDir 'Processing.NDI.Lib.x64.dll'
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  $candidates = @(
    (Join-Path $env:ProgramFiles 'NDI\NDI 6 Runtime\Processing.NDI.Lib.x64.dll'),
    (Join-Path $env:ProgramFiles 'NDI\NDI 6 Tools\Runtime\Processing.NDI.Lib.x64.dll'),
    (Join-Path $env:ProgramFiles 'NDI\NDI 5 Runtime\Processing.NDI.Lib.x64.dll'),
    (Join-Path $env:ProgramFiles 'Renewed Vision\ProPresenter\Processing.NDI.Lib.x64.dll')
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
  $runtimePath = Get-NdiRuntimePath
  if ($runtimePath) {
    return $runtimePath
  }

  $runtimeInstalled = Install-WingetPackage -PackageId 'NDI.NDIRuntime' -DisplayName 'NDI Runtime'
  if ($runtimeInstalled) {
    Refresh-ProcessPath
    $runtimePath = Get-NdiRuntimePath
    if ($runtimePath) {
      return $runtimePath
    }
  }

  Write-Warning 'NDI runtime package did not yield a discoverable runtime DLL. Trying NDI Tools.'

  $toolsInstalled = Install-WingetPackage -PackageId 'NDI.NDITools' -DisplayName 'NDI Tools'
  if ($toolsInstalled) {
    Refresh-ProcessPath
    $runtimePath = Get-NdiRuntimePath
    if ($runtimePath) {
      return $runtimePath
    }
  }

  Write-Warning 'Automatic NDI installation could not provide Processing.NDI.Lib.x64.dll. Opening the official NDI tools page.'
  Start-Process 'https://ndi.video/tools/'
  throw 'NDI runtime was not detected after attempted installs. Install NDI Runtime/Tools manually, then rerun this script.'
}

function Get-ValidationReport {
  $nodeVersion = $null
  $nodeVersionValid = $false
  if (Test-CommandExists 'node') {
    $nodeVersion = Get-NodeVersion
    $nodeVersionValid = Test-MinimumVersion -ActualVersion $nodeVersion -MinimumVersion $MinimumNodeVersion
  }

  $npmVersion = Get-NpmVersion
  $npmVersionValid = $false
  if ($npmVersion) {
    $majorText = ($npmVersion -split '\.')[0]
    $npmVersionValid = [int]$majorText -ge $MinimumNpmMajor
  }

  $pythonExecutable = Get-PythonExecutable
  $pythonVersion = Get-PythonVersion -PythonExecutable $pythonExecutable
  $pythonVersionValid = $pythonVersion -and (Test-MinimumVersion -ActualVersion $pythonVersion -MinimumVersion $MinimumPythonVersion)

  $vsPath = Find-VsWithCppTools
  $vsValid = -not [string]::IsNullOrWhiteSpace($vsPath)

  $ndiRuntimePath = Get-NdiRuntimePath
  $ndiValid = -not [string]::IsNullOrWhiteSpace($ndiRuntimePath)

  return [pscustomobject]@{
    NodeVersion = $nodeVersion
    NodeVersionValid = $nodeVersionValid
    NpmVersion = $npmVersion
    NpmVersionValid = $npmVersionValid
    PythonExecutable = $pythonExecutable
    PythonVersion = $pythonVersion
    PythonVersionValid = $pythonVersionValid
    VisualStudioPath = $vsPath
    VisualStudioValid = $vsValid
    NdiRuntimePath = $ndiRuntimePath
    NdiRuntimeValid = $ndiValid
  }
}

function Show-ValidationReport([pscustomobject]$Report) {
  Write-Step 'Windows native environment report'
  Write-Host "Node.js: $($Report.NodeVersion)"
  Write-Host "npm: $($Report.NpmVersion)"
  Write-Host "Python: $($Report.PythonVersion)"
  Write-Host "Python executable: $($Report.PythonExecutable)"
  Write-Host "Visual Studio C++ workload: $($Report.VisualStudioPath)"
  Write-Host "NDI runtime: $($Report.NdiRuntimePath)"
}

function Assert-ValidationReport([pscustomobject]$Report) {
  if (-not $Report.NodeVersionValid) {
    throw "Node.js $($Report.NodeVersion) is too old or unavailable. Node.js $MinimumNodeVersion or newer is required."
  }

  if (-not $Report.NpmVersionValid) {
    throw "npm $($Report.NpmVersion) is too old or unavailable. npm $MinimumNpmMajor or newer is required."
  }

  if (-not $Report.PythonVersionValid) {
    throw "Python $($Report.PythonVersion) is too old or unavailable. Python $MinimumPythonVersion or newer is required."
  }

  if (-not $Report.VisualStudioValid) {
    throw 'Visual Studio Build Tools with the Desktop development with C++ workload were not detected.'
  }

  if (-not $Report.NdiRuntimeValid) {
    throw 'NDI runtime was not detected. Ensure Processing.NDI.Lib.x64.dll is installed and discoverable.'
  }
}

function Ensure-Environment {
  if (-not (Test-CommandExists 'winget')) {
    throw "winget is required. Install Microsoft's App Installer first, then rerun this script."
  }

  Install-WingetPackage -PackageId 'OpenJS.NodeJS.LTS' -DisplayName 'Node.js LTS'
  Install-WingetPackage -PackageId 'Python.Python.3.12' -DisplayName 'Python 3.12'
  Install-VisualStudioBuildTools
  $ndiRuntimePath = Install-NdiRuntime
  Refresh-ProcessPath

  $pythonExecutable = Get-PythonExecutable
  if (-not $pythonExecutable) {
    throw 'Python executable could not be detected after setup.'
  }

  $env:PYTHON = $pythonExecutable
  [Environment]::SetEnvironmentVariable('PYTHON', $pythonExecutable, 'User')
  $env:CAST_NDI_RUNTIME_PATH = $ndiRuntimePath
  [Environment]::SetEnvironmentVariable('CAST_NDI_RUNTIME_PATH', $ndiRuntimePath, 'User')
  [Environment]::SetEnvironmentVariable('NDI_RUNTIME_DIR', (Split-Path -Parent $ndiRuntimePath), 'User')

  $report = Get-ValidationReport
  Assert-ValidationReport -Report $report
  Show-ValidationReport -Report $report
}

if ($env:OS -ne 'Windows_NT') {
  throw 'This script only runs on Windows.'
}

if ($CheckOnly) {
  Refresh-ProcessPath
  $report = Get-ValidationReport
  Show-ValidationReport -Report $report
  Assert-ValidationReport -Report $report

  if ($BuildNativeAddon) {
    Write-Step 'Building the NDI native addon for verification'
    $npmCommand = Get-NpmCommand
    if (-not $npmCommand) {
      throw 'npm was not detected in PATH.'
    }

    $env:PYTHON = $report.PythonExecutable
    $env:CAST_NDI_RUNTIME_PATH = $report.NdiRuntimePath
    & $npmCommand run build:ndi-native
    if ($LASTEXITCODE -ne 0) {
      throw "npm run build:ndi-native failed with exit code $LASTEXITCODE."
    }
  }

  Write-Step 'Check-only mode complete'
  exit 0
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
if (-not $env:PYTHON) {
  $env:PYTHON = [Environment]::GetEnvironmentVariable('PYTHON', 'User')
}
& npm.cmd run build:ndi-native
if ($LASTEXITCODE -ne 0) {
  throw "npm run build:ndi-native failed with exit code $LASTEXITCODE."
}

Write-Step 'Windows native setup complete'
Write-Host 'Next step: npm run dev'
