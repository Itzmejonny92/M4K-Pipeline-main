# Labb Sammanfattning (Kort) - 2026-03-03

## Syfte

Migrera vecka 6 Kubernetes-resurser till Terraform i namespace `m4k-gang`, med fokus på spårbarhet, planerade ändringar och state-hantering.

## Genomfört

1. Terraform uppdaterades och verifierades (`v1.14.6`).
2. Gamla app-resurser från vecka 6 rensades i namespace.
3. Terraform-projekt skapades i `week7-terraform`:
   - `versions.tf`, `provider.tf`, `variables.tf`, `main.tf`
4. Första resursen (`terraform-demo` ConfigMap) skapades med:
   - `terraform init`, `validate`, `plan`, `apply`
5. Redis migrerades:
   - `redis.tf` (deployment + service)
6. API migrerades:
   - `api.tf` (configmap + deployment + service)
   - befintliga resurser importerades till state
7. Frontend migrerades:
   - `frontend.tf` (deployment + service)
   - befintliga resurser importerades till state
8. Monitor migrerades:
   - `monitor.tf` (serviceaccount, role, rolebinding, configmap, secret, deployment)
   - import + planerad driftkontroll
9. Ingress/TLS förbereddes:
   - `ingress.tf` (ingress + valbar cert-manager certificate via `enable_tls`)

## Viktiga lärdomar

- Terraform-kod ska skrivas i `.tf`-filer, inte i terminalen.
- `terraform plan` ska alltid köras före `apply`.
- Om resurser redan finns i kluster men saknas i state: använd `terraform import`.
- Små skillnader (labels, endpoint-värden) syns tydligt i plan och kan hanteras kontrollerat.

## Resultat

Ni har etablerat ett fungerande IaC-flöde med Terraform för större delen av stacken (redis, api, frontend, monitor, ingress), med tydlig state-hantering och reproducerbar drift.

## Nästa steg

1. Säkerställ `terraform plan` = `No changes`.
2. Commita `.tf` + `.terraform.lock.hcl` (inte state/plan-filer).
3. Flytta state till remote backend i nästa workshop.

