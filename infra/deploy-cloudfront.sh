#!/usr/bin/env bash
# Make CloudFront serve the prerendered pages.
#   ./infra/deploy-cloudfront.sh
#
# Two changes to the site distribution, in this order — the order matters.
#
# 1. A 403/404 rule sending a missed address to the app shell. There was none,
#    because the router function sent every address to /index.html and so
#    nothing ever missed. Once the function stops doing that, an address with
#    no file behind it — /dashboard, /login, a typo — would return S3's XML
#    error instead of the site. This rule is what keeps those working, so it
#    goes first.
#
# 2. The router function itself, replaced by legacy-redirects.js: each address
#    is pointed at its own prerendered file rather than all of them at the home
#    page, and the 25 addresses that moved off WordPress answer with a 301.
#
# Safe to run again. Each step checks whether it is already done, so a run that
# stopped halfway carries on from where it stopped rather than starting over.
#
# Undoing it is the same two steps backwards: republish spa-router.rollback.js
# (saved here before anything is touched), then set CustomErrorResponses back
# to Quantity 0.
set -euo pipefail

PROFILE="${AWS_PROFILE:-svastrino-terraform}"
DIST="${CF_DISTRIBUTION:-EIGJWQLU4U4X2}"
FUNC="${CF_FUNCTION:-svastrino-prod-spa-router}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"

cf() { aws --profile "$PROFILE" cloudfront "$@"; }

echo "→ distribution $DIST · function $FUNC · profile $PROFILE"

cf get-distribution-config --id "$DIST" > "$WORK/before.json"
if [ ! -s "$HERE/spa-router.rollback.js" ]; then
  cf get-function --name "$FUNC" --stage LIVE "$HERE/spa-router.rollback.js" > /dev/null
fi
echo "  saved: $WORK/before.json · infra/spa-router.rollback.js"

# ---- 1. the fallback, before anything can start missing --------------------
HAVE_ERRORS="$(python3 -c "
import json
print(json.load(open('$WORK/before.json'))['DistributionConfig']['CustomErrorResponses']['Quantity'])
")"

if [ "$HAVE_ERRORS" -ge 2 ]; then
  echo "  ✓ 403/404 → /index.html (already there)"
else
  python3 - "$WORK" <<'PY'
import json, sys
work = sys.argv[1]
d = json.load(open(f'{work}/before.json'))
c = d['DistributionConfig']
c['CustomErrorResponses'] = {
    'Quantity': 2,
    'Items': [
        {'ErrorCode': 403, 'ResponsePagePath': '/index.html',
         'ResponseCode': '200', 'ErrorCachingMinTTL': 10},
        {'ErrorCode': 404, 'ResponsePagePath': '/index.html',
         'ResponseCode': '200', 'ErrorCachingMinTTL': 10},
    ],
}
json.dump(c, open(f'{work}/config.json', 'w'))
open(f'{work}/etag', 'w').write(d['ETag'])
PY
  cf update-distribution --id "$DIST" \
    --if-match "$(cat "$WORK/etag")" \
    --distribution-config "file://$WORK/config.json" \
    --query 'Distribution.Status' --output text
  echo "  ✓ 403/404 → /index.html"
  echo "  waiting for the distribution to settle (a few minutes)…"
  cf wait distribution-deployed --id "$DIST"
fi

# ---- 2. the router ---------------------------------------------------------
#
# The comment is passed as one quoted argument. Unquoted, the shell hands the
# shorthand parser an apostrophe from a word like "page's" and it stops there,
# which is how the first attempt at this failed after step 1 had already run.
ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
cf update-function --name "$FUNC" --if-match "$ETAG" \
  --function-config "Comment=Serve each page from its own prerendered file and 301 the pages that moved,Runtime=cloudfront-js-2.0" \
  --function-code "fileb://$HERE/legacy-redirects.js" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text
echo "  ✓ new code staged"

# Run it on CloudFront's own runtime before it goes live.
ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
for probe in /law /bulls-eye /assets/app-a1b2.js; do
  python3 -c "
import json, sys
json.dump({
    'version': '1.0',
    'context': {'eventType': 'viewer-request'},
    'viewer': {'ip': '1.2.3.4'},
    'request': {'method': 'GET', 'uri': sys.argv[1],
                'headers': {}, 'cookies': {}, 'querystring': {}},
}, open(sys.argv[2], 'w'))
" "$probe" "$WORK/event.json"
  OUT="$(cf test-function --name "$FUNC" --if-match "$ETAG" --stage DEVELOPMENT \
    --event-object "fileb://$WORK/event.json" \
    --query 'TestResult.FunctionOutput' --output text)"
  printf '  %-24s → %s\n' "$probe" "$(python3 -c "
import json, sys
o = json.loads(sys.argv[1])
r = o.get('response') or o.get('request')
print(r.get('statusCode') or r.get('uri'))
" "$OUT")"
done

cf publish-function --name "$FUNC" --if-match "$ETAG" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text
echo "  ✓ function published"

cf create-invalidation --distribution-id "$DIST" --paths '/*' \
  --query 'Invalidation.Id' --output text
echo "  ✓ invalidated — give it a minute, then:"
echo "      curl -s https://svastrino.com/law | grep -o '<title>[^<]*'"
