variable "ssh_key_fingerprint" {
  description = "MD5 fingerprint of an SSH key already present in the Hetzner account (Hetzner rejects duplicate uploads, so we look it up). Find yours with: ssh-keygen -lf <key>.pub -E md5"
  type        = string
  default     = "e5:bc:c9:29:dd:d2:0b:e8:cd:bc:d1:43:69:c2:9f:c9"
}

variable "server_type" {
  description = "Hetzner server type. cax31 = ARM64, 4 vCPU, 8 GB."
  type        = string
  default     = "cax31"
}

variable "location" {
  description = "Hetzner location (nbg1/fsn1/hel1 all offer ARM)."
  type        = string
  default     = "nbg1"
}

variable "image" {
  description = "Base OS image."
  type        = string
  default     = "ubuntu-24.04"
}

variable "cloudflare_zone" {
  description = "Cloudflare zone (apex domain) the DNS record lives in."
  type        = string
  default     = "barfiagyenim.dev"
}

variable "subdomain" {
  description = "Subdomain for the demo; joined with the zone as <subdomain>.<zone>."
  type        = string
  default     = "ay"
}

variable "ssh_allowed_ips" {
  description = "CIDRs allowed to reach SSH (22). Lock this to your IP in production."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}
