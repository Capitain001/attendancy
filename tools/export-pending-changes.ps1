[CmdletBinding()]
param(
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

$repoRoot = (& git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw 'This script must be run inside a Git repository.'
}

$repoRoot = [System.IO.Path]::GetFullPath($repoRoot.Trim())
Set-Location -LiteralPath $repoRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $repoRoot 'git-changes.md'
} elseif (-not [System.IO.Path]::IsPathRooted($OutputPath)) {
    $OutputPath = Join-Path $repoRoot $OutputPath
}

$OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($OutputPath)
if (-not [System.IO.Directory]::Exists($outputDirectory)) {
    [System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null
}

$head = (& git rev-parse --verify HEAD 2>$null)
$hasHead = $LASTEXITCODE -eq 0

if ($hasHead) {
    $stagedPaths = @(& git diff --cached --name-only --no-renames HEAD --)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read staged Git changes.'
    }
    $unstagedPaths = @(& git diff --name-only --no-renames --)
} else {
    $stagedPaths = @(& git diff --cached --name-only --no-renames --)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read staged Git changes.'
    }
    $unstagedPaths = @(& git diff --name-only --no-renames --)
}
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read unstaged Git changes.'
}

$untrackedPaths = @(& git ls-files --others --exclude-standard)
if ($LASTEXITCODE -ne 0) {
    throw 'Could not read untracked Git files.'
}

$stagedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$unstagedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
$untrackedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($path in $stagedPaths) {
    [void]$stagedSet.Add([string]$path)
}
foreach ($path in $unstagedPaths) {
    [void]$unstagedSet.Add([string]$path)
}
foreach ($path in $untrackedPaths) {
    [void]$untrackedSet.Add([string]$path)
}

$paths = @($stagedPaths) + @($unstagedPaths) + @($untrackedPaths) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Sort-Object -Unique

$labels = @{
    Staged = "$([char]::ConvertFromUtf32(0x1F535)) PREPARE (staged)"
    Unstaged = "$([char]::ConvertFromUtf32(0x1F7E1)) NON PREPARE (unstaged)"
    Both = "$([char]::ConvertFromUtf32(0x1F7E3)) MIXTE (staged et unstaged)"
    Untracked = "$([char]::ConvertFromUtf32(0x1F7E2)) NOUVEAU FICHIER (untracked)"
    Deleted = "$([char]::ConvertFromUtf32(0x1F534)) SUPPRIME"
}
$groups = [ordered]@{
    Staged = New-Object 'System.Collections.Generic.List[string]'
    Unstaged = New-Object 'System.Collections.Generic.List[string]'
    Both = New-Object 'System.Collections.Generic.List[string]'
    Untracked = New-Object 'System.Collections.Generic.List[string]'
    Deleted = New-Object 'System.Collections.Generic.List[string]'
}
$reportDirectoryUri = New-Object System.Uri(($outputDirectory.TrimEnd('\') + '\'))

foreach ($path in $paths) {
    $normalizedPath = ([string]$path).Replace('\', '/')
    if ($normalizedPath -match '(?i)(^|/)\.api/|(^|/)generated/|(^|/)src/generated/|(^|/)generated\.types\.ts$|\.tsbuildinfo$') {
        continue
    }

    $absolutePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $path))
    if ([string]::Equals($absolutePath, $OutputPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        continue
    }

    $isStaged = $stagedSet.Contains([string]$path)
    $isUnstaged = $unstagedSet.Contains([string]$path)
    if ($untrackedSet.Contains([string]$path)) {
        $group = 'Untracked'
    } elseif (-not (Test-Path -LiteralPath $absolutePath -PathType Leaf)) {
        $group = 'Deleted'
    } elseif ($isStaged -and $isUnstaged) {
        $group = 'Both'
    } elseif ($isStaged) {
        $group = 'Staged'
    } else {
        $group = 'Unstaged'
    }

    $groups[$group].Add([string]$path)
}

$markdown = New-Object 'System.Collections.Generic.List[string]'
$markdown.Add('# Changements Git en attente de commit')
$markdown.Add('')
$markdown.Add('Ce rapport montre le contenu actuel des fichiers, pas les lignes de diff.')
$markdown.Add('')
$markdown.Add('## Legende')
$markdown.Add('')
$markdown.Add("- $($labels.Staged) : changements ajoutes a l'index Git, prets a etre commites.")
$markdown.Add("- $($labels.Unstaged) : changements locaux qui ne sont pas encore ajoutes a l'index.")
$markdown.Add("- $($labels.Both) : le fichier contient a la fois des changements indexes et locaux; son contenu affiche est le contenu final sur le disque.")
$markdown.Add("- $($labels.Untracked) : nouveau fichier non suivi par Git.")
$markdown.Add("- $($labels.Deleted) : fichier supprime.")
$markdown.Add('')
$markdown.Add('Les fichiers generes (`.api/`, `generated/`, `generated.types.ts`, `*.tsbuildinfo`) et le present rapport sont exclus.')
$markdown.Add('')
$markdown.Add("_Genere le $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')._")
$markdown.Add('')

$hasFiles = $false
foreach ($group in $groups.Keys) {
    if ($groups[$group].Count -eq 0) {
        continue
    }

    $hasFiles = $true
    $markdown.Add("## $($labels[$group])")
    $markdown.Add('')

    foreach ($path in $groups[$group]) {
        $absolutePath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $path))
        $targetUri = New-Object System.Uri($absolutePath)
        $relativeUri = $reportDirectoryUri.MakeRelativeUri($targetUri).ToString()
        $displayPath = ([string]$path).Replace('\', '\\').Replace('`', '\`').Replace('[', '\[').Replace(']', '\]')
        $markdown.Add("### [$displayPath](<$relativeUri>)")
        $markdown.Add('')

        if ($group -eq 'Deleted') {
            $markdown.Add('Fichier supprime; aucun contenu disponible.')
        } else {
            $bytes = [System.IO.File]::ReadAllBytes($absolutePath)
            if ([Array]::IndexOf($bytes, [byte]0) -ge 0) {
                $markdown.Add('Fichier binaire; contenu non integre au rapport.')
            } else {
                $content = [System.IO.File]::ReadAllText($absolutePath)
                $maxBacktickRun = 0
                foreach ($match in [System.Text.RegularExpressions.Regex]::Matches($content, '`+')) {
                    $maxBacktickRun = [Math]::Max($maxBacktickRun, $match.Length)
                }
                $fence = '`' * [Math]::Max(3, $maxBacktickRun + 1)
                $markdown.Add($fence)
                $markdown.Add($content.TrimEnd([char[]]@([char]13, [char]10)))
                $markdown.Add($fence)
            }
        }

        $markdown.Add('')
    }
}

if (-not $hasFiles) {
    $markdown.Add('Aucun changement a afficher (les changements generes sont exclus).')
}

$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, ($markdown -join "`n") + "`n", $encoding)
Write-Output "Rapport exporte : $OutputPath"
