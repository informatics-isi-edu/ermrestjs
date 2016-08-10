# Makefile rules for ermrestjs package

# Disable built-in rules
.SUFFIXES:

# Install target
ERMRESTJSDIR?=/var/www/html/ermrestjs

# Project name
PROJ=ermrest

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

# JavaScript source and test specs
JS=js

# Project source files
SOURCE=$(JS)/core.js \
	   $(JS)/datapath.js \
	   $(JS)/filters.js \
	   $(JS)/utilities.js \
	   $(JS)/errors.js \
	   $(JS)/parser.js \
	   $(JS)/http.js \
	   $(JS)/reference.js \
	   $(JS)/node.js \
	   $(JS)/ng.js \

# Vendor libs; it installs everything in that dir
VENDOR=vendor
LIBS=$(patsubst %, $(ERMRESTJSDIR)/%, $(wildcard $(VENDOR)/*))

# Build target
BUILD=build

# Project package full/minified
PKG=$(PROJ).js
MIN=$(PROJ).min.js
VER=$(PROJ).ver.txt

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
$(BUILD): $(LINT) $(BUILD)/$(PKG) $(BUILD)/$(MIN) $(BUILD)/$(VER)

# Rule to build the library (non-minified)
.PHONY: package
package: $(BUILD)/$(PKG) $(BUILD)/$(VER)

# Rule to build the version number file
$(BUILD)/$(VER): $(SOURCE)
	mkdir -p $(BUILD)
	git log --pretty=format:'%H' -n 1 > $(BUILD)/$(VER)

# Rule to build the un-minified library
$(BUILD)/$(PKG): $(SOURCE)
	mkdir -p $(BUILD)
	cat $(SOURCE) > $(BUILD)/$(PKG)

# Rule to build the minified package
$(BUILD)/$(MIN): $(SOURCE) $(BIN)
	mkdir -p $(BUILD)
	$(BIN)/ccjs $(SOURCE) --language_in=ECMASCRIPT5_STRICT > $(BUILD)/$(MIN)

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

# Rule for node deps
.PHONY: deps
deps: $(BIN)

.PHONY: updeps
updeps:
	npm update

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

.PHONY: test
test:  $(TEST)

# Rule to run the unit tests
$(TEST): $(BUILD)/$(PKG)
	node test/jasmine-runner.js
	@touch $(TEST)

# Rule to install the package
.PHONY: install installm 
install: $(ERMRESTJSDIR)/$(PKG) $(ERMRESTJSDIR)/$(VER) $(LIBS)

installm: install $(ERMRESTJSDIR)/$(MIN)

# Rule to make deployment dir
# NOTE: we do not make the base dir, it must be present.
#       For example `/var/www/html/ermrestjs` will require
#       that `/var/www/html` exists. If it does not, then
#       the user must create it _before_ attempting to
#       install this package.
$(ERMRESTJSDIR): $(dir $(ERMRESTJSDIR))
	mkdir -p $(ERMRESTJSDIR)

$(ERMRESTJSDIR)/$(VENDOR): $(ERMRESTJSDIR)
	mkdir -p $(ERMRESTJSDIR)/$(VENDOR)

$(ERMRESTJSDIR)/$(VER): $(BUILD)/$(VER) $(ERMRESTJSDIR)
	cp $(BUILD)/$(VER) $(ERMRESTJSDIR)/$(VER)

$(ERMRESTJSDIR)/$(PKG): $(BUILD)/$(PKG) $(ERMRESTJSDIR)
	cp $(BUILD)/$(PKG) $(ERMRESTJSDIR)/$(PKG)

$(ERMRESTJSDIR)/$(MIN): $(BUILD)/$(MIN) $(ERMRESTJSDIR)
	cp $(BUILD)/$(MIN) $(ERMRESTJSDIR)/$(MIN)

# Rule to install vendor libs
$(ERMRESTJSDIR)/$(VENDOR)/%: $(VENDOR)/% $(ERMRESTJSDIR)/$(VENDOR)
	cp -f $< $@

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all       - build and docs"
	@echo "    deps      - local install of node and bower dependencies"
	@echo "    updeps    - update local dependencies"
	@echo "    install   - installs the package (ERMRESTJSDIR=$(ERMRESTJSDIR))"
	@echo "    installm  - also installs the minified package"
	@echo "    lint      - lint the source"
	@echo "    build     - lint, package and minify"
	@echo "    package   - concatenate into package"
	@echo "    test      - run tests"
	@echo "    doc       - make autogenerated markdown docs"
	@echo "    jsdoc     - make autogenerated html docs"
	@echo "    clean     - cleans the build environment"
	@echo "    distclean - cleans and removes dependencies"
