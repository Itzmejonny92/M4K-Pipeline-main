# Vecka 6 Lab 26/2 av Jonny Nguyen

Jag kopplade upp mig mot vårt GKE-kluster med personlig kubeconfig i WSL och verifierade resurser i namespace m4k-gang.

## Felsökning
Min deployment `jonny-hello` fastnade i `Pending`.
`kubectl describe pod` visade `Insufficient cpu` och `FailedScaleUp: GCE quota exceeded`.

## Lösning
Jag sänkte resource requests/limits och frigjorde kapacitet, därefter blev podden `Running`.

## Egen container
Jag byggde en egen Node.js-app (`jonny-hello`), pushade till Artifact Registry och deployade i klustret.
Jag verifierade appen via port-forward.

## Extra
Jag uppdaterade till `v2`, pushade ny image och verifierade att tjänsten svarade med `version: v2`.

**Status: Green**
