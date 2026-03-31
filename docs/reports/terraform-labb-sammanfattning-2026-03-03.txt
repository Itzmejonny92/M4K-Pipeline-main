# Labb Sammanfattning - Terraform till Kubernetes

Datum: 2026-03-03  
Miljö: VS Code + WSL (Ubuntu)  
Kubernetes namespace: `m4k-gang`

## 1. Mål för dagen

Målet var att gå från manuell `kubectl apply`-hantering till Infrastructure as Code med Terraform, så att:

- infrastruktur definieras i kod
- ändringar kan planeras innan de körs
- verkligt läge kan jämföras mot önskat läge (`terraform plan`)
- resurser kan spåras i state istället för manuella kommandon

## 2. Förberedelser

Vi började med att:

- uppdatera Terraform i Windows-miljön
- verifiera version (`Terraform v1.14.6`)
- identifiera vecka 6-resurser i repo (`week6/m4k-gang-week6-resources`)
- verifiera kubeconfig (`week6/m4k-gang-kubeconfig.yaml`)

Vi rensade gamla app-resurser från vecka 6 via:

- `kubectl delete -f week6/m4k-gang-week6-resources --ignore-not-found=true`

Viktigt: namespace-radering var blockerad av RBAC (`Forbidden`), så vi rensade endast det kontot hade rättigheter till.

## 3. Terraform-projekt skapades

Ny katalog:

- `week7-terraform/`

Grundfiler:

- `versions.tf` (Terraform + providerkrav)
- `provider.tf` (kubernetes provider med WSL-sökväg till kubeconfig)
- `variables.tf` (namespace + senare fler variabler)
- `main.tf` (första ConfigMap: `terraform-demo`)

## 4. Första Terraform-livscykeln

Vi körde:

- `terraform init`
- `terraform validate`
- `terraform plan`
- `terraform apply`

Verifiering med `kubectl` visade att `terraform-demo` skapades korrekt i `m4k-gang`.

Vi gjorde också en ändringsövning av `APP_VERSION` för att träna:

- planerad diff
- kontrollerad apply

## 5. Vanligt fel som inträffade och lärdom

Ett återkommande fel var att Terraform/HCL-klossar klistrades in direkt i Bash.  
Det gav fel som `resource: command not found`.

Lärdom:

- HCL skrivs i `.tf`-filer
- terminalen används för `terraform ...`-kommandon

## 6. Redis migrerades till Terraform

Skapad fil:

- `redis.tf`

Resurser:

- `kubernetes_deployment.redis`
- `kubernetes_service.redis`

Vi synkade Terraform-definitionen mot tidigare YAML (bl.a. labels/probes/portnamn) för att undvika onödig drift.

## 7. API migrerades till Terraform

Skapad fil:

- `api.tf`

Resurser:

- `kubernetes_config_map.api_config`
- `kubernetes_deployment.api`
- `kubernetes_service.api`

När `apply` först kördes fick vi:

- `configmaps "api-config" already exists`
- `services "api-service" already exists`

Orsak: resurserna fanns redan i klustret men inte i state.

Lösning:

- `terraform import ...` för API-resurserna

Efter import gav `terraform plan` inga ändringar för API.

## 8. Frontend migrerades till Terraform

Skapad fil:

- `frontend.tf`

Resurser:

- `kubernetes_deployment.frontend`
- `kubernetes_service.frontend`

Även här användes import för befintliga resurser:

- deployment
- service

Efter import visade planen endast mindre label-uppdateringar (`managed-by=terraform`), vilket är förväntat.

## 9. Monitor migrerades till Terraform

Skapad fil:

- `monitor.tf`

Resurser:

- `kubernetes_service_account.monitor_sa`
- `kubernetes_role.monitor_role`
- `kubernetes_role_binding.monitor_binding`
- `kubernetes_config_map.monitor_config`
- `kubernetes_secret.monitor_secret`
- `kubernetes_deployment.team_monitor`

Vi såg också en planerad skillnad i `API_ENDPOINT` för monitor-config, vilket är en viktig IaC-lärdom:

- Terraform visar exakt drift mot kod
- ni väljer om ni vill behålla nuvarande värde eller standardisera nytt värde

## 10. Ingress/TLS förbereddes

Skapad fil:

- `ingress.tf`

Resurser:

- `kubernetes_ingress_v1.team_dashboard`
- `kubernetes_manifest.team_dashboard_certificate` (styrs av `enable_tls`)

Nya variabler i `variables.tf`:

- `domain`
- `enable_tls`
- `cluster_issuer`

Motivering:

- ingress finns i klustret och kan importeras
- certificate var inte alltid närvarande, därför gjorde vi TLS-delen valbar för robust labbflöde

## 11. Verktyg som installerades

I WSL installerades `ripgrep` (`rg`) för snabb fil-/textsökning.

## 12. Viktig konceptuell lärdom från dagen

### `terraform plan` före `apply`

Alltid plan först, så ni ser exakt vad som ändras.

### `terraform state` är Terraforms minne

Om resurs finns i kluster men inte i state behövs oftast `terraform import`.

### Drift detection

Skillnader mellan kod och verklighet blev tydliga direkt (labels, endpoint, m.m.).

### Iterativ migration är bäst

Vi migrerade block för block (ConfigMap -> Redis -> API -> Frontend -> Monitor -> Ingress) i stället för allt på en gång.

## 13. Filer som skapats/ändrats idag (week7-terraform)

- `versions.tf`
- `provider.tf`
- `variables.tf`
- `main.tf`
- `redis.tf`
- `api.tf`
- `frontend.tf`
- `monitor.tf`
- `ingress.tf`
- `.terraform.lock.hcl`
- `terraform.tfstate` (lokal state)
- `terraform.tfstate.backup`

## 14. Rekommenderade nästa steg

1. Säkerställ att alla befintliga resurser är importerade och att `terraform plan` blir `No changes`.
2. Commita Terraform-koden (inte state/plan-filer).
3. Lägg/validera `.gitignore` för:
   - `.terraform/`
   - `terraform.tfstate`
   - `terraform.tfstate.backup`
   - `tfplan`
4. Nästa workshop: flytta state till remote backend.
5. Lägg till `terraform validate` + `terraform plan` i CI.

## 15. Kort slutsats

Ni har tagit er från manuell Kubernetes-hantering till ett strukturerat Terraform-flöde med planering, state-spårning och kontrollerade ändringar. Det är exakt grunden för säkrare drift, bättre samarbete och enklare felsökning framåt.

