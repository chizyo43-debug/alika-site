# AliKa site assistant service

This Cloud Run service keeps Google credentials away from the static website,
retrieves a small set of verified AliKa facts for every question, and asks Gemini
to return a concise answer plus allow-listed site actions. It does not persist
chat content and does not log request bodies.

## Local test

```powershell
npm ci
npm test
```

## Knowledge verification date

The visible `Last verified` date comes from `src/knowledge-verification.json`.
Its source hashes cover the public fact base, detailed product manual, search
index, and video catalog. Tests, the Pages workflow, and the Cloud Run deploy
script reject publication when one of those files changes without a fresh
verification.

After reviewing a knowledge change, refresh the versions, date, and hashes from
the repository root:

```powershell
npm run knowledge:refresh
```

## Authentication

Production should use Vertex AI and the Cloud Run service identity. Set
`GOOGLE_CLOUD_PROJECT` and optionally `GOOGLE_CLOUD_LOCATION=global`; do not set
`GOOGLE_APPLICATION_CREDENTIALS` in Cloud Run. Grant the service account only
`roles/aiplatform.user`.

`GEMINI_API_KEY` is supported as a fallback for Gemini Developer API. If used,
store it in Secret Manager and expose it only to this service. Never place it in
the website bundle or GitHub variables.

## Required runtime configuration

- `GOOGLE_CLOUD_PROJECT`: billing project for Vertex AI
- `GOOGLE_CLOUD_LOCATION`: defaults to `global`
- `ALIKA_GEMINI_MODEL`: defaults to `gemini-3.5-flash`
- `ALIKA_ALLOWED_ORIGINS`: defaults to the production site and local Vite origins
- `ALIKA_RATE_SALT`: random non-secret salt for short-lived visitor hashes

The built-in limiter is a low-cost first line per Cloud Run instance. Keep
`max-instances` low and configure billing budgets/alerts before launch. For a
high-traffic or attacked service, add an external HTTPS load balancer with Cloud
Armor rate limiting or reCAPTCHA Enterprise.

## Deploy

From Google Cloud Shell or a machine with `gcloud`:

```powershell
./deploy.ps1 -ProjectId YOUR_CREDIT_BILLING_PROJECT
```

The script enables the required APIs, creates a least-privilege service identity,
deploys with `min-instances=0` and `max-instances=3`, then prints the Cloud Run
URL. Add that URL as the `ALIKA_ASSISTANT_ENDPOINT` Actions variable in the
`alika-site` GitHub repository and rebuild the site. Do not enable the site widget
before the `/health` check succeeds.

If an API key is required instead of Vertex AI service identity, first store it in
Secret Manager and pass only the secret name:

```powershell
./deploy.ps1 -ProjectId YOUR_PROJECT -GeminiApiKeySecret alika-gemini-api-key
```

The API key value never enters the repository, browser bundle, command history, or
GitHub Actions variables.
