#!/usr/bin/env bash
# Make a missing address answer 404 instead of the home page.
#   ./infra/real-404-cloudfront.sh
#
# What is wrong today
# -------------------
# The distribution answers 403 and 404 with /index.html at a 200. That was
# right when index.html was an empty shell. Prerendering made index.html the
# home page, so now every typo, every retired WordPress address and every
# /?p=123 answers 200 with a full copy of the home page:
#
#   curl -s -o /dev/null -w '%{http_code} %{size_download}\n' \
#     https://svastrino.com/this-does-not-exist   # → 200 260694
#
# Google filed a few hundred of those under "crawled, currently not indexed"
# and spent the crawl budget on them instead of the 200-odd articles that are
# still waiting to be crawled at all.
#
# Two changes, in this order — the order matters
# ---------------------------------------------
# 1. The function, replaced with the regenerated legacy-redirects.js: app
#    routes (/dashboard, /login, everything behind a sign-in) are pointed at
#    /app.html by name, www and trailing-slash addresses answer with a 301.
#
# 2. The 403/404 rule, pointed at /404.html with a 404 status.
#
# Step 2 before step 1 would take the site down for signed-in visitors: under
# the old function /dashboard is rewritten to /dashboard/index.html, which does
# not exist, and the rule that rescues it would by then be answering 404.
#
# Both steps need the deploy to have run first, because /404.html and /app.html
# are written by the prerender step. This checks the bucket and refuses rather
# than half-applying.
#
# Safe to run again. Undoing it is infra/deploy-cloudfront.sh's own rollback
# note: republish spa-router.rollback.js and set the rule back to /index.html.
set -euo pipefail

PROFILE="${AWS_PROFILE:-svastrino-terraform}"
DIST="${CF_DISTRIBUTION:-EIGJWQLU4U4X2}"
FUNC="${CF_FUNCTION:-svastrino-prod-spa-router}"
BUCKET="${S3_BUCKET:-svastrino-prod-frontend}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"

cf() { aws --profile "$PROFILE" cloudfront "$@"; }

echo "→ distribution $DIST · function $FUNC · bucket $BUCKET · profile $PROFILE"

# ---- 0. the two files this depends on --------------------------------------
for key in 404.html app.html; do
  if ! aws --profile "$PROFILE" s3api head-object \
       --bucket "$BUCKET" --key "$key" > /dev/null 2>&1; then
    echo "✗ s3://$BUCKET/$key is missing — deploy the site first (the prerender"
    echo "  step writes both). Without them a missed address returns S3's XML"
    echo "  error and every signed-in route stops loading."
    exit 1
  fi
done
echo "  ✓ 404.html and app.html are in the bucket"

# legacy-redirects.js is generated, and an older copy of it is the one thing
# here that would fail quietly: it points app routes at files that do not
# exist, and step 2 then answers them with a 404 page.
if ! grep -q 'APP_ROUTES' "$HERE/legacy-redirects.js"; then
  echo "✗ infra/legacy-redirects.js predates the app-route rule."
  echo "  Regenerate it first:  cd server && npm run build:redirects"
  exit 1
fi
echo "  ✓ legacy-redirects.js knows the app routes"

cf get-distribution-config --id "$DIST" > "$WORK/before.json"
echo "  saved: $WORK/before.json"

# ---- 1. the function ------------------------------------------------------
ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
cf update-function --name "$FUNC" --if-match "$ETAG" \
  --function-config "Comment=Serve each page from its own file, 301 moved and duplicate addresses, app routes to the shell,Runtime=cloudfront-js-2.0" \
  --function-code "fileb://$HERE/legacy-redirects.js" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text
echo "  ✓ new code staged"

# Run it on CloudFront's own runtime before it goes live. The host matters now,
# so it is part of the event: /learn-how-to-be-successful-... is the probe that
# catches a prefix match written as startsWith, which would turn an article
# into the signed-in shell.
ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
probe() {
  python3 -c "
import json, sys
json.dump({
    'version': '1.0',
    'context': {'eventType': 'viewer-request'},
    'viewer': {'ip': '1.2.3.4'},
    'request': {'method': 'GET', 'uri': sys.argv[1],
                'headers': {'host': {'value': sys.argv[2]}},
                'cookies': {}, 'querystring': {}},
}, open(sys.argv[3], 'w'))
" "$1" "$2" "$WORK/event.json"
  OUT="$(cf test-function --name "$FUNC" --if-match "$ETAG" --stage DEVELOPMENT \
    --event-object "fileb://$WORK/event.json" \
    --query 'TestResult.FunctionOutput' --output text)"
  printf '  %-58s → %s\n' "$2$1" "$(python3 -c "
import json, sys
o = json.loads(sys.argv[1])
r = o.get('response') or o.get('request')
print(r['headers']['location']['value'] if r.get('statusCode') else r.get('uri'))
" "$OUT")"
}
probe /law                                                          svastrino.com
probe /bulls-eye                                                    svastrino.com
probe /blog/                                                        svastrino.com
probe /login                                                        svastrino.com
probe /dashboard/services                                           svastrino.com
probe /learn/nirmaan                                                svastrino.com
probe /learn-how-to-be-successful-by-cultivating-a-growth-mindset    svastrino.com
probe /category/career                                              svastrino.com
probe /assets/app-a1b2.js                                           svastrino.com
probe /                                                             www.svastrino.com

cf publish-function --name "$FUNC" --if-match "$ETAG" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text
echo "  ✓ function published"

# ---- 2. the 403/404 rule ---------------------------------------------------
#
# Both codes, because a missing key in a bucket fronted by an origin access
# control answers 403, not 404 — the reader is not allowed to know whether the
# object exists. Only 404 would leave every typo answering S3's XML.
#
# The TTL is 300 rather than 10: a 404 is not a state worth re-asking the
# origin about several times a second, and CloudFront serves the cached page
# just as fast.
ALREADY="$(python3 -c "
import json
items = json.load(open('$WORK/before.json'))['DistributionConfig']['CustomErrorResponses'].get('Items') or []
print('yes' if items and all(
    i.get('ResponsePagePath') == '/404.html' and i.get('ResponseCode') == '404' for i in items
) else 'no')
")"

if [ "$ALREADY" = "yes" ]; then
  echo "  ✓ 403/404 → /404.html at 404 (already there)"
else
  python3 - "$WORK" <<'PY'
import json, sys
work = sys.argv[1]
d = json.load(open(f'{work}/before.json'))
c = d['DistributionConfig']
c['CustomErrorResponses'] = {
    'Quantity': 2,
    'Items': [
        {'ErrorCode': 403, 'ResponsePagePath': '/404.html',
         'ResponseCode': '404', 'ErrorCachingMinTTL': 300},
        {'ErrorCode': 404, 'ResponsePagePath': '/404.html',
         'ResponseCode': '404', 'ErrorCachingMinTTL': 300},
    ],
}
json.dump(c, open(f'{work}/config.json', 'w'))
open(f'{work}/etag', 'w').write(d['ETag'])
PY
  cf update-distribution --id "$DIST" \
    --if-match "$(cat "$WORK/etag")" \
    --distribution-config "file://$WORK/config.json" \
    --query 'Distribution.Status' --output text
  echo "  ✓ 403/404 → /404.html at 404"
  echo "  waiting for the distribution to settle (a few minutes)…"
  cf wait distribution-deployed --id "$DIST"
fi

cf create-invalidation --distribution-id "$DIST" --paths '/*' \
  --query 'Invalidation.Id' --output text
echo "  ✓ invalidated — give it a minute, then check all of these:"
cat <<'CHECK'

      # a real page still answers, from its own file
      curl -s -o /dev/null -w '%{http_code}  ' https://svastrino.com/law
      curl -s https://svastrino.com/law | grep -o '<title>[^<]*'

      # a typo now says so, and says not to index it
      curl -s -o /dev/null -w '%{http_code}\n' https://svastrino.com/nope-12345
      curl -s https://svastrino.com/nope-12345 | grep -o 'name="robots"[^>]*'

      # signed-in routes still load, and stay out of the index
      curl -s -o /dev/null -w '%{http_code}\n' https://svastrino.com/login
      curl -s https://svastrino.com/login | grep -o 'name="robots"[^>]*'

      # one address per page
      curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.svastrino.com/
      curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://svastrino.com/blog/
CHECK
