resource "kubernetes_config_map" "api_config" {
  metadata {
    name      = "api-config"
    namespace = var.namespace
    labels = {
      app        = "api"
      managed-by = "terraform"
    }
  }

  data = {
    TEAM_NAME  = "m4k-gang"
    namespace  = "m4k-gang"
    REDIS_HOST = "redis-service"
    REDIS_PORT = "6379"
    PORT       = "3000"
  }
}

resource "kubernetes_deployment" "api" {
  metadata {
    name      = "api"
    namespace = var.namespace
    labels = {
      app        = "api"
      tier       = "backend"
      managed-by = "terraform"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "api"
      }
    }

    template {
      metadata {
        labels = {
          app  = "api"
          tier = "backend"
        }
      }

      spec {
        image_pull_secrets {
          name = "gcr-secret"
        }

        container {
          name              = "api"
          image             = "gcr.io/chas-devsecops-2026/team-dashboard-api:v1"
          image_pull_policy = "Always"

          port {
            container_port = 3000
            name           = "http"
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.api_config.metadata[0].name
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "256Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 3000
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }

  depends_on = [kubernetes_deployment.redis]
}

resource "kubernetes_service" "api" {
  metadata {
    name      = "api-service"
    namespace = var.namespace
    labels = {
      app        = "api"
      managed-by = "terraform"
    }
  }

  spec {
    type = "ClusterIP"

    selector = {
      app = "api"
    }

    port {
      port        = 3000
      target_port = 3000
      protocol    = "TCP"
      name        = "http"
    }
  }
}
