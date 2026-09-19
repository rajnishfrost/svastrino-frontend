// The classes an account can record. School years run through to the end of a
// master's, because mentoring is bought by undergraduates and postgraduates as
// often as by school students; 'Graduate' and 'Other' said too little about
// where someone actually is.
//
// The server deliberately stores a bounded free string rather than an enum —
// organisation imports and older lists carry their own wording — so this is
// the list we OFFER, not the list we accept. Accounts still holding a retired
// value keep it: classOptionsFor puts it at the top of their own dropdown.
// The longest entry here is 22 characters, well inside LIMITS.studentClass.
export const CLASSES = [
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  '1st Year Undergraduate',
  '2nd Year Undergraduate',
  '3rd Year Undergraduate',
  '4th Year Undergraduate',
  '5th Year Undergraduate',
  '1st Year Masters / PG',
  '2nd Year Masters / PG',
  'Others',
]

/**
 * The dropdown for an account that may already carry wording we never offered.
 * Keeping that value at the top means opening the picker can never quietly
 * rewrite a class the student did not touch.
 */
export const classOptionsFor = (current) =>
  current && !CLASSES.includes(current) ? [current, ...CLASSES] : CLASSES
