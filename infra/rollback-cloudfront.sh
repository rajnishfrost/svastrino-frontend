#!/usr/bin/env bash
# Put the distribution back the way Terraform describes it. RUN THIS FIRST.
#   ./infra/rollback-cloudfront.sh
#
# What went wrong
# ---------------
# To make the prerendered pages reachable, a 403/404 → /index.html rule was
# added to the distribution. CloudFront applies those rules to the WHOLE
# distribution, including the /api/* behaviour — which terraform/modules/
# frontend/main.tf warns about in as many words, and deliberately avoided.
#
# So the API's own 403s and 404s are being replaced by the app shell with
# status 200. That is not cosmetic:
#
#   - a disabled account signing in gets 403 "This account has been disabled";
#     it now arrives as a 200 and the login form reads it as a success
#   - the learn page's NOT_ENROLLED / PHASE_LOCKED / LOCKED 403s decide whether
#     to show the enrol prompt or the locked video; they now look like content
#   - every admin and organisation role gate answers 403; they now answer 200
#   - ~73 real 404s, five of them wired into rendering, now answer 200
#
# This undoes both halves: the error rules, and the router function that
# depended on them. The site goes back to how it was this morning — every page
# serving the app shell, which is the SEO problem that started all this, but a
# working site beats a fast one.
set -euo pipefail

PROFILE="${AWS_PROFILE:-svastrino-terraform}"
DIST="${CF_DISTRIBUTION:-EIGJWQLU4U4X2}"
FUNC="${CF_FUNCTION:-svastrino-prod-spa-router}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"

cf() { aws --profile "$PROFILE" cloudfront "$@"; }

if [ ! -s "$HERE/spa-router.rollback.js" ]; then
  echo "✗ infra/spa-router.rollback.js is missing — it holds the function body to restore."
  exit 1
fi

echo "→ distribution $DIST · function $FUNC · profile $PROFILE"

# ---- 1. the router first, so nothing starts missing ------------------------
ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
cf update-function --name "$FUNC" --if-match "$ETAG" \
  --function-config "Comment=Rewrite extensionless paths to /index.html for client-side routing,Runtime=cloudfront-js-2.0" \
  --function-code "fileb://$HERE/spa-router.rollback.js" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text

ETAG="$(cf describe-function --name "$FUNC" --query 'ETag' --output text)"
cf publish-function --name "$FUNC" --if-match "$ETAG" \
  --query 'FunctionSummary.FunctionMetadata.Stage' --output text
echo "  ✓ router restored"

# ---- 2. then the error rules, which nothing needs any more ------------------
cf get-distribution-config --id "$DIST" > "$WORK/before.json"
python3 - "$WORK" <<'PY'
import json, sys
work = sys.argv[1]
d = json.load(open(f'{work}/before.json'))
c = d['DistributionConfig']
c['CustomErrorResponses'] = {'Quantity': 0, 'Items': []}
json.dump(c, open(f'{work}/config.json', 'w'))
open(f'{work}/etag', 'w').write(d['ETag'])
PY
cf update-distribution --id "$DIST" \
  --if-match "$(cat "$WORK/etag")" \
  --distribution-config "file://$WORK/config.json" \
  --query 'Distribution.Status' --output text
echo "  ✓ 403/404 rules removed"

cf create-invalidation --distribution-id "$DIST" --paths '/*' \
  --query 'Invalidation.Id' --output text
echo "  ✓ invalidated"
echo ""
echo "  check the API answers for itself again:"
echo "    curl -s -o /dev/null -w '%{http_code} %{content_type}\\n' \\"
echo "      https://d1d66ne3xrrmwd.cloudfront.net/api/user/content/resolve/no-such-slug"
echo "    expected: 404 application/json"
