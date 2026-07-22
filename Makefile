
FILE = ./docker-compose.yml
URL_DOMAIN_NAME = ft_transcendence

KEY_DIR = ./nginx/certs

# fclean rebuild up all containers
all: key build up

# docker commands 
up:
	docker compose up -d

down:
	docker compose down

downv:
	docker compose down -v

stop:
	docker compose stop

start:
	docker compose start

status: 
	docker ps

build:
	docker compose build

fclean: downv
	docker system prune -af

key:
	@if [ ! -f $(KEY_DIR)/local.key ]; then \
		openssl req -x509 -nodes -days 365 \
		-newkey rsa:4096 \
		-keyout $(KEY_DIR)/local.key \
		-out $(KEY_DIR)/local.crt \
		-subj "/CN=$(URL_DOMAIN_NAME)"; \
	fi
