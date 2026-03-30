# GitHub Actions till Kubernetes

Den har setupen gor workflowen i `.github/workflows/pipeline.yml` till en riktig end-to-end pipeline:

1. `npm ci`
2. `npm test`
3. Docker build
4. push till GHCR
5. Trivy scan
6. deploy till Kubernetes med `kubectl apply -k k8s/`

## Secrets som behovs

Lagg in dessa under repository secrets eller environment secrets i GitHub:

- `KUBE_CONFIG_STAGING_B64`
- `KUBE_CONFIG_PRODUCTION_B64`
- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `SLACK_WEBHOOK_URL` valfri

## Hur du skapar kubeconfig-secret

Exportera kubeconfig-filen som base64 utan radbrytningar.

Linux/macOS:

```bash
base64 -w 0 ~/.kube/config
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME/.kube/config"))
```

Klistra in resultatet i GitHub Secret.

## GHCR

Workflowen pushar imagen till:

```text
ghcr.io/<github-owner>/first-pipeline:<commit-sha>
```

och aven:

```text
ghcr.io/<github-owner>/first-pipeline:latest
```

## Viktigt om image pull i klustret

Workflowen skapar ett `imagePullSecret` med namn `ghcr-creds` i namespace `boiler-room`.

Anvand ett PAT i `GHCR_TOKEN` som har ratt att lasa GHCR-packages. `GHCR_USERNAME` ska vara GitHub-anvandaren som tokenet tillhor.

## Branchlogik

- Pull request mot `main` deployar till `staging`
- Push till `main` deployar till `production`

## Vanliga fel

- `KUBE_CONFIG_STAGING_B64 is not set`
  Da saknas GitHub Secret for staging.

- `KUBE_CONFIG_PRODUCTION_B64 is not set`
  Da saknas GitHub Secret for production.

- `GHCR_USERNAME or GHCR_TOKEN is not set`
  Da saknas registry-auth for att Kubernetes ska kunna dra imagen.

- `ImagePullBackOff`
  Klustret kommer inte at imagen i GHCR.

- `rollout status` timeout
  Poddar startar inte korrekt. Kontrollera `kubectl get pods -n boiler-room` och `kubectl describe pod`.
