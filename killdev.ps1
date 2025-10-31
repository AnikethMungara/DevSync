<#
.SYNOPSIS
  Kill common development servers (Node/Vite/Next) on Windows using PowerShell.

.DESCRIPTION
  Scans for processes listening on common development ports and for common
  process names (node, pnpm, yarn, npm), then stops those processes.

.PARAMETER DryRun
  Show what would be killed but do not terminate processes.

.PARAMETER Yes
  Do not prompt for confirmation; kill immediately.

.PARAMETER Ports
  Array of ports to check (defaults: 3000,5173,3001,8000,5000,4200,9229).

.PARAMETER Names
  Process names to look for (defaults: node, pnpm, yarn, npm).

.EXAMPLE
  .\\killdev.ps1 -DryRun

.EXAMPLE
  .\\killdev.ps1 -Yes
#>

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$Yes,
    [int[]]$Ports = @(3000,5173,3001,8000,5000,4200,9229),
    [string[]]$Names = @('node','pnpm','yarn','npm')
)

function Get-PidsByPort {
    param([int]$Port)
    try {
        # Get-NetTCPConnection is available on modern Windows; filter Listening sockets
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        $conns | Select-Object -ExpandProperty OwningProcess -Unique
    } catch {
        # Fallback: use netstat and parse output
        $out = & netstat -ano 2>$null | Select-String ":$Port\b"
        if (-not $out) { return @() }
        $pids = $out -split "`n" | ForEach-Object {
            ($_ -split '\\s+')[-1]
        } | Select-Object -Unique
        return $pids
    }
}

function Get-PidsByName {
    param([string]$Name)
    try {
        $procs = Get-Process -Name $Name -ErrorAction SilentlyContinue
        if ($procs) { $procs.Id }
        else { @() }
    } catch {
        @()
    }
}

# Collect PIDs found by ports
$found = @()
Write-Host "Checking ports: $($Ports -join ', ')" -ForegroundColor Cyan
foreach ($p in $Ports) {
    $pids = Get-PidsByPort -Port $p
    if ($pids) { $found += $pids }
}

# Collect PIDs by common process name
Write-Host "Checking process names: $($Names -join ', ')" -ForegroundColor Cyan
foreach ($n in $Names) {
    $pids = Get-PidsByName -Name $n
    if ($pids) { $found += $pids }
}

# Unique and numeric
$unique = $found | ForEach-Object { [int]$_ } | Sort-Object -Unique
if (-not $unique) {
    Write-Host "No matching dev server processes found." -ForegroundColor Green
    exit 0
}

# Map PIDs to process info
$procInfo = @()
foreach ($id in $unique) {
    try {
        $p = Get-Process -Id $id -ErrorAction Stop
        $procInfo += [PSCustomObject]@{
            Id = $p.Id
            Name = $p.ProcessName
            Path = ($p.Path -as [string])
        }
    } catch {
        # process may have exited already
        $procInfo += [PSCustomObject]@{
            Id = $id
            Name = '<exited>'
            Path = ''
        }
    }
}

Write-Host "Found processes:" -ForegroundColor Yellow
$procInfo | Format-Table Id, Name, Path -AutoSize

if ($DryRun) {
    Write-Host "Dry run: no processes will be terminated." -ForegroundColor Magenta
    exit 0
}

if (-not $Yes) {
    $answer = Read-Host "Kill the above processes? (y/N)"
    if ($answer -notin @('y','Y','yes','Yes')) {
        Write-Host "Aborted." -ForegroundColor Cyan
        exit 0
    }
}

# Attempt to stop processes gracefully, escalate to -Force if needed
foreach ($id in $unique) {
    try {
        Write-Host "Stopping PID $id..." -NoNewline
        Stop-Process -Id $id -ErrorAction Stop
        Write-Host " Stopped." -ForegroundColor Green
    } catch {
        Write-Host " Graceful stop failed, forcing..." -ForegroundColor Yellow -NoNewline
        try {
            Stop-Process -Id $id -Force -ErrorAction Stop
            Write-Host " Forced." -ForegroundColor Green
        } catch {
            Write-Host " Could not kill PID $id: $_" -ForegroundColor Red
        }
    }
}

# Verify ports
Start-Sleep -Milliseconds 300
$stillListening = @()
foreach ($p in $Ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop
        if ($conns) { $stillListening += $p }
    } catch {
        # ignore
    }
}

if ($stillListening) {
    Write-Host "Ports still listening: $($stillListening -join ', ')" -ForegroundColor Yellow
} else {
    Write-Host "All checked ports are free." -ForegroundColor Green
}

Write-Host "Done." -ForegroundColor Cyan
