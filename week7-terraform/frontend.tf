resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = var.namespace
    labels = {
      app        = "frontend"
      tier       = "frontend"
      managed-by = "terraform"
    }
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app  = "frontend"
          tier = "frontend"
        }
      }

      spec {
        image_pull_secrets {
          name = "gcr-secret"
        }

        container {
          name              = "frontend"
          image             = "gcr.io/chas-devsecops-2026/team-dashboard-frontend:v1"
          image_pull_policy = "Always"

          port {
            container_port = 80
            name           = "http"
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
              path = "/"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }

  depends_on = [kubernetes_deployment.api]
}

resource "kubernetes_service" "frontend" {
  metadata {
    name      = "frontend-service"
    namespace = var.namespace
    labels = {
      app        = "frontend"
      managed-by = "terraform"
    }
  }

  spec {
    type = "ClusterIP"

    selector = {
      app = "frontend"
    }

    port {
      port        = 80
      target_port = 80
      protocol    = "TCP"
      name        = "http"
    }
  }
}
