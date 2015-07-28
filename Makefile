# A simple example of using Makefile in a JavaScript project

# Phony targets
.PHONY : all deps update-deps lint build test testem clean distclean deps help

# Disable built-in rules
.SUFFIXES:

# Subdir for node module dependencies
MODULES=node_modules
# Subdir for local node bin tools
BIN=$(MODULES)/.bin
# Subdir for bower front end component dependencies
BOWER=bower_components

# Project name
NAME=ermrest
# Distribution directory
DIST=dist
# Documentation directory
DOC=doc
# JavaScript source directory
JS=js
# Output package
PKG=$(DIST)/$(NAME).js
MIN=$(DIST)/$(NAME).min.js

# Target files
LINT=.make-lint
TEST=.make-test.js

# List of JS source files
SOURCE=$(JS)/main.js

# List of JS test specs
SPECS=$(JS)/main_spec.js

# "all" should build the package
all: build docs test

# Makes the full source package
$(PKG): $(SOURCE) $(LINT) $(DIST) Makefile
	cat $(SOURCE) > $(PKG)

# Makes the minified package (using 'closurecompiler')
$(MIN): $(SOURCE) $(LINT) $(DIST) $(BIN) Makefile
	$(BIN)/ccjs $(SOURCE) > $(MIN)

# Lints the changed source (using 'jshint')
$(LINT): $(SOURCE) $(BIN)
	$(BIN)/jshint $(filter $(SOURCE), $?)
	@touch $(LINT)

lint: $(LINT)

build: $(PKG) $(MIN)

docs: $(DOC)

$(DOC): $(SOURCE) $(BIN) Makefile
	$(BIN)/jsdoc --pedantic -d $(DOC) $(SOURCE)
	@touch $(DOC)

$(DIST):
	mkdir -p $(DIST)

# Installs Node modules locally
$(BIN): $(MODULES)
	@touch $(BIN)

$(MODULES): package.json
	npm install
	@touch $(MODULES)

# Installs Bower front end dependencies locally
$(BOWER): $(BIN) bower.json
	$(BIN)/bower install
	@touch $(BOWER)

deps: $(BIN) $(BOWER)

update-deps:
	npm update
	$(BIN)/bower update

clean:
	rm -rf $(DIST)
	rm -rf $(DOC)
	rm -f .make-*

distclean: clean
	rm -rf $(MODULES)
	rm -rf $(BOWER)

test: $(TEST)

$(TEST): $(SOURCE) $(SPECS) $(BIN)
	cat $(SOURCE) $(SPECS) > $(TEST)
	$(BIN)/mocha $(TEST) || (rm -f $(TEST) &&  exit 1)

testem:
	$(BIN)/testem

help: usage
usage:
	@echo "'make <target>' where <target> may be:"
	@echo "    all       - an alias for build"
	@echo "    build     - builds the package"
	@echo "    test      - runs tests"
	@echo "    deps      - local install of node and bower dependencies"
	@echo "    clean     - cleans the dist dir"
	@echo "    distclean - cleans the dist dir and the dependencies"
