/**
 * Where a visitor who asked for the Nirmaan free trial is headed, and how that
 * wish survives sign-up.
 *
 * Sign-up does not log anyone in: it emails a verification link, and clicking
 * that link lands on a brand-new /login with none of the router state that sent
 * them there — frequently on another day, or from the mail app. A flag in
 * localStorage is the only thing that crosses that gap, so the Nirmaan page
 * writes it (FreeTrial.jsx) and the login page spends it (Login.jsx).
 *
 * It is a hint, never an entitlement: the server decides whether a trial is
 * actually granted, so a copied flag buys nobody a second free week.
 */
export const TRIAL_INTENT = 'nirmaan_trial_intent'
export const LEARN_PATH = '/learn/nirmaan'
