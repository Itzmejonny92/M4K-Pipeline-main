resource "kubernetes_service_account" "monitor_sa" {
  metadata {
    name      = "monitor-sa"
    namespace = var.namespace
    labels = {
      app        = "team-monitor"
      managed-by = "terraform"
    }
  }
}

resource "kubernetes_role" "monitor_role" {
  metadata {
    name      = "monitor-role"
    namespace = var.namespace
    labels = {
      managed-by = "terraform"
    }
  }

  rule {
    api_groups = [""]
    resources  = ["pods", "services"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["deployments", "replicasets"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["networking.k8s.io"]
    resources  = ["ingresses"]
    verbs      = ["get", "list", "watch"]
  }
}

resource "kubernetes_role_binding" "monitor_binding" {
  metadata {
    name      = "monitor-binding"
    namespace = var.namespace
    labels = {
      managed-by = "terraform"
    }
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "Role"
    name      = kubernetes_role.monitor_role.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.monitor_sa.metadata[0].name
    namespace = var.namespace
  }
}

resource "kubernetes_config_map" "monitor_config" {
  metadata {
    name      = "monitor-config"
    namespace = var.namespace
    labels = {
      app        = "team-monitor"
      managed-by = "terraform"
    }
  }

  data = {
    TEAM_NAME      = "m4k-gang"
    API_ENDPOINT   = "https://chas-academy-devops-2026.vercel.app/api/team-status"
    CHECK_INTERVAL = "30000"
  }
}

resource "kubernetes_secret" "monitor_secret" {
  metadata {
    name      = "monitor-secret"
    namespace = var.namespace
    labels = {
      app        = "team-monitor"
      managed-by = "terraform"
    }
  }

  type = "Opaque"
  data = {
    API_KEY = "tfk_kHurD4vB2Eww0R7no6gB2B4puX9gStv5WnGeEpi0kMM"
  }
}

resource "kubernetes_deployment" "team_monitor" {
  metadata {
    name      = "team-monitor"
    namespace = var.namespace
    labels = {
      app        = "team-monitor"
      managed-by = "terraform"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "team-monitor"
      }
    }

    template {
      metadata {
        labels = {
          app = "team-monitor"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.monitor_sa.metadata[0].name

        image_pull_secrets {
          name = "gcr-secret"
        }

        container {
          name              = "monitor"
          image             = "gcr.io/chas-devsecops-2026/team-monitor:v1"
          image_pull_policy = "Always"

          env_from {
            config_map_ref {
              name = kubernetes_config_map.monitor_config.metadata[0].name
            }
          }

          env {
            name = "API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.monitor_secret.metadata[0].name
                key  = "API_KEY"
              }
            }
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "100m"
              memory = "128Mi"
            }
          }

          liveness_probe {
            exec {
              command = ["node", "-e", "console.log('healthy')"]
            }
            initial_delay_seconds = 10
            period_seconds        = 30
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_role_binding.monitor_binding,
    kubernetes_config_map.monitor_config,
    kubernetes_secret.monitor_secret
  ]
}
