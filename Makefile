.PHONY: start stop install

install:
	npm install

start:
	npm run dev

stop:
	@pkill -f "vite" 2>/dev/null && echo "App stopped." || echo "App was not running."
