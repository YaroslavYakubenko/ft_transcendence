# Prometheus

This directory contains the Prometheus configuration used by the monitoring stack.

## Contents

- `prometheus.yml`: scrape jobs for the app and exporters
- `alerts.yml`: alert rule definitions loaded by Prometheus

## Scrape Targets

The current config scrapes:

- `prometheus:9090`
- `backend:8000` at `/metrics`
- `nginx_exporter:9113`
- `node_exporter:9100`
- `cadvisor:8080`

## Notes

- Prometheus is mounted at `/etc/prometheus/prometheus.yml` and `/etc/prometheus/alerts.yml` in Compose.
- Add new jobs in `prometheus.yml` when new monitoring services are introduced.

## Adding a Scrape Job

1. Add a new `job_name` block in `prometheus.yml`.
2. Point `static_configs.targets` at the service name and port on the Compose network.
3. Set `metrics_path` if the endpoint is not `/metrics`.
4. Restart Prometheus with `docker compose restart prometheus`.
