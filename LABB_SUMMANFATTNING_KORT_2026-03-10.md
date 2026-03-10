# Labb Sammanfattning (Kort) - 2026-03-10

## Syfte
Fokus for dagen var vecka 8-temat:
- RBAC
- container hardening
- borttagning av hardkodade secrets
- network policies
- avslutande Trivy-scan

## Genomfort
1. Verifierade att aktivt namespace ar `m4k-gang`.
2. Gjorde RBAC-audit med `kubectl auth can-i`.
3. Bekraftade att `monitor-sa` inte kan lasa `secrets`, men kan lista `pods`.
4. Gick igenom och skapade/forberedde rollerna `pod-reader` och `deploy-manager` samt en binding.
5. Hardenade `Dockerfile` med:
   - multi-stage build
   - `HEALTHCHECK`
   - distroless runtime
6. Hardenade Kubernetes-manifest med:
   - `runAsNonRoot`
   - `seccompProfile: RuntimeDefault`
   - `allowPrivilegeEscalation: false`
   - `capabilities.drop: ["ALL"]`
   - `readOnlyRootFilesystem: true`
7. Hardenade Terraform-resurser med motsvarande `security_context`.
8. Tog bort hardkodade secrets ur aktiv kod och ersatte dem med mallar/variabler.
9. Lade till `NetworkPolicy` for `first-pipeline` och `mongo`.
10. Korde faktisk Trivy-scan pa hardened image och baseline image.

## Resultat
- Hardened image: `0 CRITICAL`, `1 HIGH`
- Baseline `node:18-alpine`: `2 CRITICAL`, `14 HIGH`

Det visar att hardening-arbetet gav tydlig effekt.

## Viktig slutsats
Det mesta av den viktiga karndelen for vecka 8 blev genomfort:
- RBAC verifierades
- container hardening genomfordes
- secrets hardenades
- natverk hardenades
- Trivy-scan gav ett konkret slutresultat

## Viktiga filer
- `Dockerfile`
- `k8s/backend-deployment.yaml`
- `k8s/network-policy.yaml`
- `k8s/backend-secret.example.yaml`
- `week7-terraform/modules/k8s-app/main.tf`
- `week7-terraform/monitor.tf`
- `trivy-hardened.json`
- `trivy-node18.json`
