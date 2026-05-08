#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Real end-to-end test: log in as admin, add a board member, verify it
# was persisted, then clean up. Mirrors what the /org page does.
#
# Default credentials (from the user request):
#   ADMIN_EMAIL=blumark24@gmail.com
#   ADMIN_PASS=Jx@1234567
#
# Usage (production):
#   SUPABASE_URL=https://xxx.supabase.co \
#   ANON_KEY=eyJ... \
#   bash scripts/test-add-board-member.sh
#
# Optional:
#   SERVICE_KEY=eyJ...      # used only for cleanup at the end
#   KEEP=1                  # don't delete the test row at the end
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:?set SUPABASE_URL (e.g. https://xxx.supabase.co)}"
ANON_KEY="${ANON_KEY:?set ANON_KEY (NEXT_PUBLIC_SUPABASE_ANON_KEY)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-blumark24@gmail.com}"
ADMIN_PASS="${ADMIN_PASS:-Jx@1234567}"
SERVICE_KEY="${SERVICE_KEY:-}"
KEEP="${KEEP:-0}"

TEST_NAME="اختبار آلي $(date +%s)"
TEST_ROLE="عضو مجلس الإدارة"
TEST_EMAIL="board-test+$(date +%s)@blumark24.com"
TEST_PHONE="0500000000"

PASS=0; FAIL=0
ok()   { echo "  ✅ PASS — $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ FAIL — $1"; FAIL=$((FAIL+1)); }

py_get() {
  python3 -c "import sys,json
try:
    d=json.load(sys.stdin)
    if isinstance(d, list):
        d=d[0] if d else {}
    print(d.get('$1',''))
except Exception:
    print('')" 2>/dev/null || echo ""
}

echo ""
echo "════════════════════════════════════════════════════"
echo "  Blumark24 — Add Board Member End-to-End Test"
echo "════════════════════════════════════════════════════"
echo "  Supabase: $SUPABASE_URL"
echo "  Admin:    $ADMIN_EMAIL"
echo "  Member:   $TEST_NAME ($TEST_ROLE)"
echo ""

# ── STEP 1: Sign in as admin ─────────────────────────────────────────
echo "▶ Step 1: Sign in as admin"
SIGNIN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
ACCESS_TOKEN=$(echo "$SIGNIN" | py_get access_token)

if [ -z "$ACCESS_TOKEN" ]; then
  fail "Admin login failed"
  echo "  Response: $SIGNIN"
  exit 1
fi
ok "Admin signed in, JWT obtained"

# ── STEP 2: Confirm caller is recognised as admin (read profile) ─────
echo ""
echo "▶ Step 2: Read caller profile (RLS sanity check)"
ME=$(curl -s "$SUPABASE_URL/auth/v1/user" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
ME_EMAIL=$(echo "$ME" | py_get email)
[ "$ME_EMAIL" = "$ADMIN_EMAIL" ] && ok "Caller email matches: $ME_EMAIL" \
                                  || fail "Caller email mismatch (got: $ME_EMAIL)"

# ── STEP 3: Insert a board_member row through PostgREST + RLS ────────
echo ""
echo "▶ Step 3: Insert board_member (mirrors the /org Save button)"
INSERT_RESP=$(curl -s -w "\n__STATUS__%{http_code}" -X POST \
  "$SUPABASE_URL/rest/v1/board_members" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"name\":\"$TEST_NAME\",\"role\":\"$TEST_ROLE\",\"email\":\"$TEST_EMAIL\",\"phone\":\"$TEST_PHONE\",\"status\":\"نشط\"}")
HTTP_STATUS=$(echo "$INSERT_RESP" | grep __STATUS__ | sed 's/.*__STATUS__//')
BODY=$(echo "$INSERT_RESP" | sed '/__STATUS__/d')
NEW_ID=$(echo "$BODY" | py_get id)

echo "  HTTP $HTTP_STATUS"
echo "  Body: $BODY"

case "$HTTP_STATUS" in
  201|200) ok "INSERT returned HTTP $HTTP_STATUS" ;;
  *)       fail "INSERT returned HTTP $HTTP_STATUS (expected 201)" ;;
esac

[ -n "$NEW_ID" ] && ok "New board_member id: $NEW_ID" \
                 || fail "No id returned in insert response"

if [ -z "$NEW_ID" ]; then
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "  Results: $PASS passed / $((PASS+FAIL)) total"
  echo "  ⚠️  BLOCKED — INSERT failed, see body above"
  echo "════════════════════════════════════════════════════"
  exit 1
fi

# ── STEP 4: Read it back via the same RLS-protected SELECT ───────────
echo ""
echo "▶ Step 4: Read row back (verify SELECT works for caller)"
READ_BACK=$(curl -s \
  "$SUPABASE_URL/rest/v1/board_members?id=eq.$NEW_ID&select=id,name,role,email,phone,status" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
RB_NAME=$(echo "$READ_BACK" | py_get name)
[ "$RB_NAME" = "$TEST_NAME" ] && ok "Row reads back with name=$RB_NAME" \
                              || fail "Row not visible after insert (got: $READ_BACK)"

# ── STEP 5: List all board members (max 3 enforced client-side) ──────
echo ""
echo "▶ Step 5: List all current board members"
LIST=$(curl -s \
  "$SUPABASE_URL/rest/v1/board_members?select=id,name,role&order=created_at.asc" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
COUNT=$(echo "$LIST" | python3 -c "import sys,json
try: print(len(json.load(sys.stdin)))
except: print(0)" 2>/dev/null || echo 0)
echo "  Total members in DB: $COUNT"
[ "$COUNT" -ge 1 ] && ok "Board has $COUNT member(s)" \
                  || fail "Board appears empty after a successful insert"

# ── STEP 6: Cleanup (skipped if KEEP=1) ──────────────────────────────
if [ "$KEEP" = "1" ]; then
  echo ""
  echo "▶ Step 6: Skipping cleanup (KEEP=1) — row $NEW_ID left in DB"
else
  echo ""
  echo "▶ Step 6: Delete the test row"
  DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
    "$SUPABASE_URL/rest/v1/board_members?id=eq.$NEW_ID" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Prefer: return=minimal")
  case "$DEL_STATUS" in
    204|200) ok "Test row deleted (HTTP $DEL_STATUS)" ;;
    *) fail "Cleanup DELETE returned HTTP $DEL_STATUS" ;;
  esac
fi

# ── SUMMARY ──────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "  Results: $PASS / $TOTAL tests passed"
if [ $FAIL -eq 0 ]; then
  echo "  🎉 ALL TESTS PASSED — board-member CRUD works end-to-end"
else
  echo "  ⚠️  $FAIL TEST(S) FAILED"
fi
echo "════════════════════════════════════════════════════"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1
