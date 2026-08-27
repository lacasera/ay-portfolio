# infra — provisioning ay.barfiagyenim.dev

Terraform for the live deployment: one Hetzner CAX31 (ARM, 8 GB) behind Cloudflare,
with a firewall that exposes only SSH/HTTP/HTTPS. The app itself is shipped and started
by [`scripts/deploy.sh`](../scripts/deploy.sh) once the server exists.

## What it creates

- `hcloud_server` — CAX31, Ubuntu 24.04, `nbg1`; cloud-init installs Docker + the compose
  plugin and sets `vm.max_map_count=262144` (OpenSearch won't start without it).
- `hcloud_firewall` — inbound `22`, `80`, `443` only.
- `hcloud_ssh_key` — your public key, for access.
- `cloudflare_record` — `A ay → <server IP>`, DNS-only (Caddy serves its own Let's Encrypt cert).

## Prerequisites

- Terraform ≥ 1.6 (`brew install terraform`).
- The Doppler CLI, authenticated, with a config that exposes:
  - `HCLOUD_TOKEN` — Hetzner Cloud API token (read/write).
  - `CLOUDFLARE_API_TOKEN` — scoped to the `barfiagyenim.dev` zone with **Zone:Read + DNS:Edit**
    (the same token Caddy uses for the DNS-01 challenge).
- An SSH key at `~/.ssh/id_ed25519.pub` (or set `ssh_public_key_path`).

## Usage

```bash
cd infra
doppler run -- terraform init
doppler run -- terraform apply

# Wire the server IP into the deploy step:
export DEPLOY_HOST=$(terraform output -raw server_ip)

# Ship + start the app and load data (from the repo root):
cd ..
doppler run -- ./scripts/deploy.sh
```

`terraform output url` prints the live URL. First boot is slow — OpenSearch downloads the
embedding model during `bootstrap-data.sh`, which polls until it's ready.

## Teardown

```bash
cd infra
doppler run -- terraform destroy
```

## Notes

- State is local and gitignored (it holds the server IP); `terraform.tfvars` is gitignored too.
  `.terraform.lock.hcl` is committed to pin provider versions.
- Lock SSH down by setting `ssh_allowed_ips = ["<your-ip>/32"]` in `terraform.tfvars`.
- To move off `barfiagyenim.dev` or the `ay` subdomain, override `cloudflare_zone` / `subdomain`
  and set a matching `CADDY_SITE_ADDRESS` in the deploy environment.
