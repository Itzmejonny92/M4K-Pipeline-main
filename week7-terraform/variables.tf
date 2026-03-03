variable "namespace" {
  description = "Team namespace"
  type        = string
  default     = "m4k-gang"
}

variable "domain" {
  description = "Public hostname for ingress"
  type        = string
  default     = "m4k-gang.chas.retro87.se"
}

variable "enable_tls" {
  description = "Enable cert-manager Certificate and TLS on ingress"
  type        = bool
  default     = false
}

variable "cluster_issuer" {
  description = "cert-manager ClusterIssuer name"
  type        = string
  default     = "letsencrypt-prod"
}
