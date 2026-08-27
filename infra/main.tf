data "cloudflare_zone" "zone" {
  name = var.cloudflare_zone
}

data "hcloud_ssh_key" "operator" {
  fingerprint = var.ssh_key_fingerprint
}

resource "hcloud_firewall" "web" {
  name = "ay-portfolio-web"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = var.ssh_allowed_ips
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

resource "hcloud_server" "ay" {
  name         = "ay-portfolio"
  server_type  = var.server_type
  image        = var.image
  location     = var.location
  ssh_keys     = [data.hcloud_ssh_key.operator.id]
  firewall_ids = [hcloud_firewall.web.id]
  user_data    = file("${path.module}/cloud-init.yaml")
  labels       = { app = "ay-portfolio" }
}

resource "cloudflare_record" "ay" {
  zone_id = data.cloudflare_zone.zone.id
  name    = var.subdomain
  type    = "A"
  content = hcloud_server.ay.ipv4_address
  proxied = false
  ttl     = 120
}
