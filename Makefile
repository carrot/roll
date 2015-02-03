NPM = ./node_modules/.bin

%.min.js: %.js deps
	@$(NPM)/uglifyjs $< > $@ --comments '/Copyright/' --compress --mangle

deps:
	@npm install
