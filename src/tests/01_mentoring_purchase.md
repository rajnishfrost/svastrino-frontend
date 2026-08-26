# Mentoring purchase — Bull's Eye, Bloom, Breakthrough

One payment buys a whole programme. Every session after the first is booked free
against it. Breakthrough is not sold from a checkout at all.

| Programme    | SKU                        | Sessions | Sold how                      |
| ------------ | -------------------------- | -------- | ----------------------------- |
| Bull's Eye   | `mentoring-bullseye`     | 3        | Checkout                      |
| Bloom        | `mentoring-bloom`        | 5        | Checkout                      |
| Breakthrough | `mentoring-breakthrough` | 22       | After a call — see section G |

---

## The absolute path

```
/  →  /services  →  /services/bulls-eye  →  Book now
                                              │
                    /book-online?program=mentoring-bullseye
                                              │
   ┌──────────┬───────────┬──────────┬────────┴─────────┐
   ▼          ▼           ▼          ▼                  ▼
 1 Date    2 Your      3 Verify   4 Payment        Confirmation
   & time    details                                    │
                                                        ▼
                                                   /dashboard
                                              Mentoring section
```

A person may also enter at `/book-online` and pick a programme there — that
route only offers *View details*, so it goes through the programme page either
way. Signing in first is optional; step 2 makes an account for a guest.

---

## A · The calendar (step 1)

Rules live in `server/src/modules/user/mentoring/slots.js`. All of them are IST.

| Rule                           | Value                                 |
| ------------------------------ | ------------------------------------- |
| Earliest bookable date         | today + 3 days                        |
| Latest bookable date           | today + 2 months                      |
| Slot length                    | 2 hours                               |
| Start times                    | 9:00 to 16:00, every 30 minutes       |
| Gap around an existing booking | 30 minutes each side                  |
| Sunday                         | only slots that**end** by 13:00 |
| Monday                         | closed                                |

### Cases

| id       | Do this                                                              | Expect                                                                                                       |        |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------ |
| MENT-A1  | Try to pick today                                                    | Greyed out, not clickable                                                                                    | REFUSE |
| MENT-A2  | Try tomorrow, and the day after                                      | Both greyed out                                                                                              | REFUSE |
| MENT-A3  | Pick today + 3                                                       | Selectable; times appear                                                                                     | PASS   |
| MENT-A4  | Page forward past two months                                         | Nothing beyond today + 2 months is selectable                                                                | REFUSE |
| MENT-A5  | Open any Monday                                                      | No times at all                                                                                              | REFUSE |
| MENT-A6  | Open any Sunday                                                      | Exactly 5 times: 9:00, 9:30, 10:00, 10:30, 11:00. The last runs 11:00–13:00                                 | PASS   |
| MENT-A7  | Open a Wednesday                                                     | Exactly 15 times, 9:00 to 16:00 on the half hour                                                             | PASS   |
| MENT-A8  | Read the note under the calendar                                     | `Bookings open 3 days ahead · Sundays till 1 PM only · Mondays closed.`                                  | PASS   |
| MENT-A9  | Book 12:00–14:00, reopen that date                                  | 12:00 gone, and 11:30 and 12:30 and 13:00 and 13:30 too. Next offered start is 14:30                         | PASS   |
| MENT-A10 | Two browsers, same slot, confirm in both                             | Second is sent back:`That slot was just taken — please pick another time.` Never two bookings on one slot | REFUSE |
| MENT-A11 | Call`POST /api/user/mentoring/bookings` directly with today's date | Refused. The rule is enforced on the server, not only hidden in the UI                                       | REFUSE |

---

## B · Your details (step 2), signed in

| Field     | Accepts                 | Notes                                       |
| --------- | ----------------------- | ------------------------------------------- |
| Full name | filled from the account | locked                                      |
| Email     | filled from the account | locked                                      |
| Phone     | editable                | optional                                    |
| Coupon    | uppercase, trimmed      | only offered when there is something to pay |

| id      | Do this                        | Expect                                           |      |
| ------- | ------------------------------ | ------------------------------------------------ | ---- |
| MENT-B1 | Reach step 2 signed in         | Name and email filled and locked; phone editable | PASS |
| MENT-B2 | Change the phone and continue  | The new number is on the booking                 | PASS |
| MENT-B3 | Leave phone empty and continue | Allowed — phone is optional                     | PASS |

---

## C · Your details (step 2), as a guest

The account is created here from what is typed. Rules from
`credentials.dto.js` → `validateGuest`.

| Field     | Rule                                                                           | Refusal wording                                 |
| --------- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| Full name | starts with a letter, then letters, spaces,`.` `-` `'`; 2–60 characters | `Enter a valid name (letters, spaces, . - ')` |
| Email     | `something@something.something`                                              | `Enter a valid email address`                 |
| Phone     | optional;`+` then 8–15 digits                                               | `Enter a valid phone number`                  |

| id      | Do this                                      | Expect                                                                                                                                                   |        |
| ------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| MENT-C1 | Signed out, new email, valid name, continue  | Account created and signed in; the booking carries on without a separate sign-up                                                                         | PASS   |
| MENT-C2 | Name`A` (one character)                    | `Enter a valid name (letters, spaces, . - ')`                                                                                                          | REFUSE |
| MENT-C3 | Name`123`                                  | Same refusal — a name must start with a letter                                                                                                          | REFUSE |
| MENT-C4 | Name`Rohit M. Gala`                        | Accepted — full stops, apostrophes and hyphens are allowed                                                                                              | PASS   |
| MENT-C5 | Email`rohit@`                              | `Enter a valid email address`                                                                                                                          | REFUSE |
| MENT-C6 | Email that already has an account            | Amber panel:`An account with this email already exists. Log in to continue →`. Logging in returns to the same booking with date and time still chosen | REFUSE |
| MENT-C7 | Phone`12345`                               | `Enter a valid phone number` — under 8 digits                                                                                                         | REFUSE |
| MENT-C8 | Phone`+919987777016`                       | Accepted                                                                                                                                                 | PASS   |
| MENT-C9 | Submit the guest step 21 times in 15 minutes | The 21st is rate-limited. Twenty attempts per 15 minutes                                                                                                 | REFUSE |

---

## D · Coupon

| id      | Do this                                                  | Expect                                                                       |        |
| ------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- | ------ |
| MENT-D1 | Apply a valid coupon                                     | Fee lines redraw; box becomes`Coupon <CODE> applied` with a Remove control | PASS   |
| MENT-D2 | Press Remove                                             | Original price returns                                                       | PASS   |
| MENT-D3 | Apply a code that does not exist                         | `Invalid coupon code`                                                      | REFUSE |
| MENT-D4 | Apply an expired coupon                                  | `This coupon has expired`                                                  | REFUSE |
| MENT-D5 | Apply one whose redemptions are used up                  | `This coupon is no longer available`                                       | REFUSE |
| MENT-D6 | Apply one tied to a different package                    | `This coupon does not apply to that package`                               | REFUSE |
| MENT-D7 | Type a code in lowercase                                 | Turned into capitals before it is checked                                    | PASS   |
| MENT-D8 | As a guest, type a code before the details are confirmed | `Coupon will be applied after your details are confirmed.`                 | PASS   |

---

## E · Verify and pay (steps 3 and 4)

| id      | Do this                                                          | Expect                                                                                                                        |      |
| ------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---- |
| MENT-E1 | Read the Verify screen                                           | Programme, session number, full date, time with duration, name, email, phone, and the fee breakdown                           | PASS |
| MENT-E2 | Read the closing line                                            | `You can reschedule any session until 2 days before it starts.`                                                             | PASS |
| MENT-E3 | Pay with`4111 1111 1111 1111`                                  | Confirmation with programme, session, when, amount and receipt number                                                         | PASS |
| MENT-E4 | Watch the moment payment succeeds                                | **No** `Cannot read properties of null (reading 'orderId')`. That bug took the money and made no booking; it is fixed | PASS |
| MENT-E5 | Pay with Razorpay's failure card                                 | Razorpay's window closes and one screen answers:`Your payment did not go through` · `Nothing has been charged.`          | PASS |
| MENT-E6 | On that screen press*Try the payment again*, then pay properly | Goes through. A failed attempt does not kill the order                                                                        | PASS |
| MENT-E7 | Open the payment window, close it with ✕                        | Spinner stops; the page offers to reopen it. Never stuck on`Processing…`                                                   | PASS |
| MENT-E8 | Check the currency offered                                       | Live mode: INR only. Test mode may also offer a foreign currency — that is Razorpay's test behaviour                         | PASS |
| MENT-E9 | Book session 2 after paying                                      | Straight to the calendar, no payment step. One payment covers every session                                                   | PASS |

---

## F · What lands where

After a successful first booking, check each of these. This is what proves the
purchase really happened rather than just looking like it did.

| Where                         | What should be there                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `orders`                    | One row,`status: 'paid'`, with a receipt number and the amount                                              |
| `enrollments`               | **One** row, `product: 'mentoring-bullseye'`, `status: 'active'`. Two rows for one payment is a bug |
| `mentoringbookings`         | One row,`sessionNumber: 1`, with `startAt` and `endAt` two hours apart                                  |
| `/dashboard` → Mentoring   | The programme, with a row per session. Session 1 shows the appointment; the rest say*Not booked yet*        |
| `/dashboard` → Skill Build | The mentoring programme must**not** appear here                                                         |
| Admin → Services → Bookings | The booking, with the student's name**and** email, programme, session number, time in IST               |
| Settings → Orders            | The order, and*Download invoice* produces a branded PDF                                                     |

| id      | Do this                                              | Expect                                                                                        |        |
| ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| MENT-F1 | Open the dashboard                                   | Programme under Mentoring, not Skill Build                                                    | PASS   |
| MENT-F2 | Count the session rows                               | Bull's Eye 3, Bloom 5, Breakthrough 22                                                        | PASS   |
| MENT-F3 | Book every session, then try one more                | `All <n> sessions of this program are already booked` — n is the programme's session count | REFUSE |
| MENT-F4 | Reschedule a session more than 2 days away           | Calendar reopens; new slot taken; no payment                                                  | PASS   |
| MENT-F5 | Reschedule one less than 2 days away                 | `Rescheduling closes 2 days before the session — please contact us`                        | REFUSE |
| MENT-F6 | Reschedule a session already marked completed        | `Only upcoming bookings can be rescheduled`                                                 | REFUSE |
| MENT-F7 | As admin, write a session update and two tasks, save | Both appear on the student's dashboard against that session, word for word                    | PASS   |
| MENT-F8 | Download the invoice                                 | Branded; address reads`Thane · Dharamshala` with no Mumbai; tagline `Soch Se Vikas`      | PASS   |
| MENT-F9 | On the clean account, try to book anything           | `Please purchase this program first`                                                        | REFUSE |

---

## G · Breakthrough — sold after a call

Breakthrough carries `buyMode: 'expert-call'`. The checkout refuses it until an
admin has approved that person's call request.

```
/services/breakthrough  →  Talk to an expert  →  form
                                                   │
                                    Admin → Enquiries → Approve to pay
                                                   │
                              e-mail with a booking link → checkout opens
```

| id      | Do this                                                               | Expect                                                                          |        |
| ------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| MENT-G1 | Look for a way to pay on`/services/breakthrough`                    | There is none. Every button says*Talk to an expert*                           | PASS   |
| MENT-G2 | Send the call-back form with name and phone                           | Thank-you saying a mentor will call within one working day                      | PASS   |
| MENT-G3 | Send it with no phone                                                 | `Please leave a phone number so we can reach you`                             | REFUSE |
| MENT-G4 | Admin → Enquiries, filter*Expert call requests*                    | The request, with programme and best time to call                               | PASS   |
| MENT-G5 | Before approving, open`/book-online?program=mentoring-breakthrough` | The wizard steps aside and explains the programme starts with a call            | REFUSE |
| MENT-G6 | Before approving, call`POST /api/user/payments/order` with that SKU | Refused on the server too:`This program starts with a call from our team…`   | REFUSE |
| MENT-G7 | As admin press*Approve to pay*                                      | Status becomes*Approved*; if the enquiry had an email, a booking link is sent | PASS   |
| MENT-G8 | Now buy Breakthrough on that account                                  | Checkout opens and payment completes                                            | PASS   |
| MENT-G9 | Approve an enquiry with a phone but no email                          | Still approves; the server log says plainly that no link could be sent          | PASS   |

---

## Known gaps

| What you will see                        | Why                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prices read ₹2,999 / ₹4,999 / ₹19,999 | Seed placeholders. The planning sheet and the live site both say ₹7,990 / ₹27,900 / ₹1,39,000. Changing them is one field in Admin → Services |
| No booking appears in Google Calendar    | The booking keeps a`gcalEventId` field but the sync is not built                                                                                |
| No notification when a booking is made   | `notify()` is only called from support tickets today                                                                                            |
