# Grafana

This directory contains Grafana provisioning for the monitoring stack.

## Contents

- `provisioning/datasources/prometheus.yml`: default Prometheus data source
- `provisioning/dashboards/dashboards.yml`: dashboard provider configuration
- `dashboards/monitoring-overview.json`: starter overview dashboard

## Notes

- Grafana mounts this directory at `/etc/grafana/provisioning` and `/etc/grafana/dashboards` through `docker-compose.yml`.
- The default datasource name is `Prometheus` and it points to `http://prometheus:9090` inside the Compose network.
- The overview dashboard is automatically imported into the `Monitoring` folder on startup.

## Access

- Open Grafana at `http://localhost:3000`
- On a fresh data volume, login with `admin` / `admin`
- If the admin password is unknown, reset it with `docker compose exec grafana grafana cli admin reset-admin-password <new-password>`

## Adding Dashboards

- Drop additional dashboard JSON files into `dashboards/`
- Register new file providers in `provisioning/dashboards/dashboards.yml` if you add more folders or sources
