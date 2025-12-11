# Makefile rules for ermrestjs package

# Disable built-in rules
.SUFFIXES:

# make sure NOD_ENV is defined (use production if not defined or invalid)
ifneq ($(NODE_ENV),development)
NODE_ENV:=production
endif

# so npm scripts can also use it (without this, npm ci will install dev dependencies too by default)
export NODE_ENV

# env variables needed for installation
WEB_URL_ROOT?=/
WEB_INSTALL_ROOT?=/var/www/html/
ERMRESTJS_REL_PATH?=ermrestjs/

BUILD_VERSION:=$(shell date +%Y%m%d%H%M%S)

# where ermrestjs will be installed
ERMRESTJSDIR:=$(WEB_INSTALL_ROOT)$(ERMRESTJS_REL_PATH)

#chaise and ermrsetjs paths
ERMRESTJS_BASE_PATH:=$(WEB_URL_ROOT)$(ERMRESTJS_REL_PATH)

# Node module dependencies
MODULES=node_modules

VER=ermrest.ver.txt

# Build folder
DIST=dist

# Build rule
dist: deps dist-wo-deps

# Rule to build the package without dependencies
dist-wo-deps: print_variables build $(DIST)/$(VER)

# Rule to build the version number file
$(DIST)/$(VER): $(SOURCE) $(BIN)
	@mkdir -p $(DIST)
	$(info - creating $(DIST)/$(VER) version file)
	@git log --pretty=format:'%H' -n 1 > $(DIST)/$(VER)

# Rule to build the package
build:
	@npm run build

# make sure ERMRESTJSDIR is not the root
dont_deploy_in_root:
	@echo "$(ERMRESTJSDIR)" | egrep -vq "^/$$|.*:/$$"

print_variables:
	$(info =================)
	$(info NODE_ENV:=$(NODE_ENV))
	$(info BUILD_VERSION=$(BUILD_VERSION))
	$(info building and deploying to: $(ERMRESTJSDIR))
	$(info ERMrestJS will be accessed using: $(ERMRESTJS_BASE_PATH))
	$(info =================)

# dummy target to always run the targets that depend on it
FORCE:

# Rule for node deps
.PHONY: deps
deps:
	@npm clean-install

# for test cases we have to make sure we're installing dev dependencies
.PHONY: deps-test
deps-test:
	@npm clean-install --include=dev

# Rule to clean project directory
.PHONY: clean
clean:
	rm -rf $(DIST)
	rm -rf $(API)
	@rm -f .make-*

# Rule to clean the dependencies too
.PHONY: distclean
distclean: clean
	rm -rf $(MODULES)

# Rule to run the unit tests
.PHONY: test
test:
	node test/jasmine-runner.js

# Rule to run the unit tests
.PHONY: testsingle
test-single:
	node test/single-test-runner.js

# Rule to lint the source (terminate build on errors)
.PHONY: lint
lint:
	$(info - running linter)
	@npm run lint

.PHONY: lint-w-warn
lint-w-warn:
	@npm run lint-w-warn

# rule to make sure there's no error and build the package and docs
.PHONY: all
all: lint dist

# Rule to deploy the already built package
.PHONY: deploy
deploy: dont_deploy_in_root
	$(info - deploying the package)
	@rsync -avz $(DIST)/ $(ERMRESTJSDIR)

# run dist and deploy with proper uesrs (GNU). only works with root user
.PHONY: root-install
root-install:
	su $(shell stat -c "%U" Makefile) -c "make dist"
	make deploy

# run dist and deploy with proper uesrs (FreeBSD and MAC OS X). only works with root user
.PHONY: root-install-alt
root-install-alt:
	su $(shell stat -f '%Su' Makefile) -c "make dist"
	make deploy

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all               - run linter, build the pacakge andand docs"
	@echo "    dist              - local install of node dependencies, and build the package"
	@echo "    deploy            - deploy the package to $(ERMRESTJSDIR)"
	@echo "    deps              - local install of node dependencies"
	@echo "    deps-test         - local install of dev node dependencies"
	@echo "    lint              - lint the source"
	@echo "    test              - run tests"
	@echo "    clean             - remove the files and folders created during build"
	@echo "    distclean         - the same as clean, and also removes npm dependencies"
	@echo "    root-install      - should only be used as root. will use dist with proper user and then deploy, for GNU systems"
	@echo "    root-install-alt  - should only be used as root. will use dist with proper user and then deploy, for FreeBSD and MAC OS X"
