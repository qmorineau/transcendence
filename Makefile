MAKEFLAGS += --no-print-directory

RESET=\033[0m
ACCENT=\033[38;5;45m
TITLE=\033[1;38;5;81m
SUCCESS=\033[1;38;5;82m
HIGHLIGHT=\033[1;38;5;214m
DETAIL=\033[38;5;250m

define BUILD_SUCCESS_MESSAGE
	@printf '\n$(ACCENT)+--------------------------------------------------------------+\n'
	@printf '$(ACCENT)| $(TITLE)ft_transcendance containers are ready$(ACCENT)                        |\n'
	@printf '$(ACCENT)+--------------------------------------------------------------+\n'
	@printf '$(ACCENT)| $(SUCCESS)[OK] Containers built successfully$(ACCENT)                           |\n'
	@printf '$(ACCENT)| $(DETAIL)App URL:      $(HIGHLIGHT)https://${shell hostname -s}:8080$(ACCENT)                          |\n'
	@printf '$(ACCENT)| $(DETAIL)ssh-pong:     $(HIGHLIGHT)ssh -p 2223 player@$(shell hostname -s)$(ACCENT)                    |\n'
	@printf '$(ACCENT)| $(DETAIL)grafana:     	$(HIGHLIGHT)https://localhost:3000$(ACCENT)                         |\n'
	@printf '$(ACCENT)| $(DETAIL)Credentials:  $(HIGHLIGHT)admin/admin1234$(ACCENT)                                |\n'
	@printf '$(ACCENT)+--------------------------------------------------------------+$(RESET)\n\n'
endef

	# @printf '$(ACCENT)| $(DETAIL)Monitoring:   $(HIGHLIGHT)<METRICS_DASHBOARD_URL>$(ACCENT)    |\n'

all: front build up
	$(BUILD_SUCCESS_MESSAGE)

full: front full-build full-up
	@cd srcs && docker compose -f compose.app.yml restart nginx
	$(BUILD_SUCCESS_MESSAGE)

front:
	@cd srcs/frontend/dev/ && make

clean_front:
	@cd srcs/frontend/dev/ && make clean

build:
	@cd srcs && docker compose -f compose.app.yml build

full-build:
	@cd srcs && docker compose -f compose.app.yml -f compose.ops.yml build

up:
	@cd srcs && docker compose  -f compose.app.yml up -d

full-up:
	@cd srcs && docker compose  -f compose.app.yml -f compose.ops.yml up -d

down:
	@cd srcs && docker compose -f compose.app.yml down

full-down:
	@cd srcs && docker compose -f compose.app.yml -f compose.ops.yml down

clean:  
	@cd srcs && docker compose -f compose.app.yml down -v --rmi all
	@cd srcs/frontend/dev/ && make clean

full-clean:
	@cd srcs && docker compose -f compose.app.yml -f compose.ops.yml down -v --rmi all
	@cd srcs/frontend/dev/ && make fclean

fclean: clean
	@cd srcs/frontend/dev/ && make fclean

re: down clean_front all

full-re: full-down clean_front full

re-backend:
	@cd srcs && docker compose -f compose.app.yml down node-app \ 
	&& docker compose  -f compose.app.yml build node-app  \
	&& docker compose -f compose.app.yml up -d node-app

nuke: fclean
	docker system prune -a

dev-backend:
	@cd srcs && docker compose -f compose.app.yml down app \
	 && docker compose -f compose.app.yml build app  \
	 && docker compose -f compose.app.yml up app

dev-ia:
	@cd srcs && docker-compose -f compose.app.yml down app AI \
	 && docker-compose -f compose.app.yml build app AI  \ 
	 && docker-compose -f compose.app.yml up app AI

test:
	$(BUILD_SUCCESS_MESSAGE)

.PHONY: all build up down clean fclean re nuke rm-logs front full full-build full-up full-down full-clean full-re clean_front
