# Aliyun OSS Deploy Script
$env:OSS_ACCESS_KEY_ID = "LTAI5tAzj1wDA7w55H4mdkd6"
$env:OSS_ACCESS_KEY_SECRET = "ZEt30HlhOCpZqaJ0VUyw5ZEBF8SXeE"
$OSS_BUCKET = "baibaiyingyong"
$OSS_REGION = "oss-cn-beijing"

Write-Host "Starting deploy to Aliyun OSS..." -ForegroundColor Green

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
