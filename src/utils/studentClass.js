// The classes an account can record, in the words the site has always used.
// The server deliberately stores a bounded free string rather than an enum —
// organisation imports and older lists carry their own wording — so this is
// the list we OFFER, not the list we accept.
export const CLASSES = ['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Other']

/**
 * The dropdown for an account that may already carry wording we never offered.
 * Keeping that value at the top means opening the picker can never quietly
 * rewrite a class the student did not touch.
 */
export const classOptionsFor = (current) =>
  current && !CLASSES.includes(current) ? [current, ...CLASSES] : CLASSES
