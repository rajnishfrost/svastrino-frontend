# Input validation

Every box on this site that a person can type into is governed by one contract,
written twice:

| | |
|---|---|
| `client/src/utils/validate.js` | tells the visitor what is wrong, while they are still looking at the field |
| `server/src/utils/validate.js` | **decides.** A request never has to come from our page |

The two files mirror each other — same limits, same regexes, same signatures.
**When you change one, change the other.** They came to exist because the rules
had been written out three and four times across the codebase and had drifted:
the sign-up page capped a phone at 15 characters while the enquiry form and the
database allowed 20, and four different email regexes disagreed about `a@b`.

## The three rules

**1. Everything has a length limit.** `LIMITS` holds one number per kind of
field, and both the `maxLength` attribute in the browser and the truncation on
the server read from it. No form writes a number of its own.

**2. Every field is checked for the kind of thing it is.** An email field takes
an email, a phone field takes a number with its country code, a name field takes
letters. A field that accepts anything is a field that will hold anything.

**3. Nothing that looks like code gets through.** Markup, `javascript:`, template
expressions and SQL clauses are refused with an explanation, and the angle
brackets are stripped as a backstop.

## Limits

`LIMITS`, in both files. The numbers are what the *screen* can carry, not what
the box will accept — an enquiry is read in a table cell, a support thread on its
own page, so they differ.

```
name 60   email 254   phone 20   city/state 80    address 240
subject 120   message 2000   ticketMessage 4000   answer 4000   notes 2000
couponCode 24   search 80   password 128   url 300   slug 80   title 160
shortText 200   description 1200   longText 20000   article 100000
```

`article` sits deliberately above the 100 kB JSON body limit. A cap on a field an
admin writes over several sittings should be a backstop, not a guillotine: the
body parser refuses an oversized request first, with an error, rather than us
silently clipping somebody's work on save.

## Length: truncate or refuse?

The server **truncates** on length and **refuses** on wrongness.

A value three characters over its cap is a UI that let someone type too much, not
an attack, and throwing the whole submission away over it loses the message. A
malformed email, a phone with no country code or a payload with a script in it is
refused outright, because there is nothing there worth keeping.

In the browser, `maxLength` stops the typing. On a textarea that also gets a
counter, shown only in the last quarter of the allowance — a running counter over
an empty box reads as a word target, and stopping dead at the limit with nothing
on screen reads as a broken keyboard.

## Phone numbers

**Every phone field on the site is a country picker** (`react-international-phone`),
so what leaves the browser is E.164: `+919987777016`. Sign-up, Settings, the home
banner, Talk-to-an-expert, Contact, Book Online, the organisation profile, the
organisation roster form and the admin organisation form all use the same one.

`requirePhone` still accepts a bare ten-digit number and reads it as Indian. That
is not a loophole, it is the CSV roster importer: a school office types a number
into a spreadsheet, and accounts created before the picker existed hold numbers
in that older shape. Anything that is not a plausible number at all is refused.

A phone holding nothing but its dial code is `PhoneInput` seeding itself on
mount, **not** a number somebody entered. Every form clears it before sending —
otherwise an untouched optional phone field gets rejected as "too short".

## What counts as code

`looksLikeCode` in both files. The list is short on purpose: a longer list catches
more attacks *and* more real sentences, and a contact form that refuses a genuine
message costs us a student.

It flags named markup tags, `javascript:` and `data:text/html`, inline event
handlers, `${…}` and `{{…}}`, `<?php`, SQL clauses, `document.cookie` and `eval(`.

The tag pattern requires the tag name to follow `<` with **no space**, so
"my score was 45 < 60 and the cutoff was 60 > 45" is ordinary prose and passes.
That one is worth preserving if you ever touch the pattern.

`isMostlySymbols` separately refuses a message that is under 40% letters and
digits, so `!!!!!!!!!!!!` does not reach the person who has to answer it.

## Sanitising

| helper | keeps | for |
|---|---|---|
| `str` / `sanitiseLine` | one line, whitespace collapsed | names, cities, titles |
| `text` / `sanitiseText` | paragraphs, blank-line walls collapsed | messages, answers |
| `raw` (server only) | angle brackets | **Markdown bodies only** |
| `sanitiseTyping` (client only) | trailing spaces | anything run on every keystroke |

Two of those have a reason you cannot guess from the name:

`raw` exists because a Markdown line beginning `> ` is a blockquote. Stripping
angle brackets from a blog body would quietly rewrite every quote in every post.
It is safe because blog bodies are admin-authored behind a permission check and
the Markdown renderer builds React elements — it never touches `innerHTML`.

`sanitiseTyping` exists because `sanitiseLine` trims. Run on every keystroke, the
trailing space somebody types between two words is deleted before they reach the
second one, and the field appears to refuse spaces entirely. Normalising
whitespace is a submit-time job.

Angle brackets are stripped even though React escapes at render, because this
data leaves the database through channels that do **not** escape: the enquiry
emails we send the team, and the CSV exports they open in Excel.

Invisible characters go too — zero-width spaces and bidi overrides. A zero-width
space inside an email address, or a bidi override inside a name, is only ever
there to make one string look like another.

## Mongo operator injection

Express parses query strings with `qs`, so `?category[$ne]=x` arrives as an
**object**, and Mongo reads an object in a filter as an operator. Any value from
`req.query` or `req.body` that reaches a query must be forced through `str` (or
a shape check) first. `?q[$ne]=x` used to reach `q.replace` in the public blog
list and return a 500; `{ "sku": { "$ne": null } }` in a booking used to mean
"any package".

The fixed spots are the public blog list, the admin blog list, the admin user
search, the organisation roster search, the payment quote and the mentoring
booking. If you add a filter fed from a request, do the same.

## Errors

A validator throws a 400 carrying `field` — the name of the input it is about.
`errorHandler` passes it to the client, `api()` puts it on the error, and the
enquiry forms' `showServerError(err)` marks that box and focuses it, returning
`false` when there was no field so the caller can show the message itself.

That path matters for the checks a browser cannot make — "this email is already
registered" — so the message still lands on the box it concerns rather than as a
line under the button.

## Adding a field

1. Give its kind a number in `LIMITS`, in **both** files, if it needs a new one.
2. `maxLength={LIMITS.thing}` on the input. Never a literal.
3. Check it client-side with the matching `checkX`, so the visitor is told before
   the round trip.
4. Check it server-side with the matching `requireX` / `optionalX`. **This is the
   one that counts.** The browser copy is good manners.
5. If it reaches a Mongo query, put it through `str` first.
