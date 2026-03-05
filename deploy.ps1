# Aliyun OSS Deploy Script
# 密钥从环境变量获取，CI/CD 时由 GitHub Secrets 传入
$env:OSS_ACCESS_KEY_ID = if ($env:OSS_ACCESS_KEY_ID) { $env:OSS_ACCESS_KEY_ID } else { "" }
$env:OSS_ACCESS_KEY_SECRET = if ($env:OSS_ACCESS_KEY_SECRET) { $env:OSS_ACCESS_KEY_SECRET } else { "" }
$OSS_BUCKET = "baibaiyingyong"
$OSS_REGION = "oss-cn-beijing"

Write-Host "Starting deploy to Aliyun OSS..." -ForegroundColor Green

# Check if credentials are provided
if (-not $env:OSS_ACCESS_KEY_ID -or -not $env:OSS_ACCESS_KEY_SECRET) {
    Write-Host "Warning: OSS credentials not provided. Skipping upload." -ForegroundColor Yellow
    Write-Host "Set OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET environment variables to deploy." -ForegroundColor Yellow
    exit 0
}

# Check dist folder
if (-not (Test-Path "dist")) {
    Write-Host "Error: dist folder not found" -ForegroundColor Red
    exit 1
}

# Configure ossutil
& ossutil config -i $env:OSS_ACCESS_KEY_ID -k $env:OSS_ACCESS_KEY_SECRET -e $OSS_REGION

# Upload to OSS
& ossutil cp -r dist/ oss://$OSS_BUCKET/ --mirror -e oss-cn-beijing.aliyuncs.com

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy success! Access: https://$OSS_BUCKET.$OSS_REGION.aliyuncs.com" -ForegroundColor Green
} else {
    Write-Host "Deploy failed" -ForegroundColor Red
}
