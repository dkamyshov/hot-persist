#!/bin/sh

set -e

CWD=$(pwd)

rm -rf *.tgz
FILENAME="$(npm pack)"

# Why all "repositories" use npm instead of yarn:
# Turns out, until very recently (yarn v3 - https://github.com/yarnpkg/berry/pull/5203),
# yarn haven't been updating packages installed with "file:" protocol
# if the contents have changed but version stayed the same. This has been an
# issue for a very long time, see https://github.com/yarnpkg/yarn/issues/2165.
# One workaround is to specify a random version each time
# the integration tests are ran (before `npm pack`), but this also needed to be
# safely reverted back after each test run as well. I decided that it's
# just too much hassle, as npm doesn't have this bug and switching is
# quite simple.

# prepare repositories

cd "$CWD/integration-tests/repositories/webpack4"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/webpack5"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/webpack5-getter"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/vite2"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/vite3"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/vite4"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/vite5"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

cd "$CWD/integration-tests/repositories/parcel2"
npm ci # make sure to do `npm i` when creating a new test repo first
npm install --no-save "../../../$FILENAME"

# prepare the orchestrator

cd "$CWD/integration-tests/orchestrator"
yarn --check-files

# run tests

yarn playwright test
