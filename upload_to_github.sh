#!/usr/bin/env bash
set -e

git config --global --add safe.directory "$(pwd)"
git config --global user.name "Panzqq"

git init
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/Panzqq/panpan-short-url.git

git add .
git commit -m "Simplify UI and add media tools" || true
git push -u origin main --force
