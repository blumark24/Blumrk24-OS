#!/usr/bin/env bash
# End-to-end test: Create employee majed.almalki via POST /api/admin/create-user
# Verifies creation in auth.users, profiles, employees, and login capability

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:?ERROR: set SUPABASE_URL}"
ANON_KEY="${ANON_KEY:?ERROR: set ANON_KEY}"
SERVICE_KEY="${SERVICE_KEY:?ERROR: set SERVICE_KEY}"
ADMIN_EMAIL="${ADMIN_EMAIL:?ERROR: set ADMIN_EMAIL}"
ADMIN_PASS="${ADMIN_PASS:?ERROR: set ADMIN_PASS}"
APP_URL="${APP_URL:-http://localhost:3000}"

# Test employee data
TEST_EMAIL="majed.almalki.board.test+$(date +%s)@gmail.com"
TEST_PASS="Test@123456"
TEST_NAME="ماجد المالكي"
TEST_ROLE="board_member"
TEST_DEPT="الإدارة"
TEST_PHONE="0507006849"
TEST_SALARY="0"
TEST_STATUS="نشط"

PASS=0
FAIL=0

ok()   { echo "  ✅ PASS — $1"; ((PASS++)); }
fail() { echo "  ❌ FAIL — $1"; ((FAIL++)); }

echo ""
echo "════════════════════════════════════════════════════════"
echo "  E2E Test: Create Employee majed.almalki"
echo "════════════════════════════════════════════════════════"
echo "  Email:      $TEST_EMAIL"
echo "  Role:       $TEST_ROLE"
echo "  App URL:    $APP_URL"
echo ""

# ── STEP 1: Admin Login ──────────────────────────────────────────
echo "▶ Step 1: Admin Login ($ADMIN_EMAIL)"
ADMIN_LOGIN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" 2>/dev/null || echo '{"error":"Network error"}')

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")
ADMIN_ERROR=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description',''))" 2>/dev/null || echo "")

if [ -z "$ADMIN_TOKEN" ]; then
  fail "Admin login failed: $ADMIN_ERROR"
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  ⚠️  BLOCKED — Cannot continue without admin session"
  echo "════════════════════════════════════════════════════════"
  exit 1
fi
ok "Admin login successful (token obtained)"

# ── STEP 2: POST /api/admin/create-user ──────────────────────────
echo ""
echo "▶ Step 2: POST $APP_URL/api/admin/create-user"
CREATE_RESPONSE=$(curl -s -w "\n__HTTP__%{http_code}" -X POST \
  "$APP_URL/api/admin/create-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{
    \"email\":      \"$TEST_EMAIL\",
    \"password\":   \"$TEST_PASS\",
    \"name\":       \"$TEST_NAME\",
    \"role\":       \"$TEST_ROLE\",
    \"department\": \"$TEST_DEPT\",
    \"phone\":      \"$TEST_PHONE\",
    \"salary\":     $TEST_SALARY,
    \"status\":     \"$TEST_STATUS\"
  }" 2>/dev/null || echo '{"error":"Network error"}__HTTP__0')

HTTP_STATUS=$(echo "$CREATE_RESPONSE" | grep __HTTP__ | sed 's/.*__HTTP__//')
CREATE_BODY=$(echo "$CREATE_RESPONSE" | grep -v __HTTP__)

echo "  HTTP Status: $HTTP_STATUS"
echo "  Response Body:"
echo "$CREATE_BODY" | python3 -m json.tool 2>/dev/null | sed 's/^/    /' || echo "    $CREATE_BODY" | sed 's/^/    /'

NEW_USER_ID=$(echo "$CREATE_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")
CREATE_SUCCESS=$(echo "$CREATE_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',False))" 2>/dev/null || echo "false")

if [ "$HTTP_STATUS" = "200" ]; then
  ok "HTTP 200 returned"
else
  fail "HTTP $HTTP_STATUS (expected 200)"
fi

if [ "$CREATE_SUCCESS" = "True" ] || [ "$CREATE_SUCCESS" = "true" ]; then
  ok "success: true in response"
else
  fail "success: false or missing in response"
fi

if [ -n "$NEW_USER_ID" ] && [ "$NEW_USER_ID" != "None" ]; then
  ok "New user ID obtained: $NEW_USER_ID"
else
  fail "No user ID in response"
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  ⚠️  BLOCKED — Cannot verify without user ID"
  echo "════════════════════════════════════════════════════════"
  exit 1
fi

# ── STEP 3: Verify in auth.users ─────────────────────────────────
echo ""
echo "▶ Step 3: Verify user in Supabase auth.users"
AUTH_USER=$(curl -s \
  "$SUPABASE_URL/auth/v1/admin/users/$NEW_USER_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo '{"error":"Network error"}')

AUTH_EMAIL=$(echo "$AUTH_USER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('email',''))" 2>/dev/null || echo "")
AUTH_CONFIRMED=$(echo "$AUTH_USER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('email_confirmed',False))" 2>/dev/null || echo "false")

if [ "$AUTH_EMAIL" = "$TEST_EMAIL" ]; then
  ok "auth.users → email=$AUTH_EMAIL"
else
  fail "auth.users → email mismatch (expected $TEST_EMAIL, got $AUTH_EMAIL)"
fi

if [ "$AUTH_CONFIRMED" = "True" ] || [ "$AUTH_CONFIRMED" = "true" ]; then
  ok "auth.users → email_confirmed=true"
else
  fail "auth.users → email_confirmed=false"
fi

# ── STEP 4: Verify in profiles table ─────────────────────────────
echo ""
echo "▶ Step 4: Verify user in profiles table"
PROFILE=$(curl -s \
  "$SUPABASE_URL/rest/v1/profiles?id=eq.$NEW_USER_ID&select=id,email,name,role,is_active,department" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo '[]')

PROF_COUNT=$(echo "$PROFILE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(len(rows) if isinstance(rows,list) else 0)" 2>/dev/null || echo "0")
PROF_EMAIL=$(echo "$PROFILE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['email'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
PROF_ROLE=$(echo "$PROFILE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['role'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
PROF_ACTIVE=$(echo "$PROFILE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['is_active'] if rows and len(rows)>0 else False)" 2>/dev/null || echo "false")

if [ "$PROF_COUNT" -gt 0 ] && [ "$PROF_EMAIL" = "$TEST_EMAIL" ]; then
  ok "profiles → row exists with email=$PROF_EMAIL"
else
  fail "profiles → row not found (expected email=$TEST_EMAIL, got rows=$PROF_COUNT)"
fi

if [ "$PROF_ROLE" = "$TEST_ROLE" ]; then
  ok "profiles → role=$PROF_ROLE"
else
  fail "profiles → role mismatch (expected $TEST_ROLE, got $PROF_ROLE)"
fi

if [ "$PROF_ACTIVE" = "True" ] || [ "$PROF_ACTIVE" = "true" ]; then
  ok "profiles → is_active=true"
else
  fail "profiles → is_active=false"
fi

# ── STEP 5: Verify in employees table ────────────────────────────
echo ""
echo "▶ Step 5: Verify user in employees table"
EMPLOYEE=$(curl -s \
  "$SUPABASE_URL/rest/v1/employees?id=eq.$NEW_USER_ID&select=id,name,email,role,phone,department,salary,status" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo '[]')

EMP_COUNT=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(len(rows) if isinstance(rows,list) else 0)" 2>/dev/null || echo "0")
EMP_EMAIL=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['email'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
EMP_ROLE=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['role'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
EMP_PHONE=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['phone'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
EMP_DEPT=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['department'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")
EMP_STATUS=$(echo "$EMPLOYEE" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['status'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")

if [ "$EMP_COUNT" -gt 0 ] && [ "$EMP_EMAIL" = "$TEST_EMAIL" ]; then
  ok "employees → row exists with email=$EMP_EMAIL"
else
  fail "employees → row not found (expected email=$TEST_EMAIL, got rows=$EMP_COUNT)"
fi

if [ "$EMP_ROLE" = "$TEST_ROLE" ]; then
  ok "employees → role=$EMP_ROLE"
else
  fail "employees → role mismatch (expected $TEST_ROLE, got $EMP_ROLE)"
fi

if [ "$EMP_PHONE" = "$TEST_PHONE" ]; then
  ok "employees → phone=$EMP_PHONE"
else
  fail "employees → phone mismatch (expected $TEST_PHONE, got $EMP_PHONE)"
fi

if [ "$EMP_DEPT" = "$TEST_DEPT" ]; then
  ok "employees → department=$EMP_DEPT"
else
  fail "employees → department mismatch (expected $TEST_DEPT, got $EMP_DEPT)"
fi

if [ "$EMP_STATUS" = "$TEST_STATUS" ]; then
  ok "employees → status=$EMP_STATUS"
else
  fail "employees → status mismatch (expected $TEST_STATUS, got $EMP_STATUS)"
fi

# ── STEP 6: Login as new employee ────────────────────────────────
echo ""
echo "▶ Step 6: Login as new employee ($TEST_EMAIL)"
EMP_LOGIN=$(curl -s -X POST \
  "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}" 2>/dev/null || echo '{"error":"Network error"}')

EMP_TOKEN=$(echo "$EMP_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")
EMP_LOGIN_ERROR=$(echo "$EMP_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description',''))" 2>/dev/null || echo "")

if [ -n "$EMP_TOKEN" ] && [ "$EMP_TOKEN" != "None" ]; then
  ok "Employee login successful (session token obtained)"
else
  fail "Employee login failed: $EMP_LOGIN_ERROR"
fi

# ── STEP 7: Refresh and verify persistence ───────────────────────
echo ""
echo "▶ Step 7: Refresh data and verify persistence"
sleep 2  # Brief delay to ensure DB sync

PROFILE_REFRESH=$(curl -s \
  "$SUPABASE_URL/rest/v1/profiles?id=eq.$NEW_USER_ID&select=id,email,name,role" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo '[]')

PROF_REFRESH_COUNT=$(echo "$PROFILE_REFRESH" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(len(rows) if isinstance(rows,list) else 0)" 2>/dev/null || echo "0")
PROF_REFRESH_EMAIL=$(echo "$PROFILE_REFRESH" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['email'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")

if [ "$PROF_REFRESH_COUNT" -gt 0 ] && [ "$PROF_REFRESH_EMAIL" = "$TEST_EMAIL" ]; then
  ok "profiles → persisted after refresh (email=$PROF_REFRESH_EMAIL)"
else
  fail "profiles → data not persisted (rows=$PROF_REFRESH_COUNT)"
fi

EMPLOYEE_REFRESH=$(curl -s \
  "$SUPABASE_URL/rest/v1/employees?id=eq.$NEW_USER_ID&select=id,email,role" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo '[]')

EMP_REFRESH_COUNT=$(echo "$EMPLOYEE_REFRESH" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(len(rows) if isinstance(rows,list) else 0)" 2>/dev/null || echo "0")
EMP_REFRESH_EMAIL=$(echo "$EMPLOYEE_REFRESH" | python3 -c "import sys,json; rows=json.load(sys.stdin); print(rows[0]['email'] if rows and len(rows)>0 else '')" 2>/dev/null || echo "")

if [ "$EMP_REFRESH_COUNT" -gt 0 ] && [ "$EMP_REFRESH_EMAIL" = "$TEST_EMAIL" ]; then
  ok "employees → persisted after refresh (email=$EMP_REFRESH_EMAIL)"
else
  fail "employees → data not persisted (rows=$EMP_REFRESH_COUNT)"
fi

# ── SUMMARY ──────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo "  Results: $PASS / $TOTAL tests passed"
if [ $FAIL -eq 0 ]; then
  echo "  🎉 ALL E2E TESTS PASSED"
  echo "  Employee majed.almalki created and verified in production"
else
  echo "  ⚠️  $FAIL TEST(S) FAILED"
fi
echo "════════════════════════════════════════════════════════"
echo ""
[ $FAIL -eq 0 ] && exit 0 || exit 1
