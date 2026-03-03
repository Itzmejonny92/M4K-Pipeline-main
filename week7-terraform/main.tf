resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "terraform-demo"
    namespace = var.namespace

    labels = {
      managed-by = "terraform"
      team       = var.namespace
    }
  }

  data = {
    APP_ENV     = "production"
    APP_VERSION = "2.0.0"
    MANAGED_BY  = "terraform"
  }
}
