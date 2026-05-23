#!/usr/bin/env bash
# Cascade — 交互式配置向导
set -e

BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
RESET="\033[0m"
DIM="\033[2m"

echo -e "${BOLD}${BLUE}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║       Cascade Setup Wizard           ║"
echo "  ║  多供应商 AI 编程 Harness 配置向导    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${RESET}"
echo ""

CONFIG_FILE="${1:-config.json}"

# 检查 Node.js
if ! command -v node &>/dev/null; then
  echo "Error: Node.js 18+ is required. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found v$(node -v))"
  exit 1
fi
echo -e "${GREEN}✓${RESET} Node.js $(node -v)"

# 配置端口
echo ""
echo -e "${BOLD}Proxy Port${RESET}"
read -p "Port [8765]: " PORT
PORT=${PORT:-8765}

# DeepSeek
echo ""
echo -e "${BOLD}DeepSeek V4 Pro${RESET}"
echo -e "${DIM}  Get API key: https://platform.deepseek.com/api_keys${RESET}"
read -p "  API Key (leave empty to skip): " DS_KEY

# Qwen
echo ""
echo -e "${BOLD}Qwen3-Coder (阿里云百炼)${RESET}"
echo -e "${DIM}  Get API key: https://bailian.console.aliyun.com/${RESET}"
read -p "  API Key (leave empty to skip): " QW_KEY

# Kimi
echo ""
echo -e "${BOLD}Kimi K2.6 (月之暗面)${RESET}"
echo -e "${DIM}  Get API key: https://platform.moonshot.cn/console/api-keys${RESET}"
read -p "  API Key (leave empty to skip): " KM_KEY

# GLM
echo ""
echo -e "${BOLD}GLM-5.1 (智谱清言)${RESET}"
echo -e "${DIM}  Get API key: https://open.bigmodel.cn/usercenter/apikeys${RESET}"
read -p "  API Key (leave empty to skip): " GL_KEY

# 生成配置
cat > "$CONFIG_FILE" << EOF
{
  "port": $PORT,
  "host": "127.0.0.1",
  "providers": {
    "deepseek": {
      "name": "DeepSeek V4 Pro",
      "model": "deepseek-v4-pro",
      "apiKey": "$DS_KEY"
    },
    "qwen": {
      "name": "Qwen3-Coder",
      "model": "qwen3-coder",
      "apiKey": "$QW_KEY"
    },
    "kimi": {
      "name": "Kimi K2.6",
      "model": "kimi-k2-0906-preview",
      "apiKey": "$KM_KEY"
    },
    "glm": {
      "name": "GLM-5.1",
      "model": "glm-4.6",
      "apiKey": "$GL_KEY"
    }
  },
  "modelMap": {
    "gpt-5.5": "deepseek",
    "gpt-5.1": "deepseek",
    "gpt-5": "deepseek",
    "gpt-4o": "deepseek",
    "claude-sonnet-4-6": "deepseek",
    "claude-opus-4-7": "deepseek"
  }
}
EOF

echo ""
echo -e "${GREEN}${BOLD}✓ Configuration saved to ${CONFIG_FILE}${RESET}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo "  1. Start Cascade:  node packages/proxy/cascade.mjs"
echo "  2. Open admin:     http://localhost:${PORT}/admin"
echo "  3. Read the docs:  docs/setup.zh-CN.md"
echo ""

# 测试连接
HAS_KEY=false
for k in "$DS_KEY" "$QW_KEY" "$KM_KEY" "$GL_KEY"; do
  [ -n "$k" ] && HAS_KEY=true && break
done

if $HAS_KEY; then
  echo -e "${BOLD}Start Cascade now?${RESET}"
  read -p "Start proxy server [Y/n]: " START
  START=${START:-y}
  if [[ "$START" =~ ^[Yy] ]]; then
    exec node "$(dirname "$0")/../packages/proxy/cascade.mjs"
  fi
fi
