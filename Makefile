
FILE = ./docker-compose.yml
URL_DOMAIN_NAME = ft_transcendence

KEY_DIR = ./nginx/certs

# fclean rebuild up all containers
all: key build up

# docker commands 
up:
	docker compose up

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

key: $(KEY_DIR)
	@if [ ! -f $(KEY_DIR)/local.key ]; then \
		openssl req -x509 -nodes -days 365 \
		-newkey rsa:4096 \
		-keyout $(KEY_DIR)/local.key \
		-out $(KEY_DIR)/local.crt \
		-subj "/CN=$(URL_DOMAIN_NAME)"; \
	fi

$(KEY_DIR):
	mkdir -p $(KEY_DIR)
	echo "\033[0;36m[secrets dir created]\033[0m"