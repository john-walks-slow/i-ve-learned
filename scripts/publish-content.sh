#!/usr/bin/env bash
set -euo pipefail

MSG="${1:-content: 更新学习记录}"

echo "==> 运行构建快检..."
pnpm build

echo "==> 暂存并提交内容..."
git add content/
if git diff --staged --quiet; then
  echo "没有需要提交的 content 变更。"
else
  git commit -m "$MSG"
  git push origin main
  echo "✓ 提交并推送成功，GitHub Actions 正在后台自动部署。"
fi
