# First Pipeline Challenge

[![CI/CD Pipeline](https://github.com/PalmChas/M4K-Pipeline/actions/workflows/pipeline.yml/badge.svg)](https://github.com/PalmChas/M4K-Pipeline/actions/workflows/pipeline.yml)

Node/Express app built for the Week 4 Boiler Room CI/CD challenge, with supporting Kubernetes and Terraform material from later labs.

Live deployment: [m4k-pipeline-production.up.railway.app](https://m4k-pipeline-production.up.railway.app)

## What Is In This Repo

- App runtime files live in the repo root: `index.js`, `test.js`, `package.json`, `Dockerfile`
- GitHub Actions pipeline lives in `.github/workflows/`
- Kubernetes manifests live in `infra/k8s/`
- Terraform configuration lives in `infra/terraform/`
- Lab notes, reports, and archived course material live in `docs/`

## Project Layout

```text
.
|-- .github/workflows/
|-- docs/
|   |-- checklists/
|   |-- reports/
|   `-- week6/
|-- infra/
|   |-- k8s/
|   `-- terraform/
|-- scripts/
|-- Dockerfile
|-- index.js
|-- package.json
`-- test.js
```

## Run Locally

```bash
npm ci
npm test
npm start
```

The app starts on the configured `PORT` or `3000` by default.

## Endpoints

- `GET /` -> dashboard landing page
- `GET /status` -> service status and timestamp
- `GET /health` -> health check and uptime
- `GET /metrics` -> request count and average response time metrics
- `GET /metrics/prometheus` -> Prometheus-format metrics

## CI/CD Summary

The GitHub Actions pipeline runs:

- `npm ci`
- `npm test`
- Docker image build
- Trivy image scan
- staging and production deploy hooks
- Slack notifications for success and failure

## Infrastructure

- Kubernetes manifests: `infra/k8s/`
- Additional RBAC manifests: `infra/k8s/rbac/`
- Terraform lab files: `infra/terraform/`
- Helper scripts: `scripts/deploy.sh`, `scripts/cleanup-old-rs.sh`

See `infra/k8s/README.md` for the local Kubernetes workflow.

## Documentation

Supporting notes and lab reports were moved out of the root directory to make the repo easier to navigate:

- `docs/checklists/`
- `docs/reports/`
- `docs/week6/`

## Team

Team name: `M4K Gang`

- Oskar Palm
- Carl Persson
- Jonny Nguyen
- Julia Persson
- Mattej Petrovic
