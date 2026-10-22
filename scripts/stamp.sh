#!/bin/sh
# Stamps every local stylesheet and script in index.html with the first 8 hex
# digits of its SHA-256, as styles.css?v=1a2b3c4d. A changed file gets a new
# URL, so a phone or home-screen app never pairs a new index.html with a stale
# cached file. Run it after changing any CSS or JS file.
#
#   scripts/stamp.sh           rewrite the stamps in index.html
#   scripts/stamp.sh --check   change nothing; exit 1 if any stamp is stale
#                              or missing (CI runs this on every push)
set -eu
cd "$(dirname "$0")/.."

check=0
[ "${1:-}" = "--check" ] && check=1

hash8(){
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -c1-8
}

stale=0
html=$(cat index.html)

# A local .css or .js reference without a stamp would never be refreshed. It
# gets an empty one here, which the loop below reports and fills in.
for ref in $(printf '%s\n' "$html" | grep -oE '(href|src)="[^"/:?][^":?]*\.(css|js)"' || true); do
  f=${ref#*=\"}; f=${f%\"}
  re=$(printf '%s' "$f" | sed 's/[.]/\\./g')
  html=$(printf '%s\n' "$html" | sed -E "s|\"$re\"|\"$f?v=\"|")
done

for f in $(printf '%s\n' "$html" | grep -oE '(href|src)="[^"/:?][^":?]*\?v=[^"]*"' | sed -E 's/^(href|src)="([^?]+)\?v=.*/\2/'); do
  if [ ! -f "$f" ]; then echo "Missing file: $f"; stale=1; continue; fi
  want=$(hash8 "$f")
  re=$(printf '%s' "$f" | sed 's/[.]/\\./g')
  if ! printf '%s\n' "$html" | grep -qE "\"$re\\?v=$want\""; then
    echo "Stale stamp: $f (should be ?v=$want)"
    stale=1
    html=$(printf '%s\n' "$html" | sed -E "s|\"$re\\?v=[^\"]*\"|\"$f?v=$want\"|")
  fi
done

if [ "$check" = 1 ]; then
  [ "$stale" = 0 ] && echo "All stamps are current." && exit 0
  echo "Run scripts/stamp.sh and commit index.html."
  exit 1
fi
if [ "$stale" = 1 ]; then
  # printf adds back the final newline that $(...) dropped, only if the file had one.
  if [ -n "$(tail -c1 index.html)" ]; then printf '%s' "$html" > index.html.tmp; else printf '%s\n' "$html" > index.html.tmp; fi
  mv index.html.tmp index.html
  echo "index.html updated."
else
  echo "All stamps are current."
fi
