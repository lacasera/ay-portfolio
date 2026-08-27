output "server_ip" {
  description = "Public IPv4 of the VM (use as DEPLOY_HOST for scripts/deploy.sh)."
  value       = hcloud_server.ay.ipv4_address
}

output "url" {
  description = "The live URL once the stack is deployed."
  value       = "https://${var.subdomain}.${var.cloudflare_zone}"
}
