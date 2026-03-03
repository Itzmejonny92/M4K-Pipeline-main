resource "kubernetes_deployment" "redis" {
  metadata {
    name      = "redis"
    namespace = var.namespace
    labels = {
      app        = "redis"
      tier       = "database"
      managed-by = "terraform"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "redis"
      }
    }

    template {
      metadata {
        labels = {
          app  = "redis"
          tier = "database"
        }
      }

      spec {
        container {
          name  = "redis"
          image = "redis:7-alpine"

          port {
            container_port = 6379
            name           = "redis"
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
            tcp_socket {
              port = 6379
            }
            initial_delay_seconds = 5
            period_seconds        = 10
          }

          readiness_probe {
            exec {
              command = ["redis-cli", "ping"]
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "redis" {
  metadata {
    name      = "redis-service"
    namespace = var.namespace
    labels = {
      app        = "redis"
      managed-by = "terraform"
    }
  }

  spec {
    selector = {
      app = "redis"
    }

    port {
      port        = 6379
      target_port = 6379
      protocol    = "TCP"
      name        = "redis"
    }
  }
}
