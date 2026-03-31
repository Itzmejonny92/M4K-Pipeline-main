# K8s-migrering: Sammanfattning och förklaring

Här är en kort, pedagogisk sammanfattning av vad jag gjorde för att konvertera projektet till Kubernetes-manifests och varför.

Översikt
- Projektet är en enkel Node.js Express-app som lyssnar på port 3000.
- Skapade en `k8s/`-mapp med manifest för Namespace, ConfigMap, Deployment och Service.

Vad jag skapade och varför
- `namespace.yaml` — isolerar resurser i namespace `boiler-room`.
- `configmap.yaml` — innehåller miljövariabler (ex. `PORT`) så att vi separerar konfiguration från kod.
- `backend-deployment.yaml` — kör applikationen som en Deployment med:
  - `replicas: 2` för high availability
  - liveness & readiness probes (`/health`) så Kubernetes kan kontrollera att podden fungerar och ta bort den från trafik om den inte är redo
  - resource `requests` och `limits` för att hjälpa schemaläggning och undvika resursöverskridning
  - envFrom `ConfigMap` så vi enkelt kan ändra konfiguration utan att bygga om bilden
- `backend-service.yaml` — Service av typ `NodePort` (nodePort `30030`) så appen kan nås från värden för demo/validering. Alternativt port-forward rekommenderas.

Varför dessa val?
- I Docker Compose är en "service" både körning och nätverks-exponering. I K8s delar vi det upp: Deployment hanterar pods/repliker, Service hanterar nätverk.
- Probes är viktiga för automatiserad återstart och för att undvika att skicka trafik till en inte-färdig container.
- Resource requests/limits gör klustret stabilare när flera pods körs samtidigt.

Hur du kör detta lokalt (snabbguide)

1) Bygg bilden lokalt:

```bash
docker build -t m4k-pipeline:local .
```

2) Om du använder kind, ladda bilden in i klustret:

```bash
kind load docker-image m4k-pipeline:local --name boiler-room
```

3) Använd kubectl för att skapa resurser:

```bash
kubectl apply -f k8s/
kubectl get all -n boiler-room
```

4) Testa appen:

```bash
kubectl port-forward service/first-pipeline 3000:3000 -n boiler-room
curl http://localhost:3000/health
```

Felsökningstips
- `kubectl get pods -n boiler-room` — titta efter `CrashLoopBackOff` eller `ImagePullBackOff`.
- `kubectl describe pod <pod> -n boiler-room` — se Events och orsaker.
- `kubectl logs <pod> -n boiler-room` — titta på applikationsloggar.

Nästa steg (för att nå Silver/Gold/Diamond nivåer)
- Lägg till en StatefulSet och ett PVC för en riktig databas (om du behöver persistens).
- Använd Secrets för känslig konfiguration.
- Lägg till en `kustomization.yaml` eller ett enkelt deploy-script för enklare återuppspelning.

Behöver du att jag också:
- Bygger och laddar bilden automatiskt i din lokale kind-kluster (kan göra det om du tillåter mig att köra terminalkommandon).
- Lägger till en `ServiceMonitor` eller Prometheus-export för metrics.

— Slut på sammanfattning
