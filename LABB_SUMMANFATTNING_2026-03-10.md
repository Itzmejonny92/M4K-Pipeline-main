# Labb-sammanfattning vecka 8 (2026-03-10)

## Mal med dagens labb
Syftet med dagens arbete var att ga fran fungerande Kubernetes/Terraform-drift till en mer saker plattform, med fokus pa:
- RBAC-forstaelse och verifiering i namespace `m4k-gang`
- container hardening i Dockerfile och Kubernetes-manifest
- borttagning av hardkodade secrets ur aktiv kod
- natverkshardning med `NetworkPolicy`
- faktisk Trivy-scan som slutresultat

---

## Utgangslage
Vi utgick fran ett repo dar:
- namespace `m4k-gang` redan anvandes i vecka 6/7-sparet
- Terraform-resurser fanns i `week7-terraform/`
- ett separat `k8s/`-spar fortfarande inneholl gamla referenser till `boiler-room`
- Trivy-installation i WSL inte var fullt klar, men Docker fanns tillgangligt

Vi verifierade tidigt att den aktiva kubeconfigen pekade pa `m4k-gang` och att week6/week7-resurserna faktiskt kor dar.

---

## Genomfort arbete steg-for-steg

## Steg 1: Namespace-verifiering och RBAC-audit
Vi identifierade att repoet inneholl tva olika namespace-spor:
- `m4k-gang` i week6/week7-resurserna
- `boiler-room` i det aldre `k8s/`-sparet

Vi verifierade sedan RBAC i `m4k-gang`:
- listade faktiska rattigheter med `kubectl auth can-i --list -n m4k-gang`
- verifierade att `monitor-sa` **inte** kan lasa `secrets`
- verifierade att `monitor-sa` **kan** lista `pods`

Detta bekraftade att monitor-kontot foljer principen om least privilege.

---

## Steg 2: RBAC-roller och bindings
Vi gick igenom och skapade/forberedde foljande RBAC-resurser:
- `pod-reader` som lasroll for `pods` och `pods/log`
- `deploy-manager` som kan hantera `deployments`, `services` och `configmaps`, men inte `secrets`
- `deploy-manager-binding` som kopplar rollen till en `ServiceAccount`

Pedagogiskt fokus lag pa skillnaden mellan:
- `Role`
- `RoleBinding`
- `ServiceAccount`

Vi verifierade aven att YAML inte ska koras direkt i terminalen utan appliceras via `kubectl apply -f`.

---

## Steg 3: Multi-stage build och image hardening
Vi hardenat applikationens Dockerfile stegvis:

1. Bytte till riktig multi-stage build.
2. Begransade slutimagen till runtime-filer i stallet for hela repoet.
3. Lade till `HEALTHCHECK`.
4. Bytte runtime till distroless:
   - `gcr.io/distroless/nodejs22-debian12:nonroot`

Detta minskade attackytan tydligt:
- ingen shell i runtime-imagen
- ingen package manager i runtime-imagen
- mindre innehall att angripa

Docker-byggen verifierades lokalt med:
- `first-pipeline:hardening-test`
- `first-pipeline:hardening-healthcheck`
- `first-pipeline:hardening-distroless`

---

## Steg 4: Kubernetes container hardening
Vi hardenat app-containrarna i `k8s/`-sparet genom att lagga till:
- `runAsNonRoot: true`
- `seccompProfile.type: RuntimeDefault`
- `allowPrivilegeEscalation: false`
- `capabilities.drop: ["ALL"]`
- `readOnlyRootFilesystem: true`

Detta gjordes i:
- `k8s/backend-deployment.yaml`
- `k8s/app-deployment.yaml`

Vi verifierade renderingen med `kubectl kustomize`.

---

## Steg 5: Terraform hardening
Vi forde over samma hardening-tank till Terraform-vagen i `week7-terraform/`.

I modulen `modules/k8s-app/main.tf` lade vi till:
- pod-level `security_context`
- container-level `security_context`
- styrbar `read_only_root_filesystem`

I root-konfigurationen och monitor-resursen justerades:
- `api`
- `frontend`
- `redis`
- `team-monitor`

Viktig detalj:
- `redis` fick `read_only_root_filesystem = false` eftersom databasen maste kunna skriva

Verifiering:
- `terraform fmt -recursive`
- `terraform init -backend=false`
- `terraform validate`

Valideringen gick igenom.

---

## Steg 6: Secrets hardening
Vi tog bort hardkodade secrets ur aktiv versionshanterad kod.

Andringar:
- `k8s/backend-secret.yaml` togs bort ur aktivt deployspar
- `k8s/backend-secret.example.yaml` skapades som mall
- `k8s/kustomization.yaml` slutade inkludera secret-manifestet
- `.gitignore` uppdaterades for lokala secret-filer och tfvars

I Terraform:
- `week7-terraform/monitor.tf` slutade hardkoda `API_KEY`
- ny sensitiv variabel `monitor_api_key` lades till i `variables.tf`
- `example.tfvars` uppdaterades med placeholder

Detta minskade risken att hemligheter ligger kvar i repoet.

---

## Steg 7: NetworkPolicy
Vi lade till natverkshardning via:
- `k8s/network-policy.yaml`

Policyn begransar:
- `first-pipeline` far bara ta emot trafik pa port `3000` fran namespace `m4k-gang`
- `first-pipeline` far bara prata ut till:
  - `mongo` pa `27017`
  - DNS i `kube-system`
- `mongo` far bara ta emot trafik fran `first-pipeline`

Policyn applicerades och verifierades i klustret:
- `first-pipeline-network-policy`
- `mongo-network-policy`

---

## Steg 8: Klusterverifiering och driftfynd
Nar vi applicerade manifests mot klustret hittade vi flera viktiga driftfakta:

1. `NodePort` blockerades av Gatekeeper-policy.
   - Losning: andrade `Service` till `ClusterIP`.

2. `first-pipeline` kunde inte dra lokal image `m4k-pipeline:local`.
   - Losning: deploymenten uppdaterades till registry-image.

3. Klustret hade resursbrist for vissa poddar.
   - Vi testade lagre requests/limits och repliker.

4. Slutlig blockerare for faktisk deploy blev image-pull mot GHCR (`403 Forbidden`), vilket ar ett separat registry/credential-problem och inte ett hardening-problem.

Vi valde da att avgransa oss tillbaka till hardening-sparet.

---

## Steg 9: Trivy-scan som slutresultat
Som slutresultat genomfordes en faktisk Trivy-scan pa:
- hardened imagen `first-pipeline:hardening-distroless`
- baseline imagen `node:18-alpine`

Rapporter sparades som:
- `trivy-hardened.json`
- `trivy-node18.json`

### Scanresultat
- Hardened image: `0 CRITICAL`, `1 HIGH`
- Baseline `node:18-alpine`: `2 CRITICAL`, `14 HIGH`

Detta visar en tydlig sakerhetsforbattring efter hardening-arbetet.

---

## Slutresultat
Vid dagens slut hade vi:
- verifierat namespace och RBAC-beteende i `m4k-gang`
- byggt en hardened image med multi-stage, healthcheck och distroless runtime
- hardenat Kubernetes-deployments med non-root, seccomp, dropped capabilities och read-only rootfs
- hardenat Terraform-resurser med motsvarande security context
- tagit bort hardkodade secrets ur aktiv kod
- lagt till `NetworkPolicy`
- genomfort en faktisk Trivy-scan med tydligt slutresultat

### Bedomning mot dagens tema
- RBAC-delen: genomford och verifierad
- Container Hardening-delen: tydligt genomford
- Trivy/slutscan: genomford

Det mesta av den praktiska och viktiga karndelen for vecka 8 blev darfor avklarat.

---

## Filer som skapades/uppdaterades under passet (urval)
- `Dockerfile`
- `k8s/backend-deployment.yaml`
- `k8s/app-deployment.yaml`
- `k8s/network-policy.yaml`
- `k8s/backend-secret.example.yaml`
- `week7-terraform/modules/k8s-app/main.tf`
- `week7-terraform/main.tf`
- `week7-terraform/monitor.tf`
- `week7-terraform/variables.tf`
- `week7-terraform/example.tfvars`
- `.gitignore`
- `trivy-hardened.json`
- `trivy-node18.json`

---

## Viktiga larpoanger
1. Hardening handlar inte bara om Dockerfile, utan aven om Kubernetes securityContext, RBAC, secrets och natverk.
2. Distroless och multi-stage ger verklig effekt i scanresultat, inte bara "snyggare" Dockerfile.
3. Hardkodade secrets i repo ar en faktisk risk och bor bort tidigt.
4. En lyckad deploy och en hardenad deploy ar inte samma sak. Registry-policy, quota och image-access kan blockera drift aven nar hardeningen ar korrekt.
