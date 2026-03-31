# Labb-sammanfattning vecka 7 (2026-03-04)

## Mål med dagens labb
Syftet var att:
- autentisera mot GCP
- migrera Terraform state till remote backend (GCS)
- parameterisera konfigurationen med variabler
- refaktorera till återanvandbar modul (Deployment + Service)
- lagga till outputs
- na Bronze och Silver-niva utan att orsaka driftproblem i namespace

---

## Utgangslage
Vi utgick fran ett fungerande repo med Kubernetes-resurser i namespace `m4k-gang` och Terraform-filer i `week7-terraform/`.

Tidiga verifieringar visade:
- `kubectl get pods -n m4k-gang` fungerade
- Terraform fungerade i WSL, men inte i Windows PATH
- `provider.tf` hade tidigare en gammal path (`Thinkpad`) och uppdaterades till en portabel path med `abspath(...)`

---

## Genomfort arbete steg-for-steg

## Steg 0: GCP Authentication
### Problem vi stotte pa
1. `gcloud` saknades i WSL.
2. Browser-baserad login i WSL misslyckades (`xdg-open` kunde inte oppna webblasare).
3. Vi testade service account key (Option B) med filen `registry-key.json`, men den var fel for state-bucket:
   - kontot var `student-registry-push@chas-devsecops-2026.iam.gserviceaccount.com`
   - saknade bucket-rattighet (`403 storage.buckets.get denied` pa `chas-tf-state-m4k-gang`)

### Losning
1. Installerade `gcloud` i WSL.
2. Konfigurerade shell-profiler for korrekt PATH.
3. Rensade felaktiga credential-spor (fel key/exporter).
4. Slutlig fungerande auth uppnaddes via Option A (ADC), vilket gav token som borjade med `ya29...`.

---

## Steg 1: Migrera state till GCS backend (Bronze-karnan)
Vi konfigurerade backend i Terraform:
- bucket: `chas-tf-state-m4k-gang`
- prefix: `terraform/state/jonny`

Kommandot:
- `terraform init -migrate-state -force-copy`

Resultat:
- Backend initialiserad mot GCS
- Local state migrerad till remote state

---

## Steg 2: Variabler och tfvars
Vi uppdaterade `variables.tf` med tydligare variabler och validering, bland annat:
- `namespace`
- `team_name`
- `environment` (med validation)
- `redis_image`, `api_image`, `frontend_image`
- `api_replicas` (med validation)

Vi skapade ocksa:
- `terraform.tfvars`
- `example.tfvars`

---

## Steg 3: Modulrefaktor (Silver)
Vi skapade modul:
- `modules/k8s-app/main.tf`

Och refaktorerade root-konfigurationen till modulanrop for:
- Redis
- API
- Frontend

For att undvika onodig recreate anvande vi `moved` blocks i `main.tf` sa state kunde flyttas till modul-adresser utan infrastrukturforlust.

---

## Steg 4: Outputs
Vi lade till `outputs.tf` med bland annat:
- `namespace`
- `app_url`
- `redis_dns`
- `resource_summary`

Efter `terraform apply` visades outputs korrekt.

---

## Viktiga hinder/blockers och hur vi loste dem
1. **Terraform providers mismatch / lock mismatch**
   - Losning: `terraform init` i ratt katalog.

2. **Ogiltig kubeconfig path i provider**
   - Losning: bytte till portabel path:
     - `config_path = abspath("${path.module}/../week6/m4k-gang-kubeconfig.yaml")`

3. **GCP auth blockerad i browserflow**
   - Losning: testade `--no-browser`, verifierade ADC, rensade credentials.

4. **Fel service account key (Option B)**
   - Losning: identifierade att keyn inte hade bucket-access.
   - Viktig larpunkt: en key kan vara giltig men anda sakna ratt IAM-roll for Terraform state.

5. **Plan-diff efter modulrefaktor**
   - Initialt diff inneholl destroy/update-risk.
   - Losning: kompatibilitetsjusteringar:
     - aterinforde vissa ConfigMaps
     - utokade modul med `env_from`, probes, portnamn
     - justerade labels/lifecycle for att minimera diff
   - Slutresultat: no-op plan pa infrastruktur.

---

## Slutresultat
Slutlig status:
- `terraform plan`: `0 to add, 0 to change, 0 to destroy`
- `terraform apply`: genomford utan infra-andringar (state + outputs uppdaterades)
- `kubectl get pods -n m4k-gang`: alla relevanta pods i `Running`
- `kubectl get svc -n m4k-gang`: `api-service`, `frontend-service`, `redis-service` finns och ar friska

### Bedomning mot krav
- Bronze: klar
- Silver: klar

---

## Filer som skapades/uppdaterades under passet (urval)
- `week7-terraform/versions.tf` (GCS backend)
- `week7-terraform/provider.tf` (portabel kubeconfig path)
- `week7-terraform/variables.tf`
- `week7-terraform/main.tf` (moduler + moved blocks + kompatibilitet)
- `week7-terraform/modules/k8s-app/main.tf`
- `week7-terraform/outputs.tf`
- `week7-terraform/terraform.tfvars`
- `week7-terraform/example.tfvars`
- `week7-terraform/.gitignore`
- `week7-terraform/ingress.tf`
- `week7-terraform/monitor.tf`

---

## Lararenspektiv / pedagogiska nyckelpoanger
1. Auth och IAM ar ofta den verkliga blockeraren, inte Terraform-syntax.
2. `moved` blocks ar centralt vid refaktorering till moduler om man vill undvika destroy/recreate.
3. En "fungerande token" betyder inte automatiskt "ratt behorigheter".
4. Saker migration till remote state ar lika mycket process som teknik: verifiera alltid med `plan` fore `apply`.
