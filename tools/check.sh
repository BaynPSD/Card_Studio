#!/usr/bin/env bash
# Check local rapide de Card_Studio (syntaxe JS, CSS, assets référencés, déploiement).
# Usage: tools/check.sh [--remote]
set -u
cd "$(dirname "$0")/.."
fail=0

echo "== node --check js/*.js =="
for f in js/app.js js/editor-data.js js/editor.js; do node --check "$f" || fail=1; done

echo "== accolades CSS =="
python3 - <<'PY'
import sys
ok = True
for p in ("css/cards.css", "css/ui.css", "css/editor.css"):
    s = open(p).read()
    d = s.count("{") - s.count("}")
    print(f"  {p}: diff={d}")
    if d != 0:
        ok = False
sys.exit(0 if ok else 1)
PY
[ $? -ne 0 ] && fail=1

echo "== assets référencés dans index.html + holo.html =="
python3 - <<'PY'
import re, os, sys
s = open("index.html").read() + open("holo.html").read() + open("js/editor-data.js").read()
refs = re.findall(r'(?:src|href)="([^"?#]+)', s) + re.findall(r'"(img/[^"]+)"', s)
ok = True
for r in refs:
    if r.startswith(("http", "data:")):
        continue
    if not os.path.exists(r):
        print(f"  MANQUANT: {r}")
        ok = False
print("  tous les assets locaux existent" if ok else "  assets manquants !")
sys.exit(0 if ok else 1)
PY
[ $? -ne 0 ] && fail=1

echo "== images référencées dans css/cards.css =="
python3 - <<'PY'
import re, os, sys
s = open("css/cards.css").read()
ok = True
for r in set(re.findall(r'url\(["\']?(\.\./[^"\')]+)', s)):
    p = os.path.normpath(os.path.join("css", r))
    if not os.path.exists(p):
        print(f"  MANQUANT: {r} -> {p}")
        ok = False
print("  toutes les textures existent" if ok else "  textures manquantes !")
sys.exit(0 if ok else 1)
PY
[ $? -ne 0 ] && fail=1

if [ "${1:-}" = "--remote" ]; then
  echo "== site déployé =="
  code=$(curl -s -o /dev/null -w '%{http_code}' https://baynpsd.github.io/Card_Studio/)
  echo "  HTTP $code"
  [ "$code" = "200" ] || fail=1
fi

if [ $fail -eq 0 ]; then echo "✅ TOUT OK"; else echo "❌ ÉCHECS détectés"; exit 1; fi
