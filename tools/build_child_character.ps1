param(
    [Parameter(Mandatory = $true)]
    [string]$CharacterPath,
    [Parameter(Mandatory = $true)]
    [string]$LogoPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Add-Type -AssemblyName System.Drawing

$character = [System.Drawing.Bitmap]::FromFile($CharacterPath)
$logo = [System.Drawing.Bitmap]::FromFile($LogoPath)

try {
    $glyphBounds = [System.Drawing.Rectangle]::new(51, 34, 48, 63)
    $glyph = [System.Drawing.Bitmap]::new(
        $glyphBounds.Width,
        $glyphBounds.Height,
        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )

    try {
        for ($y = 0; $y -lt $glyphBounds.Height; $y++) {
            for ($x = 0; $x -lt $glyphBounds.Width; $x++) {
                $source = $logo.GetPixel($glyphBounds.X + $x, $glyphBounds.Y + $y)
                if ($source.B -gt 120 -and $source.G -gt 76 -and $source.R -lt 160) {
                    $alpha = [Math]::Min(255, [Math]::Max(0, ($source.G - 70) * 4))
                    $glyph.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 74, 199, 244))
                }
            }
        }

        $composited = [System.Drawing.Bitmap]::new(
            $character.Width,
            $character.Height,
            [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        )

        try {
            $graphics = [System.Drawing.Graphics]::FromImage($composited)
            try {
                $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.DrawImageUnscaled($character, 0, 0)
                $graphics.DrawImage($glyph, [System.Drawing.Rectangle]::new(639, 423, 54, 71))
            }
            finally {
                $graphics.Dispose()
            }

            $cropBounds = [System.Drawing.Rectangle]::new(349, 7, 530, 1239)
            $cropped = $composited.Clone(
                $cropBounds,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )

            try {
                $outputDirectory = Split-Path -Parent $OutputPath
                if (-not (Test-Path -LiteralPath $outputDirectory)) {
                    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
                }
                $cropped.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
            }
            finally {
                $cropped.Dispose()
            }
        }
        finally {
            $composited.Dispose()
        }
    }
    finally {
        $glyph.Dispose()
    }
}
finally {
    $logo.Dispose()
    $character.Dispose()
}
