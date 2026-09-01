param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z][a-z0-9-]{4,28}[a-z0-9]$')]
    [string]$ProjectId,

    [ValidateSet('europe-west1', 'europe-west3', 'europe-west4')]
    [string]$Region = 'europe-west1',

    [string]$ServiceName = 'alika-site-assistant',

    [string]$GeminiApiKeySecret = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    throw 'Google Cloud CLI (gcloud) bulunamadı. Cloud Shell kullanın veya gcloud kurun.'
}

$serviceAccountName = 'alika-site-assistant'
$serviceAccount = "$serviceAccountName@$ProjectId.iam.gserviceaccount.com"
$rateSalt = [Guid]::NewGuid().ToString('N')

gcloud config set project $ProjectId
gcloud services enable run.googleapis.com aiplatform.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com --project $ProjectId

gcloud iam service-accounts describe $serviceAccount --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
    gcloud iam service-accounts create $serviceAccountName --display-name 'AliKa site assistant' --project $ProjectId
}

gcloud projects add-iam-policy-binding $ProjectId --member "serviceAccount:$serviceAccount" --role 'roles/aiplatform.user' --condition=None

$envFile = New-TemporaryFile
$envYaml = @"
GOOGLE_CLOUD_PROJECT: "$ProjectId"
GOOGLE_CLOUD_LOCATION: "global"
ALIKA_GEMINI_MODEL: "gemini-3.5-flash"
ALIKA_ALLOWED_ORIGINS: "https://www.alika.tr,https://alika.tr"
ALIKA_RATE_SALT: "$rateSalt"
"@
Set-Content -LiteralPath $envFile.FullName -Value $envYaml -Encoding utf8NoBOM
$deployArguments = @(
    'run', 'deploy', $ServiceName,
    '--source', '.',
    '--project', $ProjectId,
    '--region', $Region,
    '--platform', 'managed',
    '--allow-unauthenticated',
    '--service-account', $serviceAccount,
    '--memory', '512Mi',
    '--cpu', '1',
    '--concurrency', '20',
    '--min-instances', '0',
    '--max-instances', '3',
    '--timeout', '30s',
    '--env-vars-file', $envFile.FullName,
    '--quiet'
)

if ($GeminiApiKeySecret) {
    gcloud secrets add-iam-policy-binding $GeminiApiKeySecret --project $ProjectId --member "serviceAccount:$serviceAccount" --role 'roles/secretmanager.secretAccessor'
    $deployArguments += @('--update-secrets', "GEMINI_API_KEY=${GeminiApiKeySecret}:latest")
}

try {
    & gcloud @deployArguments
    if ($LASTEXITCODE -ne 0) { throw 'Cloud Run dağıtımı başarısız oldu.' }
}
finally {
    Remove-Item -LiteralPath $envFile.FullName -Force -ErrorAction SilentlyContinue
}

$serviceUrl = gcloud run services describe $ServiceName --project $ProjectId --region $Region --format 'value(status.url)'
$health = Invoke-RestMethod -Method Get -Uri "$serviceUrl/health"
if (-not $health.ok) { throw 'Dağıtım tamamlandı ancak sağlık kontrolü başarısız oldu.' }

Write-Host "Cloud Run hazır: $serviceUrl"
Write-Host "GitHub alika-site deposunda ALIKA_ASSISTANT_ENDPOINT Actions variable değerini $serviceUrl yapın."
Write-Host 'Yayından önce Google Cloud Billing içinde aylık bütçe ve %50/%80/%100 uyarılarını etkinleştirin.'
