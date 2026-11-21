terraform {
 required_version = ">= 1.6"
 required_providers { digitalocean = { source = "digitalocean/digitalocean", version = "~> 2.0" } }
}
provider "digitalocean" { token = var.digitalocean_token }
variable "digitalocean_token" { type = string sensitive = true }
variable "region" { type = string default = "nyc3" }
variable "node_count" { type = number default = 0
 validation { condition = var.node_count >= 0 && var.node_count <= 64 && floor(var.node_count) == var.node_count
 error_message = "node_count must be integer between 0 and 64" }
}
variable "size" { type = string default = "s-2vcpu-4gb" }
variable "ssh_key_fingerprints" { type = list(string) }
resource "digitalocean_droplet" "compute" {
 count = var.node_count
 name = format("tabor-compute-%02d", count.index + 1)
 image = "ubuntu-24-04-x64"
 region = var.region
 size = var.size
 ssh_keys = var.ssh_key_fingerprints
 monitoring = true
 tags = ["nathan-ai","tabor-compute","managed-terraform"]
 user_data = file("${path.module}/cloud-init.yaml")
}
output "node_names" { value = digitalocean_droplet.compute[*].name }
output "node_ipv4" { value = digitalocean_droplet.compute[*].ipv4_address }
