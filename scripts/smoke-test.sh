#!/usr/bin/env bash
# Cascade 烟雾测试 — 端到端验证
set -e

PORT=${CASCADE_PORT:-8765}
BASE="http://127.0.0.1:${PORT}"
PASS=0
FAIL=0

check() {
  local desc="$1"
  printf "  %-50s " "$desc"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "✓ PASS"
    PASS=$((PASS + 1))
  else
    echo "✗ FAIL"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Cascade Smoke Tests ==="
echo "Target: $BASE"
echo ""

echo "--- Health & Admin ---"
check "GET /health returns ok" curl -sf "$BASE/health"
check "GET /admin serves HTML" bash -c "curl -sf '$BASE/admin' | grep -q '<!DOCTYPE html>'"
check "GET /admin/status has providers" bash -c "curl -sf '$BASE/admin/status' | grep -q 'deepseek'"

echo ""
echo "--- Provider Connection ---"
check "POST /admin/test/deepseek" bash -c "curl -sf -X POST '$BASE/admin/test/deepseek' | grep -q '\"ok\":true'"

echo ""
echo "--- Responses API: Non-streaming ---"
check "POST /v1/responses (non-streaming)" \
  bash -c "curl -sf -X POST '$BASE/v1/responses' -H 'Content-Type: application/json' -d '{\"model\":\"gpt-5.1\",\"input\":[{\"role\":\"user\",\"content\":\"Say hi\"}],\"max_output_tokens\":200,\"stream\":false}' | grep -q 'choices'"

echo ""
echo "--- Responses API: Streaming ---"
STREAM_OUT=$(curl -sf -N -X POST "$BASE/v1/responses" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-5.1","input":[{"role":"user","content":"Say hi"}],"max_output_tokens":200}' 2>&1)
check "Streaming: output_item.added" bash -c "echo '$STREAM_OUT' | grep -q 'response.output_item.added'"
check "Streaming: output_text.delta" bash -c "echo '$STREAM_OUT' | grep -q 'response.output_text.delta'"
check "Streaming: response.completed" bash -c "echo '$STREAM_OUT' | grep -q 'response.completed'"

echo ""
echo "--- Summary ---"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Some tests failed!"
  exit 1
else
  echo "✅ All smoke tests passed!"
fi
