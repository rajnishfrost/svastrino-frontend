// The three policy pages, served locally (no backend). Bodies are the cleaned
// Google-Docs exports in this folder — regenerate with scripts/clean-legal.mjs
// after replacing a source .md. Rendered at /legal/:slug by LegalPage.jsx.
import termsOfUse from './terms-of-use.md?raw'
import privacyPolicy from './privacy-policy.md?raw'
import cancellationsAndRefunds from './cancellations-and-refunds.md?raw'

// Bump when a policy's wording changes so the "Last updated" line stays honest.
const UPDATED_AT = '2026-09-17'

export const LEGAL_PAGES = {
  'terms-of-use': {
    slug: 'terms-of-use',
    title: 'Terms of Use',
    updatedAt: UPDATED_AT,
    body: termsOfUse,
  },
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    updatedAt: UPDATED_AT,
    body: privacyPolicy,
  },
  'cancellations-and-refunds': {
    slug: 'cancellations-and-refunds',
    title: 'Cancellations & Refunds',
    updatedAt: UPDATED_AT,
    body: cancellationsAndRefunds,
  },
}
