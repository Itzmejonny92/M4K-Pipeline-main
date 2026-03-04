provider "kubernetes" {
  config_path = abspath("${path.module}/../week6/m4k-gang-kubeconfig.yaml")
}
