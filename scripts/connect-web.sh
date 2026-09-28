#!/usr/bin/env bash
set -euo pipefail

remote_url="${1:?GitHub 공개 레포 SSH URL을 첫 번째 인자로 넣어 주세요.}"
test ! -e .git || { echo '이미 Git 레포입니다.' >&2; exit 1; }
git init -b main
git add .
git commit -m 'feat: initialize TREE FILM web'
git remote add origin "$remote_url"
git push -u origin main

