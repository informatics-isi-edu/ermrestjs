# Makefile rules for ermrestjs package

# Disable built-in rules
.SUFFIXES:

# Project name
PROJ=ermrest

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

# Bower front end components
BOWER=bower_components

# JavaScript source and test specs
JS=js
ERR=errors

# Pure ERMrest API
JS_SRC=$(JS)/datapath.js \
	   $(JS)/ermrest.js \
	   $(JS)/filters.js \
	   $(JS)/utilities.js \
	   $(ERR)/networkerrors.js \
	   $(ERR)/validationerrors.js

# Angular-related API files
NG_SRC=$(JS)/ngermrest.js

# All source
SOURCE=$(JS_SRC) $(NG_SRC)

# Specs
SPECS=test/karma.conf.js

# Build target
BUILD=build

# Project package full/minified
PKG=$(BUILD)/$(PROJ).js
MIN=$(BUILD)/$(PROJ).min.js
NGAPI=$(BUILD)/ng$(PROJ).js

# Documentation target
DOC=doc
API=$(DOC)/api.md
JSDOC=jsdoc

# Hidden target files (for make only)
LINT=.make-lint
TEST=.make-test.js

.PHONY: all
all: $(BUILD) $(DOC)

# Build rule
$(BUILD): $(PKG) $(MIN) $(NGAPI)

# Rule to build the full library
$(PKG): $(JS_SRC) $(LINT) $(BIN)
	mkdir -p $(BUILD)
	cat $(JS_SRC) > $(PKG)

# Rule to build the minified package
$(MIN): $(JS_SRC) $(LINT) $(BIN)
	mkdir -p $(BUILD)
	$(BIN)/ccjs $(JS_SRC) --language_in=ECMASCRIPT5_STRICT > $(MIN)

# Rule to build the ng only api
$(NGAPI): $(NG_SRC) $(LINT) $(BIN)
	mkdir -p $(BUILD)
	cat $(NG_SRC) > $(NGAPI)

# Rule to lint the source (warn but don't terminate build on errors)
$(LINT): $(SOURCE) $(BIN)
	$(BIN)/jshint $(filter $(SOURCE), $?)  || true
	@touch $(LINT)

.PHONY: lint
lint: $(LINT)

# Rule for making markdown docs
$(DOC): $(API)

# Rule for making API doc
$(API): $(SOURCE) $(BIN)
	mkdir -p $(DOC)
	$(BIN)/jsdoc2md $(SOURCE) > $(API)

# jsdoc: target for html docs produced (using 'jsdoc')
$(JSDOC): $(SOURCE) $(BIN)
	mkdir -p $(JSDOC)
	$(BIN)/jsdoc --pedantic -d $(JSDOC) $(SOURCE)
	@touch $(JSDOC)

# Rule to ensure Node bin scripts are present
$(BIN): $(MODULES)
	@touch $(BIN)

# Rule to install Node modules locally
$(MODULES): package.json
	npm install
	@touch $(MODULES)

# Rule to install Bower front end components locally
$(BOWER): $(BIN) bower.json
	$(BIN)/bower install
	@touch $(BOWER)

.PHONY: deps
deps: $(BIN) $(BOWER)

.PHONY: updeps
updeps:
	npm update
	$(BIN)/bower update

# Rule to clean project directory
.PHONY: clean
clean:
	rm -rf $(BUILD)
	rm -rf $(JSDOC)
	rm -f .make-*

# Rule to clean the dependencies too
.PHONY: distclean
distclean: clean
	rm -rf $(MODULES)
	rm -rf $(BOWER)

.PHONY: test
test: $(TEST)

# Rule to run the unit tests
$(TEST): $(SOURCE) $(SPECS) $(BIN) $(BOWER) test/*.js
	$(BIN)/karma start test/karma.conf.js
	@touch $(TEST)

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all       - runs build and doc"
	@echo "    deps      - local install of node and bower dependencies"
	@echo "    updeps    - update local dependencies"
	@echo "    lint      - lint the source"
	@echo "    build     - builds the package"
	@echo "    test      - runs commandline tests"
	@echo "    doc       - make autogenerated markdown docs"
	@echo "    jsdoc     - make autogenerated html docs"
	@echo "    clean     - cleans the dist dir"
	@echo "    distclean - cleans the dist dir and the dependencies"

