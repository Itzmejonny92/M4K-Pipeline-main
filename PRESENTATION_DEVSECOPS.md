# Gruppresentation: DevSecOps-pipeline for detta repo

Den har guiden ar framtagen for en presentation pa cirka 15 minuter plus fragor. Fokus ar att visa ett fungerande system och knyta varje del till repot.

## 1. Malbild for presentationen

Visa att repot innehaller en sammanhallen DevSecOps-pipeline med:

- CI: installation, test och kvalitetskontroll i GitHub Actions
- CD: staging/production-floden i workflowen
- Container build: Docker-image byggs automatiskt
- Kubernetes: appen kan deployas i ett kluster med Deployment, Service, ConfigMap, Secret och StatefulSet
- Sakerhet: Trivy-scan, SARIF-upload och non-root container
- Monitoring: health checks, JSON-metrics och Prometheus-format

## 2. Rekommenderad talfordelning

### Person 1: Oversikt och arkitektur, 2 minuter

Sagtips:

"Vi utgick fran en Node.js-applikation och byggde runt den en DevSecOps-pipeline. Vart mal var att automatisera test, container build, sakerhetskontroll och deployment, och samtidigt kunna visa observability och Kubernetes i drift."

Visa:

- repo-roten
- [README.md](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/README.md)
- oversiktsbilden i README

### Person 2: CI/CD i GitHub Actions, 3 minuter

Sagtips:

"Var GitHub Actions-workflow kor pa push och pull request. Forst installeras beroenden med npm ci, sedan kors testerna, efter det byggs Docker-imagen och scannas med Trivy. Resultatet laddas upp som SARIF till GitHub Security. Kubernetes-deploymenten visar vi lokalt fran WSL mot vart kind-kluster."

Visa:

- [pipeline.yml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/.github/workflows/pipeline.yml)
- jobben `ci`, `deploy-staging`, `chaos-staging`, `deploy-production`, `notify-pipeline-failure`

Poanger att namna:

- push och pull request triggar CI
- imagen pushas till GHCR
- Slack-notifiering finns for pipeline failure om ni valjer att anvanda den

### Person 3: Container och sakerhet, 3 minuter

Sagtips:

"Vi containeriserade appen med Docker och hardenad basen genom att kora containern som `node` i stallet for root. I pipelinen kor vi Trivy for att hitta high och critical vulnerabilities."

Visa:

- [Dockerfile](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/Dockerfile)
- `USER node`
- README-sektionen om Trivy

Poanger att namna:

- `npm ci --omit=dev` ger reproducerbar och mindre image
- non-root ar en konkret hardening-atgard
- Trivy-resultat kan visas i GitHub Security/SARIF om ni har dem tillgangliga

### Person 4: Kubernetes deployment, 3 minuter

Sagtips:

"For runtime i kluster skapade vi Kubernetes-manifest. Appen kor som en Deployment med två repliker, exponeras via en Service och far konfiguration via ConfigMap och Secret. Vi har ocksa ett Mongo StatefulSet i repot for att visa stateful workload. Eftersom vart kluster ar lokalt i kind kor vi deploymenten fran WSL i stallet for direkt fran GitHub-hostade runners."

Visa:

- [k8s/backend-deployment.yaml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/k8s/backend-deployment.yaml)
- [k8s/backend-service.yaml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/k8s/backend-service.yaml)
- [k8s/configmap.yaml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/k8s/configmap.yaml)
- [k8s/backend-secret.yaml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/k8s/backend-secret.yaml)
- [k8s/mongo-statefulset.yaml](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/k8s/mongo-statefulset.yaml)
- [scripts/deploy.sh](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/scripts/deploy.sh)

Poanger att namna:

- liveness/readiness probes anvander `/health`
- resource requests/limits finns satta
- kustomize anvands for att patcha image version

### Person 5: Monitoring och live-demo, 4 minuter

Sagtips:

"For observability byggde vi in egna endpoints for health och metrics. Vi kan visa baade JSON-metrics och Prometheus-format, vilket gor losningen enkel att koppla till framtida dashboards och larm."

Visa:

- [index.js](/C:/Users/Jonny/Documents/GitHub/M4K-Pipeline-main-main/index.js)
- endpoints:
  - `/health`
  - `/metrics`
  - `/metrics/prometheus`

Live-demo:

1. Kor `npm test`
2. Starta appen lokalt
3. Oppna `/health`
4. Oppna `/metrics`
5. Oppna `/metrics/prometheus`
6. Visa Kubernetes-resurser med `kubectl get all -n boiler-room`

## 3. Exakt demo-upplagg, 12 till 15 minuter

### Del A: Visa pipeline, 3 till 4 minuter

1. Oppna GitHub Actions.
2. Visa att workflowen innehaller test, Docker build/push och Trivy.
3. Forklara att Kubernetes-deploymenten kors lokalt mot kind i WSL eftersom klustret inte ar externt atkomligt fran GitHub Actions.

### Del B: Visa lokal verifiering, 3 minuter

Kor:

```powershell
npm test
```

Visa att testerna passerar.

Kor sedan:

```powershell
node index.js
```

I en ny terminal:

```powershell
curl http://localhost:3000/health
curl http://localhost:3000/metrics
curl http://localhost:3000/metrics/prometheus
```

### Del C: Visa container och K8s, 3 till 4 minuter

Kor:

```powershell
docker build -t m4k-pipeline:demo .
```

Forklara sedan deploy-flodet:

```bash
./scripts/deploy.sh demo
kubectl get all -n boiler-room
kubectl rollout status deployment/first-pipeline -n boiler-room
kubectl port-forward service/first-pipeline 3000:3000 -n boiler-room
```

Om klustret redan ar igang kan ni hoppa direkt till `kubectl get all`.

### Del D: Visa sakerhet och monitoring, 2 till 3 minuter

Visa:

- Trivy-steget i GitHub Actions
- att containern inte kor som root
- metrics-endpointen i Prometheus-format

## 4. Fragor ni sannolikt far

### "Vad ar det som gor detta till DevSecOps och inte bara CI/CD?"

Bra svar:

"Security ar inbyggt i samma leveranskedja som build och deploy. Vi kor Trivy i pipelinen, laddar upp SARIF till GitHub Security, kor containern som non-root och har probes och metrics for driftbarhet och overvaking."

### "Kors deploymenten till Kubernetes automatiskt?"

Bra svar:

"I repot finns Kubernetes-manifest och deploy-skript for klusterkoring. I den nuvarande CI/CD-linjen ar den automatiska deploymenten kopplad via deploy hooks, medan Kubernetes-delen ar forberedd for live-demo och vidare integration."

### "Varfor har ni bade monitoring och health checks?"

Bra svar:

"Health checks behovs av plattformen for att veta om containern ar redo eller trasig. Metrics ar till for observability, trendanalys, dashboards och framtida alerting."

## 5. Det ni bor forbereda innan redovisningen

- Ha en terminal redo i repo-roten.
- Ha GitHub Actions-sidan oppen.
- Ha ett lokalt kluster redo om ni vill visa Kubernetes live.
- Testa `npm test` och `docker build` innan ni gar in.
- Om ni ska visa K8s live, verifiera `kubectl get pods -n boiler-room`.
- Ha en person som endast byter vyer och terminalfonstrer under demon.

## 6. Kort slutreplik

"Det har repot visar en komplett kedja fran kodandring till verifiering, containerisering, sakerhetskontroll, deployment och observability. Det viktigaste for oss var att varje steg skulle vara konkret, reproducerbart och mojligt att demonstrera live."
