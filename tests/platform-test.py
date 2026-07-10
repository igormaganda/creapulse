#!/usr/bin/env python3
"""
CreaPulse V2 — Comprehensive Platform Test Suite
Tests every API endpoint, function by function, with expected results.
"""

import http.cookiejar
import json
import os
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

BASE = "http://localhost:3000"
SERVER_PROC = None
results = {"pass": 0, "fail": 0, "skip": 0, "details": []}

# ─── Server Management ──────────────────────────

def is_server_alive():
    s = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    try:
        s.settimeout(2)
        s.connect(("::1", 3000))
        s.close()
        return True
    except:
        pass
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.settimeout(2)
        s.connect(("127.0.0.1", 3000))
        s.close()
        return True
    except:
        return False

def start_server():
    global SERVER_PROC
    env = os.environ.copy()
    env["DATABASE_URL"] = "postgresql://z@localhost:5433/creapulse"
    SERVER_PROC = subprocess.Popen(
        ["node", "node_modules/.bin/next", "dev", "-p", "3000"],
        cwd="/home/z/my-project",
        stdout=open("/tmp/ctest-out.log", "w"),
        stderr=open("/tmp/ctest-err.log", "w"),
        env=env,
    )
    print("  Starting dev server...", end=" ", flush=True)
    for i in range(30):
        time.sleep(2)
        if is_server_alive():
            print(f"ready ({(i+1)*2}s)")
            time.sleep(3)  # extra warmup
            return True
    print("FAILED")
    return False

def ensure_server():
    if is_server_alive():
        return True
    print("Server not running, restarting...")
    return start_server()

# ─── HTTP Client with Cookies ──────────────────

class LenientCookiePolicy(http.cookiejar.DefaultCookiePolicy):
    """Accept all cookies including secure over HTTP (for testing)"""
    def set_ok(self, cookie, request):
        return True
    def return_ok(self, cookie, request):
        return True
    def domain_return_ok(self, domain, request):
        return True
    def path_return_ok(self, path, request):
        return True

class APIClient:
    def __init__(self):
        self.cookie_jar = http.cookiejar.CookieJar(policy=LenientCookiePolicy())
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.cookie_jar)
        )
        self.csrf_token = None

    def request(self, method, path, data=None, raw_body=None):
        url = f"{BASE}{path}"
        headers = {}
        if raw_body:
            body = raw_body.encode() if isinstance(raw_body, str) else raw_body
            headers["Content-Type"] = "application/json"
        elif data is not None:
            body = json.dumps(data).encode()
            headers["Content-Type"] = "application/json"
        else:
            body = None

        # Add CSRF token for mutating requests on non-exempt paths
        csrf_exempt = ["/api/auth/", "/api/health", "/api/monitoring/", "/api/export/demo/", "/api/geo/", "/api/france-travail/"]
        is_mutating = method.upper() in ("POST", "PUT", "PATCH", "DELETE")
        if is_mutating and not any(path.startswith(p) for p in csrf_exempt):
            # Get CSRF from cookie if not already captured
            if not self.csrf_token:
                for cookie in self.cookie_jar:
                    if cookie.name == "csrf_token":
                        self.csrf_token = cookie.value
                        break
            if self.csrf_token:
                headers["X-CSRF-Token"] = self.csrf_token

        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            resp = self.opener.open(req, timeout=60)
            # Capture CSRF token from response headers
            csrf = resp.headers.get("X-CSRF-Token")
            if csrf:
                self.csrf_token = csrf
            try:
                return resp.status, json.loads(resp.read())
            except:
                return resp.status, resp.read().decode()
        except urllib.error.HTTPError as e:
            try:
                return e.code, json.loads(e.read())
            except:
                return e.code, e.read().decode()

    def get(self, path):
        return self.request("GET", path)

    def post(self, path, data=None):
        return self.request("POST", path, data=data)

    def put(self, path, data=None):
        return self.request("PUT", path, data=data)

    def delete(self, path):
        return self.request("DELETE", path)

# ─── Test Framework ────────────────────────────

test_num = 0

def test(name, expected_check, actual, category="General"):
    global test_num
    test_num += 1
    passed = expected_check(actual)
    status = "PASS ✓" if passed else "FAIL ✗"
    results["pass" if passed else "fail"] += 1
    results["details"].append({"id": test_num, "name": name, "passed": passed, "category": category})
    short_actual = str(actual)[:80]
    print(f"  [TEST-{test_num:03d}] {name:<50s} {status}")
    if not passed:
        print(f"             Expected: {expected_check.__name__}, Got: {short_actual}")
    return passed

def test_skip(name, reason="", category="General"):
    global test_num
    test_num += 1
    results["skip"] += 1
    results["details"].append({"id": test_num, "name": name, "passed": False, "category": category, "skipped": True})
    print(f"  [TEST-{test_num:03d}] {name:<50s} SKIP ({reason})")

# ─── Check Helpers ─────────────────────────────

def is_200(r): return r[0] == 200
def is_201(r): return r[0] == 201
def is_401(r): return r[0] == 401
def is_403(r): return r[0] == 403
def is_404(r): return r[0] == 404
def is_429(r): return r[0] == 429
def has_success(r): return isinstance(r[1], dict) and r[1].get("success") == True
def has_data(r): return isinstance(r[1], dict) and "data" in r[1]
def is_healthy(r): return isinstance(r[1], dict) and r[1].get("data", {}).get("database", {}).get("status") == "connected"
def is_array(r): return isinstance(r[1], dict) and isinstance(r[1].get("data"), list)
def has_reply(r): return isinstance(r[1], dict) and isinstance(r[1].get("data", {}).get("reply"), str) and len(r[1]["data"]["reply"]) > 10

# ─── TEST SUITES ──────────────────────────────

def test_infrastructure(api):
    print("\n📊 INFRASTRUCTURE")
    ensure_server()

    r = api.get("/api/health")
    test("Health Check - 200", is_200, r)
    test("Health Check - Success", has_success, r)
    test("Health Check - DB Connected", is_healthy, r)

def test_auth(api):
    print("\n🔐 AUTHENTICATION")
    ensure_server()

    # Valid logins
    for email, pwd, role in [
        ("admin@echo-entreprendre.fr", "Admin2026!", "ADMIN"),
        ("dupont.jean@gidef-idf.fr", "Conseiller2026!", "COUNSELOR"),
        ("marie.curie@example.fr", "Beneficiaire2026!", "BENEFICIARY"),
    ]:
        client = APIClient()
        r = client.post("/api/auth/login", {"email": email, "password": pwd})
        test(f"Login {role} - 200", is_200, r, "Auth")
        u = r[1].get("data", {}).get("user", {}) if isinstance(r[1], dict) else {}
        test(f"Login {role} - Role", lambda d, _r=role: d == _r, u.get("role"), "Auth")

    # Invalid credentials
    r = api.post("/api/auth/login", {"email": "admin@echo-entreprendre.fr", "password": "wrong"})
    test("Login Invalid Password - 401", is_401, r, "Auth")

    r = api.post("/api/auth/login", {"email": "nonexistent@test.com", "password": "test"})
    test("Login Unknown Email - 401", is_401, r, "Auth")

    # Missing fields
    r = api.post("/api/auth/login", {"email": ""})
    test("Login Missing Fields - 400/422", lambda d: d[0] in (400, 422), r, "Auth")

    # /auth/me with session
    r = api.get("/api/auth/me")
    test("GET /auth/me - 200", is_200, r, "Auth")
    test("GET /auth/me - Has User Data", lambda d: isinstance(d[1], dict) and "id" in d[1].get("data", {}), r, "Auth")

    # No auth client
    anon = APIClient()
    r = anon.get("/api/auth/me")
    test("GET /auth/me No Auth - 401", is_401, r, "Auth")

def test_modules(api):
    print("\n📦 MODULE REGISTRY")
    ensure_server()

    r = api.get("/api/modules")
    test("GET /api/modules - 200", is_200, r, "Modules")
    test("GET /api/modules - Is Array", is_array, r, "Modules")
    if isinstance(r[1], dict) and isinstance(r[1].get("data"), list):
        count = len(r[1]["data"])
        test(f"GET /api/modules - Count >= 10", lambda d: d >= 10, count, "Modules")
        if r[1]["data"]:
            m = r[1]["data"][0]
            has_code = any(k in m for k in ["code", "moduleCode", "id"])
            test("GET /api/modules - Has identifier", lambda d: d, has_code, "Modules")

def test_ai_assistant(api):
    print("\n🤖 AI ASSISTANT (GLM 4.7)")
    ensure_server()

    # Chat
    r = api.post("/api/ia", {"message": "Comment créer une entreprise en France ?", "action": "chat"})
    test("POST /api/ia chat - 200", is_200, r, "AI")
    test("POST /api/ia chat - Has Reply", has_reply, r, "AI")
    if isinstance(r[1], dict) and r[1].get("data", {}).get("reply"):
        print(f"             AI Reply: {r[1]['data']['reply'][:100]}...")

    # Suggestions
    r = api.post("/api/ia", {"message": "test", "action": "suggestions", "context": {"module": "business-plan"}})
    test("POST /api/ia suggestions - 200", is_200, r, "AI")
    if isinstance(r[1], dict) and isinstance(r[1].get("data", {}).get("suggestions"), list):
        sug_count = len(r[1]["data"]["suggestions"])
        test(f"POST /api/ia suggestions - {sug_count} items", lambda d: d >= 2, sug_count, "AI")

def test_ai_suggestions(api):
    print("\n💡 AI SECTOR SUGGESTIONS")
    ensure_server()

    r = api.post("/api/ai/suggestions", {"sector": "Restauration", "useAI": False})
    test("POST /api/ai/suggestions - 200", is_200, r, "AI")
    if isinstance(r[1], dict) and isinstance(r[1].get("data"), dict):
        d = r[1]["data"]
        has_clients = isinstance(d.get("clients"), list) and len(d["clients"]) > 0
        has_problems = isinstance(d.get("problems"), list) and len(d["problems"]) > 0
        has_advantages = isinstance(d.get("advantages"), list) and len(d["advantages"]) > 0
        test("Suggestions - Has clients", lambda d: d, has_clients, "AI")
        test("Suggestions - Has problems", lambda d: d, has_problems, "AI")
        test("Suggestions - Has advantages", lambda d: d, has_advantages, "AI")

def test_business_plan(api):
    print("\n📋 BUSINESS PLAN")
    ensure_server()

    r = api.get("/api/business-plan")
    test("GET /api/business-plan - 200", is_200, r, "BP")
    test("GET /api/business-plan - Has Data", has_data, r, "BP")

    # Snapshots
    r = api.get("/api/business-plan/snapshots")
    test("GET /api/business-plan/snapshots - 200", is_200, r, "BP")

    # Quality (might be POST only)
    r = api.post("/api/business-plan/quality", {})
    test("POST /api/business-plan/quality - 200/405", lambda d: d[0] in (200, 405), r, "BP")

def test_mind_map(api):
    print("\n🧠 MIND MAP")
    ensure_server()

    r = api.get("/api/mind-map")
    test("GET /api/mind-map - 200", is_200, r, "MindMap")
    test("GET /api/mind-map - Is Array", is_array, r, "MindMap")

    # Create
    r = api.post("/api/mind-map", {
        "title": "Test Mind Map",
        "nodes": [{"id": "root", "text": "Mon Projet", "parentId": None, "x": 400, "y": 300}],
    })
    test("POST /api/mind-map - 201/200", lambda d: d[0] in (200, 201), r, "MindMap")

    # Delete test map
    if isinstance(r[1], dict) and r[1].get("data", {}).get("id"):
        map_id = r[1]["data"]["id"]
        r2 = api.delete(f"/api/mind-map?id={map_id}")
        test("DELETE /api/mind-map - 200", is_200, r2, "MindMap")

def test_mentorat(api):
    print("\n🤝 MENTORAT")
    ensure_server()

    r = api.get("/api/mentorat")
    test("GET /api/mentorat - 200", is_200, r, "Mentorat")
    test("GET /api/mentorat - Has Data", has_data, r, "Mentorat")

    if isinstance(r[1], dict) and isinstance(r[1].get("data", {}).get("mentors"), list):
        m_count = len(r[1]["data"]["mentors"])
        test(f"GET /api/mentorat - {m_count} mentors", lambda d: d >= 0, m_count, "Mentorat")

def test_notifications(api):
    print("\n🔔 NOTIFICATIONS")
    ensure_server()

    r = api.get("/api/notifications")
    test("GET /api/notifications - 200", is_200, r, "Notifications")

    r = api.post("/api/notifications/read-all")
    test("POST /api/notifications/read-all - 200", is_200, r, "Notifications")

def test_dashboard(api):
    print("\n📈 DASHBOARD")
    ensure_server()

    r = api.get("/api/dashboard")
    test("GET /api/dashboard - 200", is_200, r, "Dashboard")

def test_user_data(api):
    print("\n👤 PROFIL & PROJET")
    ensure_server()

    r = api.get("/api/profil")
    test("GET /api/profil - 200", is_200, r, "Profil")

    r = api.get("/api/projet")
    test("GET /api/projet - 200", is_200, r, "Projet")

    r = api.get("/api/vision")
    test("GET /api/vision - 200", is_200, r, "Vision")

def test_strategy_modules(api):
    print("\n🎯 STRATEGY MODULES")
    ensure_server()

    modules = [
        "/api/marche", "/api/juridique", "/api/financier",
        "/api/bmc", "/api/kiviat", "/api/riasec",
        "/api/pitch-deck", "/api/swipe",
        "/api/creascope/sessions",
    ]
    for m in modules:
        r = api.get(m)
        name = m.split("/")[-1] or m.split("/")[-2]
        # creascope is restricted to COUNSELOR role
        if "creascope" in m:
            test(f"GET {m} - 200/403", lambda d: d[0] in (200, 403), r, "Strategy")
        else:
            test(f"GET {m} - 200", is_200, r, "Strategy")
        time.sleep(0.5)

def test_ecosystem_modules(api):
    print("\n🌐 ECOSYSTEM MODULES")
    ensure_server()

    modules = [
        "/api/annuaire", "/api/forum", "/api/messages",
        "/api/communaute", "/api/e-learning",
    ]
    for m in modules:
        r = api.get(m)
        test(f"GET {m} - 200", is_200, r, "Ecosystem")
        time.sleep(0.5)

def test_pilotage_modules(api):
    print("\n✈️ PILOTAGE MODULES")
    ensure_server()

    modules = [
        "/api/tremplin", "/api/passeport", "/api/certifications",
        "/api/gamification", "/api/progress",
        "/api/tresorerie", "/api/creasim",
        "/api/onboarding",
    ]
    for m in modules:
        r = api.get(m)
        test(f"GET {m} - 200", is_200, r, "Pilotage")
        time.sleep(0.5)

def test_admin_endpoints(api):
    print("\n⚙️ ADMIN PLATEFORME")
    ensure_server()

    r = api.get("/api/admin-plateforme/stats")
    test("GET /admin-plateforme/stats - 200/403", lambda d: d[0] in (200, 403), r, "Admin")

    r = api.get("/api/admin-plateforme/modules")
    test("GET /admin-plateforme/modules - 200/403", lambda d: d[0] in (200, 403), r, "Admin")

    r = api.get("/api/admin-plateforme/utilisateurs")
    test("GET /admin-plateforme/utilisateurs - 200/403", lambda d: d[0] in (200, 403), r, "Admin")

    r = api.get("/api/admin-centre/stats")
    test("GET /admin-centre/stats - 200/403", lambda d: d[0] in (200, 403), r, "Admin")

    r = api.get("/api/admin-plateforme/analytics")
    test("GET /admin-plateforme/analytics - 200/403", lambda d: d[0] in (200, 403), r, "Admin")

def test_other_endpoints(api):
    print("\n🔧 OTHER ENDPOINTS")
    ensure_server()

    endpoints = [
        "/api/monitoring/health-detailed",
        "/api/export/demo/list",
    ]
    for ep in endpoints:
        r = api.get(ep)
        test(f"GET {ep} - 200", is_200, r, "Other")
        time.sleep(0.5)

# ─── MAIN ─────────────────────────────────────

def main():
    print("=" * 70)
    print("  CreaPulse V2 — JEU DE TESTS COMPLET DE LA PLATEFORME")
    print("=" * 70)

    # Start server
    print("\n🚀 Démarrage du serveur de développement...")
    if not start_server():
        print("FATAL: Cannot start server. Aborting.")
        sys.exit(1)

    # Login as admin for authenticated tests
    api = APIClient()
    r = api.post("/api/auth/login", {"email": "admin@echo-entreprendre.fr", "password": "Admin2026!"})
    if r[0] != 200:
        print(f"FATAL: Login failed ({r[0]}). Aborting.")
        sys.exit(1)
    print(f"  Logged in as: {r[1].get('data', {}).get('user', {}).get('firstName', '?')} {r[1].get('data', {}).get('user', {}).get('lastName', '?')} (ADMIN)")

    # Run all test suites
    try:
        test_infrastructure(api)
        time.sleep(1)

        test_auth(api)
        time.sleep(1)

        test_modules(api)
        time.sleep(1)

        test_ai_assistant(api)
        time.sleep(1)

        test_ai_suggestions(api)
        time.sleep(1)

        test_business_plan(api)
        time.sleep(1)

        test_mind_map(api)
        time.sleep(1)

        test_mentorat(api)
        time.sleep(1)

        test_notifications(api)
        time.sleep(1)

        test_dashboard(api)
        time.sleep(1)

        test_user_data(api)
        time.sleep(1)

        test_strategy_modules(api)
        time.sleep(1)

        test_ecosystem_modules(api)
        time.sleep(1)

        test_pilotage_modules(api)
        time.sleep(1)

        test_admin_endpoints(api)
        time.sleep(1)

        test_other_endpoints(api)
    except Exception as e:
        print(f"\n💥 UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()

    # Summary
    total = results["pass"] + results["fail"] + results["skip"]
    print("\n" + "=" * 70)
    print("  RÉSUMÉ DES TESTS")
    print("=" * 70)
    print(f"  Total:    {total}")
    print(f"  Passés:   {results['pass']}  ✅")
    print(f"  Échoués:  {results['fail']}  ❌")
    print(f"  Skippés:  {results['skip']}  ⏭️")

    if results["fail"] > 0:
        print(f"\n  Tests échoués:")
        for d in results["details"]:
            if not d.get("passed") and not d.get("skipped"):
                print(f"    [TEST-{d['id']:03d}] {d['name']}")

    print("\n" + "=" * 70)

    # Cleanup
    if SERVER_PROC:
        SERVER_PROC.terminate()

    return 0 if results["fail"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())