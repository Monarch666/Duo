Add-Type -AssemblyName System.Drawing

$srcPath = "e:\Relationship manager\Cuddling Otters at Sunset.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found at $srcPath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image loaded: $($srcImage.Width)x$($srcImage.Height)"

function Resize-ImageFile {
    param(
        [System.Drawing.Image]$img,
        [int]$width,
        [int]$height,
        [string]$outputPath
    )
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($img, 0, 0, $width, $height)
    
    $dir = Split-Path $outputPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $destBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    Write-Host "Generated: $outputPath ($width x $height)"
}

# 1. PWA Icons
Resize-ImageFile $srcImage 512 512 "e:\Relationship manager\public\icons\icon-512x512.png"
Resize-ImageFile $srcImage 192 192 "e:\Relationship manager\public\icons\icon-192x192.png"

# 2. Android Mipmap Icons
$mipmapConfigs = @(
    @{ dir = "mipmap-mdpi"; size = 48 },
    @{ dir = "mipmap-hdpi"; size = 72 },
    @{ dir = "mipmap-xhdpi"; size = 96 },
    @{ dir = "mipmap-xxhdpi"; size = 144 },
    @{ dir = "mipmap-xxxhdpi"; size = 192 }
)

$resDir = "e:\Relationship manager\android\app\src\main\res"

foreach ($cfg in $mipmapConfigs) {
    $targetDir = Join-Path $resDir $cfg.dir
    $size = $cfg.size
    Resize-ImageFile $srcImage $size $size (Join-Path $targetDir "ic_launcher.png")
    Resize-ImageFile $srcImage $size $size (Join-Path $targetDir "ic_launcher_round.png")
    Resize-ImageFile $srcImage $size $size (Join-Path $targetDir "ic_launcher_foreground.png")
}

# 3. Splash Screen Image (Centered)
$splashDir = Join-Path $resDir "drawable"
Resize-ImageFile $srcImage 512 512 (Join-Path $splashDir "splash.png")

$srcImage.Dispose()
Write-Host "All icons and splash assets successfully generated from Cuddling Otters!"
