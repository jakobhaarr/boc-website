#!/usr/bin/env bash
# Makes the board's PDFs from the running site (npm run dev, or a build served with npm start) with the Chrome installed on this Mac:
#
#   scripts/make-pdf.sh [base-url]        default http://localhost:3100
#
# public/pdf/boc-brukeropplevelse-presentasjon.pdf           the ten-minute talk, one slide per page (16:9)
# public/pdf/boc-brukeropplevelse-dokument.pdf               the document for the board, A4
#
# The pages the links on /user-experience point to. Run it again after the deck or the document changes, and commit the files.
set -euo pipefail

BASE="${1:-http://localhost:3100}"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/pdf"
mkdir -p "$OUT"

[ -x "$CHROME" ] || { echo "Fant ikke Chrome på $CHROME (sett CHROME=...)" >&2; exit 1; }
curl -fsS -o /dev/null "$BASE/user-experience" || { echo "Nettsiden svarer ikke på $BASE" >&2; exit 1; }

print() { # url, file
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-pdf-header-footer \
    --virtual-time-budget=30000 --run-all-compositor-stages-before-draw \
    --print-to-pdf="$OUT/$2" "$1" 2>/dev/null
  echo "$2"
}

print "$BASE/user-experience?pdf" boc-brukeropplevelse-presentasjon.pdf
# The whole deck (?alle) is 28 MB as a PDF, so it is not kept: open /user-experience?pdf&alle and print it if it is wanted.
print "$BASE/user-experience/dokument" boc-brukeropplevelse-dokument.pdf
