# Week 6: Kubernetes on Google Cloud - M4K Gang

## 🎯 Your Team Information

- **Team Name:** M4K Gang
- **Namespace:** m4k-gang
- **App URL:** http://m4k-gang.chas.retro87.se
- **API Endpoint:** https://chas-academy-devops-2026.vercel.app/api/team-status
- **API Key:** `REPLACE_WITH_TEAM_FLAGS_API_KEY` _(set locally, do not commit the real value)_

---

# Week 6: Production Kubernetes Deployment on Google Cloud

## 🎯 Mission: Deploy Your Team's Microservices to Production

Welcome to your first **production cloud deployment**! You're not just learning Kubernetes—you're deploying a real application that integrates with **Team Flags Mission Control**.

### What You're Building

A **production-grade 3-tier microservices application** that:
- 📊 Reports your team's deployment health to the Team Flags dashboard
- 👥 Serves a public-facing team dashboard with real-time visitor tracking
- 🔐 Manages sensitive API credentials securely
- 🌐 Runs on Google's global cloud infrastructure (GKE)
- 📈 Auto-scales and self-heals using Kubernetes

**This is real DevOps work.** Your deployment will be monitored 24/7, and your team will earn points based on uptime and health metrics.

## 🏗️ Architecture: How Everything Connects

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
│                           ↓                                  │
│                  Ingress Controller                          │
│          (nginx - routes traffic by hostname)                │
└─────────────────────────────────────────────────────────────┘
                           ↓
    ┌──────────────────────┴──────────────────────┐
    ↓                                              ↓
┌─────────┐                                  ┌──────────┐
│Frontend │ ← nginx serves HTML/JS           │ Monitor  │
│(Port 80)│   proxies API requests →         │(Port N/A)│
└────┬────┘                                  └────┬─────┘
     ↓                                            ↓
┌─────────┐                              ┌────────────────┐
│   API   │ ← Node.js REST API           │  Team Flags    │
│(Port    │   manages data/state  →      │  Mission       │
│ 3000)   │                               │  Control       │
└────┬────┘                              └────────────────┘
     ↓                                   (External Service)
┌─────────┐                              https://chas-academy
│  Redis  │ ← In-memory cache                  -devops-2026
│(Port    │   stores visit counts              .vercel.app
│ 6379)   │
└─────────┘
```

### Component Responsibilities

| Service | Purpose | Why It Matters |
|---------|---------|----------------|
| **Frontend** | Public-facing dashboard showing team info and visitor stats | Users see this - represents your team |
| **API** | REST endpoints for data management and business logic | Backend processing, connects frontend to data |
| **Redis** | Fast in-memory database for session data and counters | Persistence across pod restarts |
| **Monitor** | Health checker that reports to Team Flags every 30s | Proves your deployment is running and earns points |
| **Ingress** | Routes external traffic to the right service | Makes your app accessible from the internet |

## 🎓 Key Learning Objectives

By completing this lab, you'll understand:

### Production Concepts
- ✅ **Service Discovery**: How pods find each other using DNS (not IP addresses!)
- ✅ **Secrets Management**: Protecting API keys and sensitive credentials
- ✅ **Health Monitoring**: External systems checking if your app is alive
- ✅ **High Availability**: Running multiple replicas for resilience
- ✅ **Configuration Management**: Separating config from code (12-Factor App)

### Kubernetes Resources
- ✅ **Deployments**: Manage replicated pods with rollout capabilities
- ✅ **Services**: Provide stable networking for ephemeral pods
- ✅ **ConfigMaps**: Store non-sensitive configuration
- ✅ **Secrets**: Store sensitive data (base64 encoded)
- ✅ **Ingress**: Route external HTTP/HTTPS traffic
- ✅ **RBAC**: Control what pods can access in the cluster

### DevOps Practices
- ✅ **Infrastructure as Code**: YAML manifests define your entire stack
- ✅ **Declarative Configuration**: Tell Kubernetes "what" not "how"
- ✅ **Observability**: Using logs, metrics, and health checks
- ✅ **Security First**: Least privilege, non-root containers, secret rotation

## 🔐 Security & Best Practices

### API Key Management (CRITICAL!)

Your team has a **unique API key** that authenticates with Team Flags. This is a **real secret** that must be protected.

**✅ Good Practices:**
```bash
# Stored in Kubernetes Secret (base64 encoded)
kubectl get secret monitor-secret -n m4k-gang -o jsonpath='{.data.API_KEY}' | base64 -d

# Environment variable injection (not visible in pod spec)
envFrom:
- secretRef:
    name: monitor-secret

# Never in logs
# Never committed to Git
# Never shared publicly
```

**❌ What NOT to do:**
```bash
# DON'T hardcode in Dockerfile
ENV API_KEY="tfk_abc123..."

# DON'T put in ConfigMap (not encrypted!)
data:
  API_KEY: "tfk_abc123..."

# DON'T echo in logs
console.log('API Key:', process.env.API_KEY)  // NO!

# DON'T commit .env files
# .env
API_KEY=tfk_abc123  # This would be exposed in Git!
```

**Why This Matters:**
- 🚨 Exposed API keys let anyone impersonate your team
- 🚨 Can submit false health data to Mission Control
- 🚨 Could delete your team's data or steal points
- 🚨 In real companies, exposed keys = security incident + possible breach

### Container Security

All our containers follow security best practices:
- 🔒 Run as non-root user (`USER node` in Dockerfile)
- 🔒 Read-only root filesystem (where possible)
- 🔒 Minimal base images (alpine Linux)
- 🔒 No secrets in environment variables (visible in `kubectl describe`)
- 🔒 Resource limits prevent DoS attacks

## 📋 Prerequisites

Before you begin:

✅ **kubectl installed** - Kubernetes command-line tool
✅ **Kubeconfig downloaded** - From Mission Control (team page)
✅ **Namespace exists** - Pre-created in GKE cluster: `m4k-gang`
✅ **API key assigned** - Pre-filled in your manifests
✅ **Basic terminal skills** - cd, ls, cat, grep

**Verify your setup:**
```bash
# Test kubectl connection
kubectl get nodes
# Expected: 3-5 nodes in Ready state

# Verify your namespace exists
kubectl get namespace m4k-gang
# Expected: Active

# Check resource quota
kubectl describe quota -n m4k-gang
# Expected: CPU and memory limits defined
```

## 🚀 Deployment Guide

### Step 1: Prepare Your Manifests

**Before deploying anything**, update all YAML files with your team name:

```bash
# Option A: Use sed (faster for all files)
sed -i 's/REPLACE_WITH_YOUR_TEAM_NAME/m4k-gang/g' *.yaml

# Option B: Manual editing (safer if you want to review)
# Open each file and replace:
# - REPLACE_WITH_YOUR_TEAM_NAME → m4k-gang (lowercase!)
# - REPLACE_WITH_YOUR_API_KEY → (should already be filled)

# Verify replacements
grep -n "REPLACE_WITH" *.yaml
# Expected: No matches (if all replaced correctly)
```

⚠️ **Important:** Use lowercase with hyphens (e.g., `lillteamet` not `Lillteamet`)

### Step 2: Deploy the Stack (Layer by Layer)

Deploy in **numbered order** - each layer depends on the previous one!

#### **Layer 1️⃣: Data Layer (Redis)**

Redis stores application state (visit counts). Deploy it first so API can connect.

```bash
kubectl apply -f 1-redis-deployment.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n m4k-gang --timeout=60s

# Verify Redis is running
kubectl get pods -n m4k-gang -l app=redis
# Expected: redis-xxx-yyy (1/1 Running)

# Check Redis logs
kubectl logs -l app=redis -n m4k-gang
# Expected: "Ready to accept connections"
```

**What's happening:**
- Kubernetes creates a Redis pod from the `redis:7-alpine` image
- ClusterIP service `redis-service` exposes port 6379 internally
- Other pods can reach it at `redis-service.m4k-gang.svc.cluster.local`

#### **Layer 2️⃣: API Configuration**

ConfigMap provides environment variables to the API container.

```bash
kubectl apply -f 2-api-config.yaml

# Verify ConfigMap created
kubectl get configmap api-config -n m4k-gang -o yaml

# Check what's in it
kubectl describe configmap api-config -n m4k-gang
# Expected: TEAM_NAME, REDIS_HOST, REDIS_PORT, etc.
```

**What's happening:**
- ConfigMap stores non-sensitive configuration (team name, Redis host, etc.)
- API pods will mount these as environment variables
- Changes require pod restart to take effect

**🔍 Service Discovery in Action:**
```yaml
data:
  REDIS_HOST: "redis-service"  # ← Kubernetes DNS magic!
```
The API will connect to `redis-service:6379` which Kubernetes resolves to the actual Redis pod IP.

#### **Layer 3️⃣: API Deployment**

The brain of your application - handles business logic and data.

```bash
kubectl apply -f 3-api-deployment.yaml

# Wait for API to be ready (this might take 30-60 seconds)
kubectl wait --for=condition=ready pod -l app=api -n m4k-gang --timeout=90s

# Check API logs (should show Redis connection)
kubectl logs -f deployment/api -n m4k-gang
# Expected: "Connected to Redis" and "API server listening on port 3000"

# Verify 2 replicas are running
kubectl get pods -n m4k-gang -l app=api
# Expected: api-xxx-yyy (2/2 Running)
```

**What's happening:**
- 2 API pods start (high availability - if one crashes, the other serves traffic)
- Each pod loads environment variables from `api-config` ConfigMap
- Pods connect to `redis-service` using Kubernetes DNS
- Service `api-service` load-balances traffic across both pods

**Test API internally:**
```bash
# Run a temporary pod to test the API
kubectl run test --rm -it --image=curlimages/curl -n m4k-gang -- \
  curl http://api-service:3000/health

# Expected: {"status":"healthy","redis":"connected"}
```

#### **Layer 4️⃣: Frontend Deployment**

Public-facing web UI that users will see.

```bash
kubectl apply -f 4-frontend-deployment.yaml

# Wait for frontend pods
kubectl wait --for=condition=ready pod -l app=frontend -n m4k-gang --timeout=60s

# Check frontend status
kubectl get pods -n m4k-gang -l app=frontend
# Expected: frontend-xxx-yyy (2/2 Running)

# Check logs
kubectl logs -f deployment/frontend -n m4k-gang
```

**What's happening:**
- 2 nginx pods serve static HTML/CSS/JS
- nginx proxies `/api/*` requests to `api-service:3000`
- Service `frontend-service` exposes port 80

**Frontend nginx configuration:**
```nginx
location / {
  root /usr/share/nginx/html;  # Serve static files
}

location /api/ {
  proxy_pass http://api-service:3000/;  # Proxy to API
}
```

#### **Layer 5️⃣: Monitor Setup (Team Flags Integration)**

This is where it gets real - your deployment will report to Mission Control!

```bash
# Create RBAC permissions (allows monitor to read cluster state)
kubectl apply -f 5-monitor-serviceaccount.yaml

# Create monitor configuration
kubectl apply -f 6-monitor-config.yaml

# Create API key secret (IMPORTANT: This is sensitive!)
kubectl apply -f 7-monitor-secret.yaml

# Verify secret created (but don't expose the value!)
kubectl get secret monitor-secret -n m4k-gang
# Expected: Opaque secret with 1 data field

# Deploy the monitor
kubectl apply -f 8-monitor-deployment.yaml

# Watch monitor logs (this is exciting!)
kubectl logs -f deployment/team-monitor -n m4k-gang
```

**What you should see in monitor logs:**
```
🔍 Performing health check for m4k-gang...
📊 Cluster Status:
   ✅ Pods: 5/5 running
   ✅ Deployments: 3/3 ready
   ✅ Services: 3/3 active
   ✅ Ingress: configured

🌐 Testing public endpoint...
   ✅ URL: http://m4k-gang.chas.retro87.se
   ✅ Status: 200 OK
   ✅ Response time: 45ms

📡 Reporting to Team Flags...
   ✅ Status: HEALTHY
   ✅ API Response: 200 OK
   ✅ Points awarded: +10

⏰ Next check in 30 seconds...
```

**🎯 This is the integration!** The monitor is:
1. Checking your Kubernetes cluster health (using RBAC permissions)
2. Testing your public URL
3. Sending health data to Team Flags API using your secret API key
4. Earning your team points for uptime

**Monitor RBAC explained:**
```yaml
# ServiceAccount: Identity for the monitor pod
# Role: Permissions (read pods, services, etc.)
# RoleBinding: Grants permissions to the ServiceAccount
```

This follows the **principle of least privilege** - monitor only gets permissions it needs!

#### **Layer 6️⃣: Expose to Internet (Ingress)**

Finally, make your app accessible to the world!

```bash
kubectl apply -f 9-ingress.yaml

# Check ingress status
kubectl get ingress -n m4k-gang

# Wait for external IP to be assigned (might take 1-2 minutes)
kubectl get ingress -n m4k-gang -w

# Expected output:
# NAME             HOSTS                           ADDRESS         PORTS
# team-dashboard   m4k-gang.chas.retro87.se       35.228.221.56   80
```

**What's happening:**
- Ingress controller (nginx) receives your ingress definition
- Routes traffic for `m4k-gang.chas.retro87.se` to `frontend-service:80`
- DNS already points `*.chas.retro87.se` to the ingress controller IP
- Now anyone on the internet can access your app!

### Step 3: Verify & Test

```bash
# Check everything is running
kubectl get all -n m4k-gang

# Expected output:
# - 5+ pods (all Running)
# - 3 deployments (all 2/2 or 1/1 ready)
# - 3 services (ClusterIP)
# - 1 ingress (with external IP)

# Test your public URL
curl http://m4k-gang.chas.retro87.se

# Expected: HTML dashboard with team name

# Test the API
curl http://m4k-gang.chas.retro87.se/api/team

# Expected: {"name":"m4k-gang","namespace":"m4k-gang","version":"1.0.0"}

# Increment visit counter
curl -X POST http://m4k-gang.chas.retro87.se/api/visits

# Expected: {"count":1}  (increases each time)
```

⚠️ **IMPORTANT: Chrome HSTS Warning**

If using **Google Chrome** to access your URL, you might see this error:

```
team-test.chas.retro87.se normally uses encryption to protect your information.
When Chrome tried to connect to team-test.chas.retro87.se this time, the website
sent back unusual and incorrect credentials...

You cannot visit team-test.chas.retro87.se right now because the website uses HSTS.
```

**What's happening:**
- **HSTS** (HTTP Strict Transport Security) is a security feature
- Chrome previously accessed `*.chas.retro87.se` via HTTPS
- Chrome cached an HSTS policy: "Always use HTTPS for this domain"
- Now Chrome **refuses to downgrade** to HTTP (even though we don't have SSL yet)
- **This is a security feature protecting you, not a bug!**

**Why Safari works but Chrome doesn't:**
- Safari doesn't have the HSTS cache for this domain
- Chrome remembers the previous HTTPS connection
- This shows how HSTS prevents protocol downgrade attacks!

**Solutions (choose one):**

**Option 1: Clear HSTS in Chrome** (Quick fix - 30 seconds)
```
1. Open Chrome and go to: chrome://net-internals/#hsts
2. Scroll to "Delete domain security policies"
3. Enter: m4k-gang.chas.retro87.se
4. Click "Delete"
5. Close the tab
6. Refresh your app URL
```

**Option 2: Use a different browser temporarily**
- ✅ **Safari** - works fine (no HSTS cache)
- ✅ **Firefox** - works fine
- ✅ **Incognito mode** - might work (depends on cache)

**Option 3: Deploy with SSL/TLS** (Production solution!)
- See the optional SSL/TLS challenge section below
- This is how you'd solve it in production
- Requires cert-manager to be installed

**This is actually a great learning moment!** HSTS prevents attackers from forcing your browser to use insecure HTTP. In production, you'd always use HTTPS, so this error would never happen.

### Step 4: Check Mission Control 🎉

1. **Open Team Flags**: https://chas-academy-devops-2026.vercel.app/teams
2. **Find your team** in the list
3. **Verify status**:
   - ✅ Deployment Status: HEALTHY
   - ✅ Last Check: < 1 minute ago
   - ✅ Uptime: Tracking starts now
   - ✅ Points: Being awarded every 30 seconds!

**Congratulations!** Your microservices are live in production! 🚀

## 🔍 Understanding Service Discovery

One of the **most important Kubernetes concepts** is how services find each other.

### How Pods Communicate

In traditional infrastructure:
```javascript
// ❌ Old way: Hardcoded IPs (brittle and doesn't scale)
redis.createClient({
  host: '10.0.45.123',  // What if this pod restarts?
  port: 6379
})
```

In Kubernetes:
```javascript
// ✅ New way: Service DNS (resilient and scalable)
redis.createClient({
  host: 'redis-service',  // Kubernetes DNS resolves this!
  port: 6379
})
```

### The Magic Behind `redis-service`

When you access `redis-service`:

1. **Kubernetes DNS** resolves it to `redis-service.your-namespace.svc.cluster.local`
2. **kube-proxy** translates this to one of the pod IPs (load balancing!)
3. **Service** routes traffic to a healthy pod based on label selectors
4. **If a pod crashes**, Kubernetes automatically removes it from the service
5. **New pods** are automatically added when they pass health checks

**Visual Example:**
```
API Pod calls redis-service:6379
           ↓
    Kubernetes DNS
           ↓
    kube-proxy (load balancer)
           ↓
    ┌──────┴──────┐
    ↓             ↓
Redis Pod 1   Redis Pod 2 (if scaled)
10.0.45.7     10.0.45.8
```

### Testing Service Discovery

```bash
# Exec into API pod
kubectl exec -it deployment/api -n m4k-gang -- sh

# Inside the pod, test DNS resolution
nslookup redis-service
# Shows: redis-service.m4k-gang.svc.cluster.local → 10.x.x.x

# Test connectivity
nc -zv redis-service 6379
# Shows: redis-service (10.x.x.x:6379) open

exit
```

## 📊 Kubernetes Resources Deep Dive

### Deployments: Managing Application Lifecycle

```yaml
spec:
  replicas: 2  # Always maintain 2 running pods
  strategy:
    type: RollingUpdate  # Zero-downtime deployments
    rollingUpdate:
      maxUnavailable: 1   # At least 1 pod always available
      maxSurge: 1         # At most 3 pods during update
```

**Try it yourself:**
```bash
# Scale frontend to 4 replicas
kubectl scale deployment frontend --replicas=4 -n m4k-gang

# Watch pods being created
kubectl get pods -n m4k-gang -w

# Scale back down
kubectl scale deployment frontend --replicas=2 -n m4k-gang
```

### Services: Stable Networking

```yaml
spec:
  type: ClusterIP  # Internal only (not exposed to internet)
  ports:
  - port: 3000          # Service listens on this port
    targetPort: 3000    # Forward to container port 3000
  selector:
    app: api  # Route to pods with this label
```

**Service Types:**
- `ClusterIP` - Internal only (API, Redis) ← We use this
- `NodePort` - Exposes on each node's IP
- `LoadBalancer` - Cloud load balancer (costs money!)

### ConfigMaps: Configuration Management

```bash
# View current config
kubectl get configmap api-config -n m4k-gang -o yaml

# Edit configuration
kubectl edit configmap api-config -n m4k-gang

# Restart API to pick up changes
kubectl rollout restart deployment/api -n m4k-gang
```

**Best Practice:** Separate config from code (12-Factor App principle)

### Secrets: Sensitive Data

```bash
# View secret (values are base64 encoded, not encrypted!)
kubectl get secret monitor-secret -n m4k-gang -o yaml

# Decode the API key
kubectl get secret monitor-secret -n m4k-gang \
  -o jsonpath='{.data.API_KEY}' | base64 -d

# ⚠️ Secrets are NOT encrypted by default in etcd!
# In production, use:
# - Sealed Secrets
# - External Secrets Operator
# - Cloud provider key management (Google Secret Manager, AWS Secrets Manager)
```

## 🐛 Troubleshooting Guide

### Pod Won't Start

```bash
# Check pod status
kubectl get pods -n m4k-gang

# Describe pod (shows events - very helpful!)
kubectl describe pod POD_NAME -n m4k-gang

# Common issues and solutions:
```

| Error | Cause | Solution |
|-------|-------|----------|
| `ImagePullBackOff` | Can't pull container image | Check `imagePullSecrets` exists |
| `CrashLoopBackOff` | Container keeps crashing | Check logs: `kubectl logs POD_NAME` |
| `Pending` | No resources available | Check quota: `kubectl describe quota` |
| `CreateContainerConfigError` | ConfigMap/Secret missing | Verify: `kubectl get cm,secret` |

### API Can't Connect to Redis

```bash
# 1. Verify Redis is running
kubectl get pods -l app=redis -n m4k-gang
# Expected: 1/1 Running

# 2. Check if Redis service exists
kubectl get svc redis-service -n m4k-gang
# Expected: ClusterIP with port 6379

# 3. Test from API pod
kubectl exec -it deployment/api -n m4k-gang -- sh
nc -zv redis-service 6379
# Expected: Connection succeeded

# 4. Check API logs for connection errors
kubectl logs deployment/api -n m4k-gang | grep -i redis
```

### Ingress Not Working (Can't Access URL)

```bash
# 1. Check ingress status
kubectl describe ingress -n m4k-gang

# 2. Verify backend service exists
kubectl get svc frontend-service -n m4k-gang

# 3. Test frontend internally first
kubectl run test --rm -it --image=curlimages/curl -n m4k-gang -- \
  curl http://frontend-service

# 4. Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=50

# 5. Wait for DNS propagation (can take 2-5 minutes)
nslookup m4k-gang.chas.retro87.se
```

### Monitor Not Reporting to Team Flags

```bash
# 1. Check monitor logs for errors
kubectl logs deployment/team-monitor -n m4k-gang --tail=100

# Common errors:
# - "401 Unauthorized" → API key is wrong
# - "403 Forbidden" → API key doesn't have permissions
# - "500 Internal Server Error" → Team Flags API issue
# - "Connection refused" → Network issue

# 2. Verify API key secret exists
kubectl get secret monitor-secret -n m4k-gang

# 3. Check if monitor has RBAC permissions
kubectl get rolebinding monitor-binding -n m4k-gang

# 4. Test API key manually
API_KEY=$(kubectl get secret monitor-secret -n m4k-gang -o jsonpath='{.data.API_KEY}' | base64 -d)
curl -X POST https://chas-academy-devops-2026.vercel.app/api/team-status \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"healthy","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
```

### Resource Quota Exceeded

```bash
# Check namespace quota
kubectl describe quota -n m4k-gang

# View current resource usage
kubectl top pods -n m4k-gang

# If quota exceeded:
# 1. Reduce replicas:
kubectl scale deployment frontend --replicas=1 -n m4k-gang

# 2. Or reduce resource requests in YAML and reapply
```

## 🎓 Production-Ready SSL/TLS Challenge

HTTP is fine for testing, but **production apps need HTTPS**!

### Why HTTPS Matters in Production

- 🔒 **Encryption**: Protects data in transit from eavesdropping
- ✅ **Trust**: Browsers show padlock, no "Not Secure" warnings
- 📈 **SEO**: Google ranks HTTPS sites higher in search results
- 🎯 **Modern Features**: Required for PWAs, Service Workers, Geolocation, Camera access
- 🛡️ **Security Headers**: Enables HSTS, preventing downgrade attacks
- 💳 **Compliance**: Required for PCI-DSS (payment processing)

### How HTTPS/TLS Works (Architecture Overview)

**Traditional Manual Process (Old Way):**
```
1. Buy SSL certificate from CA ($50-300/year)
2. Generate CSR (Certificate Signing Request)
3. Send CSR to CA, wait days for approval
4. Download certificate files
5. Upload to server, configure nginx/apache
6. Remember to renew in 1 year (often forgotten = outage!)
```

**Modern Automated Process (cert-manager + Let's Encrypt):**
```
┌─────────────────────────────────────────────────────────────┐
│  You: Deploy Certificate resource                           │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│  cert-manager: Watches for Certificate resources       │
│  - Sees new Certificate needs to be issued             │
│  - Creates CertificateRequest → Order → Challenge      │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│  ACME HTTP-01 Challenge Process:                       │
│  1. cert-manager creates temporary pod + ingress       │
│  2. Exposes /.well-known/acme-challenge/<token>        │
│  3. Let's Encrypt (CA) sends HTTP request to your URL  │
│  4. Verifies you control the domain                    │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│  Let's Encrypt: Issues signed certificate (90 days)    │
│  - Sends certificate back to cert-manager              │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│  cert-manager: Stores certificate in Kubernetes Secret │
│  - Updates Ingress to use the certificate              │
│  - Sets up auto-renewal (60 days before expiry)        │
└────────────────┬───────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────┐
│  Your App: Now accessible via HTTPS! 🎉                │
│  - https://m4k-gang.chas.retro87.se                   │
└────────────────────────────────────────────────────────┘

Auto-renewal happens automatically every 60 days (no human intervention!)
```

**Key Components:**

| Component | What It Does | Why It Matters |
|-----------|--------------|----------------|
| **cert-manager** | Kubernetes operator that automates certificate lifecycle | No manual certificate management! |
| **Let's Encrypt** | Free, automated Certificate Authority (CA) | Trusted by all browsers, zero cost |
| **ACME Protocol** | Automated Certificate Management Environment | Industry standard for domain validation |
| **HTTP-01 Challenge** | Proves you control the domain via HTTP | Works with any DNS provider! |
| **ClusterIssuer** | cert-manager config pointing to Let's Encrypt | Reusable across all namespaces |
| **Certificate** | Kubernetes resource requesting a cert | Declarative: "I want a cert for this domain" |
| **Secret** | Where the actual certificate is stored | Ingress mounts this for TLS termination |

### DNS & Certificate Validation (Technical Deep Dive)

**Your Setup:**
- Domain: `chas.retro87.se` (hosted on **DigitalOcean DNS**)
- DNS record: `*.chas.retro87.se` → `35.228.221.56` (Ingress IP)
- Cluster: **Google Cloud GKE** (europe-north1)
- cert-manager: **HTTP-01 challenge** (not DNS-01)

**Why HTTP-01 works with DigitalOcean DNS + GKE:**

```
┌──────────────────────────────────────────────────────────┐
│  Let's Encrypt (CA Server)                               │
│  Location: Internet (California)                         │
└───────────────┬──────────────────────────────────────────┘
                ↓ DNS Query: team-test.chas.retro87.se ?
┌───────────────────────────────────────────────────────────┐
│  DigitalOcean DNS                                         │
│  Returns: 35.228.221.56 (your Ingress IP)                │
└───────────────┬───────────────────────────────────────────┘
                ↓ HTTP GET /.well-known/acme-challenge/TOKEN
┌───────────────────────────────────────────────────────────┐
│  GKE Ingress Controller (nginx)                           │
│  Location: europe-north1 (Finland)                        │
│  IP: 35.228.221.56                                        │
└───────────────┬───────────────────────────────────────────┘
                ↓ Routes to challenge solver service
┌───────────────────────────────────────────────────────────┐
│  cert-manager HTTP Solver Pod                             │
│  Returns: <expected-token-response>                       │
│  Let's Encrypt verifies: ✅ You control this domain!      │
└───────────────────────────────────────────────────────────┘
```

**The beauty:** DNS provider doesn't matter! As long as DNS points to your ingress, HTTP-01 works. cert-manager doesn't need DigitalOcean API access.

### Verify cert-manager is Installed

✅ **Good news:** cert-manager is already installed in your cluster!

```bash
# Check cert-manager is running
kubectl get pods -n cert-manager

# Expected output:
# NAME                                       READY   STATUS    RESTARTS   AGE
# cert-manager-xxxxx                         1/1     Running   0          30m
# cert-manager-cainjector-xxxxx              1/1     Running   0          30m
# cert-manager-webhook-xxxxx                 1/1     Running   0          30m

# Check Let's Encrypt issuer is configured
kubectl get clusterissuer letsencrypt-prod

# Expected output:
# NAME               READY   AGE
# letsencrypt-prod   True    30m
```

If you see "True" for the ClusterIssuer, you're ready to request certificates!

### Enable SSL with cert-manager

**cert-manager** automatically requests, validates, and renews SSL certificates from Let's Encrypt.

**Step-by-step deployment:**

```bash
# 1. Deploy the Certificate resource
kubectl apply -f 10-certificate.yaml

# What happens immediately:
# - cert-manager detects new Certificate
# - Creates CertificateRequest → Order → Challenge
# - Spins up temporary HTTP solver pod
# - Creates temporary ingress for ACME challenge
```

```bash
# 2. Watch the certificate issuance process (2-5 minutes)
kubectl get certificate -n m4k-gang -w

# You'll see progression:
# NAME                 READY   SECRET               AGE
# team-dashboard-tls   False   team-dashboard-tls   5s    ← Created
# team-dashboard-tls   False   team-dashboard-tls   15s   ← Issuing
# team-dashboard-tls   True    team-dashboard-tls   120s  ← Ready! 🎉
```

```bash
# 3. Watch the ACME challenge (educational!)
kubectl get challenges -n m4k-gang -w

# You'll see:
# NAME                          STATE      DOMAIN                        AGE
# team-dashboard-tls-xxx        pending    m4k-gang.chas.retro87.se     10s
# team-dashboard-tls-xxx        valid      m4k-gang.chas.retro87.se     45s ← Challenge passed!
```

```bash
# 4. See the HTTP solver pod in action
kubectl get pods -n m4k-gang -l acme.cert-manager.io/http01-solver=true

# Temporary pod that serves the ACME challenge:
# NAME                        READY   STATUS    AGE
# cm-acme-http-solver-xxxxx   1/1     Running   30s
# (This pod automatically deletes after challenge completes!)
```

```bash
# 5. Verify certificate details
kubectl describe certificate team-dashboard-tls -n m4k-gang

# Key details:
# Status:
#   Conditions:
#     Message: Certificate is up to date and has not expired
#     Reason:  Ready
#     Status:  True
#   Not After:   2026-05-24T16:10:21Z  ← Expires in 90 days
#   Renewal Time: 2026-04-24T16:10:21Z ← Auto-renews 30 days before!
```

```bash
# 6. Check the TLS secret was created
kubectl get secret team-dashboard-tls -n m4k-gang -o yaml

# Contains:
# data:
#   tls.crt: <base64-encoded-certificate>
#   tls.key: <base64-encoded-private-key>
```

```bash
# 7. Verify certificate is from Let's Encrypt
kubectl get secret team-dashboard-tls -n m4k-gang \
  -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -issuer -subject -dates

# Output:
# issuer=C=US, O=Let's Encrypt, CN=R13  ← Trusted CA!
# subject=CN=m4k-gang.chas.retro87.se
# notBefore=Feb 23 16:10:22 2026 GMT
# notAfter=May 24 16:10:21 2026 GMT     ← Valid for 90 days
```

### Test HTTPS

```bash
# Test HTTPS access
curl https://m4k-gang.chas.retro87.se

# Check certificate in browser
open https://m4k-gang.chas.retro87.se
# Click padlock → Certificate → Details
# Issued by: Let's Encrypt
# Valid until: 90 days from now

# Test API over HTTPS
curl https://m4k-gang.chas.retro87.se/api/team

# Check security headers
curl -I https://m4k-gang.chas.retro87.se | grep -i strict

# Expected:
# strict-transport-security: max-age=31536000; includeSubDomains
# ↑ HSTS header: Browser will ALWAYS use HTTPS for 1 year!
```

### What You Just Deployed (Production-Grade Infrastructure!)

✅ **Automated Certificate Management**
- No manual renewals needed (auto-renews every 60 days)
- No certificate expiry outages
- Industry best practice (used by Netflix, Spotify, etc.)

✅ **Let's Encrypt Integration**
- Free certificates (normally $50-300/year)
- Trusted by all browsers (99.9% browser trust)
- Same security as paid certificates

✅ **ACME HTTP-01 Validation**
- Proves you control the domain
- No DNS provider API access needed
- Works across cloud providers

✅ **Kubernetes-Native**
- Certificate lifecycle managed as code
- Declarative configuration (GitOps-ready)
- Secrets automatically updated on renewal

✅ **Security Best Practices**
- TLS 1.2/1.3 only (no old protocols)
- HSTS enabled (prevents downgrade attacks)
- HTTP → HTTPS auto-redirect
- Modern cipher suites

### How Auto-Renewal Works

```
Day 0:   Certificate issued (valid 90 days)
Day 30:  cert-manager starts checking renewal
Day 60:  cert-manager triggers renewal process
         ↓
         1. Creates new private key
         2. Requests new certificate from Let's Encrypt
         3. Completes ACME challenge
         4. Updates Secret with new certificate
         5. Ingress picks up new cert (zero downtime!)
Day 90:  Old certificate would expire (but already renewed!)

Then the cycle repeats every 60 days. Forever. Automatically. 🎉
```

**This is how modern infrastructure works!** Set it up once, forget about it.

## 🧪 Experimentation & Learning

Once everything works, **experiment** to deepen your understanding!

### 1. Scale Your Application

```bash
# Simulate traffic spike - scale up!
kubectl scale deployment api --replicas=5 -n m4k-gang
kubectl scale deployment frontend --replicas=4 -n m4k-gang

# Watch load distribution
kubectl top pods -n m4k-gang

# Scale back down
kubectl scale deployment api --replicas=2 -n m4k-gang
```

### 2. Simulate Failures (Chaos Engineering!)

```bash
# Delete a pod and watch Kubernetes recreate it
POD=$(kubectl get pod -l app=api -n m4k-gang -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod $POD -n m4k-gang

# Watch replacement pod start
kubectl get pods -n m4k-gang -w

# Your app stayed online because you have 2 replicas!
```

### 3. Update Your Application

```bash
# Change something in the frontend HTML
kubectl edit deployment frontend -n m4k-gang
# (Change image tag or environment variables)

# Watch rolling update
kubectl rollout status deployment/frontend -n m4k-gang

# Rollback if needed
kubectl rollout undo deployment/frontend -n m4k-gang
```

### 4. Explore Data in Redis

```bash
# Connect to Redis CLI
kubectl exec -it deployment/redis -n m4k-gang -- redis-cli

# Inside Redis:
GET visit_count      # See current visitor count
INCR visit_count     # Manually increment
KEYS *               # List all keys
DBSIZE               # Count total keys
FLUSHDB              # Reset (careful!)
exit
```

### 5. Debug Like a Pro

```bash
# Stream logs from all API pods
kubectl logs -f deployment/api -n m4k-gang --all-containers=true

# Exec into a running container
kubectl exec -it deployment/api -n m4k-gang -- sh

# Inside container:
env                    # See all environment variables
ps aux                 # Running processes
netstat -tlnp          # Open ports
cat /etc/resolv.conf   # DNS configuration
exit

# Port-forward to access services locally
kubectl port-forward svc/api-service 3000:3000 -n m4k-gang
# Now visit http://localhost:3000 on your laptop!
```

### 6. Monitor Resource Usage

```bash
# Real-time resource usage
kubectl top pods -n m4k-gang
kubectl top nodes

# Detailed pod info
kubectl describe pod POD_NAME -n m4k-gang | grep -A 5 "Requests\|Limits"
```

## 🧹 Clean Up (When You're Done)

```bash
# Option 1: Delete all resources
kubectl delete -f . -n m4k-gang

# Option 2: Delete by type
kubectl delete deployment,service,ingress,configmap,secret --all -n m4k-gang

# Option 3: Keep namespace but remove specific app
kubectl delete deployment frontend api redis team-monitor -n m4k-gang
kubectl delete service frontend-service api-service redis-service -n m4k-gang
kubectl delete ingress team-dashboard -n m4k-gang
kubectl delete configmap api-config monitor-config -n m4k-gang
kubectl delete secret monitor-secret -n m4k-gang

# Verify cleanup
kubectl get all -n m4k-gang
# Expected: No resources (except default ServiceAccount)
```

⚠️ **Note:** Your namespace will remain (managed by cluster admin).

## 📚 Additional Resources

- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [12-Factor App Methodology](https://12factor.net/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/security-checklist/)

## ✅ Success Criteria Checklist

You've successfully completed Week 6 when:

### Basic Deployment (Required)
- [ ] All 5+ pods are Running
- [ ] Public URL loads the dashboard: `http://m4k-gang.chas.retro87.se`
- [ ] Visit counter increments on each refresh
- [ ] Monitor logs show successful health checks every 30 seconds
- [ ] Team Flags dashboard shows **HEALTHY** status
- [ ] You understand service discovery (how frontend → API → Redis works)
- [ ] You can explain what ConfigMaps and Secrets are for

### Understanding (Required)
- [ ] You can explain what each Kubernetes resource does (Deployment, Service, etc.)
- [ ] You understand why API keys must be protected
- [ ] You can troubleshoot a failing pod using `kubectl describe` and `kubectl logs`
- [ ] You know how to scale deployments up and down

### Production Ready (Optional Challenge)
- [ ] HTTPS enabled with cert-manager
- [ ] Public URL works with `https://` (with valid certificate)
- [ ] HTTP automatically redirects to HTTPS
- [ ] Certificate auto-renewal configured

**Congratulations!** You've deployed a production-grade microservices application to Google Kubernetes Engine! 🎉

This is **real DevOps work** - the exact same tools and practices used by companies running Kubernetes in production. You're not just learning - you're building something real that integrates with Team Flags Mission Control and earns your team points!

---

**Questions? Issues?** Check the troubleshooting section above, or ask in the Boiler Room session. Good luck! 🚀


