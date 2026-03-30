# GitHub Actions och lokal kind-demo

Den har setupen ar anpassad for lokal utveckling i VS Code med WSL och ett lokalt `kind`-kluster.

GitHub Actions gor bara CI och container-publicering:

1. `npm ci`
2. `npm test`
3. Docker build
4. push till GHCR
5. Trivy scan

Kubernetes-deployment kor ni lokalt fran WSL under demon.

## Secrets som behovs

Lagg in dessa under repository secrets eller environment secrets i GitHub:

- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `SLACK_WEBHOOK_URL` valfri

## GHCR

Workflowen pushar imagen till:

```text
ghcr.io/<github-owner>/first-pipeline:<commit-sha>
```

och aven:

```text
ghcr.io/<github-owner>/first-pipeline:latest
```

## Lokal Kubernetes-demo i WSL

Om du kor `kind` lokalt i WSL ska deploymenten goras lokalt, inte fran GitHub Actions.

Exempel:

```bash
docker build -t m4k-pipeline:demo .
kind load docker-image m4k-pipeline:demo --name boiler-room
./scripts/deploy.sh demo
kubectl get all -n boiler-room
kubectl port-forward service/first-pipeline 3000:3000 -n boiler-room
```

Det ar den rekommenderade modellen for presentationen:

- GitHub Actions visar CI, image build/push och Trivy
- WSL + kind visar Kubernetes-deployment live

## Vanliga fel

- `GHCR_USERNAME or GHCR_TOKEN is not set`
  Da saknas registry-auth for att pusha imagen till GHCR.

- `ImagePullBackOff`
  Om du kor lokalt kind ska du normalt ladda imagen direkt i klustret med `kind load docker-image`.

- `rollout status` timeout
  Poddar startar inte korrekt. Kontrollera `kubectl get pods -n boiler-room` och `kubectl describe pod`.
