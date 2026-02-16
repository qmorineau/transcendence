SRC_DIR := srcs
OUT_DIR := ../dist
TAILWIND_INPUT := public/main.css
TAILWIND_OUTPUT := $(OUT_DIR)/main.css

all: $(OUT_DIR) init clean js cp-public tailwind

js:
	@echo -n "[FRONTEND] compiling TS                                             ...."
	@npx tsc
	@echo  "\r[FRONTEND] compiling TS                                             DONE"

cp-public:
	@echo -n "[FRONTEND] moving resources                                         ...."
	@cp -r public/* $(OUT_DIR)
	@echo  "\r[FRONTEND] moving resources                                         DONE"

init:
	@echo -n "[FRONTEND] checking/installing node modules                         ...."
	@npm install >/dev/null 2>/dev/null
	@echo   "\r[FRONTEND] checking/installing node modules                         DONE"
	@if [ ! -d "$(OUT_DIR)/node_modules/" ] || [ -z "$$(ls -A $(OUT_DIR)/node_modules/ 2>/dev/null)" ]; then \
		echo -n "[FRONTEND] copying neccesary modules to dist (Can take a minute)    ...."; \
		mkdir -p $(OUT_DIR)/node_modules/; \
		cp -r node_modules/@babylonjs/ $(OUT_DIR)/node_modules; \
		cp -r node_modules/babylonjs-gltf2interface/ $(OUT_DIR)/node_modules; \
		echo  "\r[FRONTEND] copying neccesary modules to dist (Can take a minute)    DONE"; \
	fi

$(OUT_DIR):
	@echo -n "[FRONTEND] creating dist dir                                        ...."
	@mkdir -p $(OUT_DIR)
	@echo  "\r[FRONTEND] creating dist dir                                        DONE"

tailwind: $(OUT_DIR)
	@echo -n "[FRONTEND] compiling Tailwind                                       ...."
	@DEBUG=1 npx tailwindcss -i ./$(TAILWIND_INPUT) -o $(TAILWIND_OUTPUT) --minify >/dev/null 2>/dev/null
	@echo  "\r[FRONTEND] compiling Tailwind                                       DONE"

clean:
	@echo -n "[FRONTEND] cleaning                                                 ...."
	@[ -d $(OUT_DIR) ] && find $(OUT_DIR)/* -maxdepth 0 ! -name node_modules -exec rm -rf {} \; || true
	@echo  "\r[FRONTEND] cleaning                                                 DONE"

fclean: 
	@echo -n "[FRONTEND] fcleaning                                                ...."
	@rm -rf $(OUT_DIR)
	@echo  "\r[FRONTEND] fcleaning                                                DONE"

re: fclean all

.PHONY: all js cp-public init $(OUT_DIR) tailwind clean fclean re 
