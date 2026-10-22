# LoadLine Eating Window

> **STATUS: PENDING REED'S HEALTH REVIEW (v5, after Reed's fourth Oct 22 2026 review; re-review required).** All health copy, formulas, safety-gate rules, meal-spacing rules and sources need Reed's health review before public release. Do not publish until it is signed off.

Free, installable PWA from LoadLine Fitness. Static, no build step, no accounts. Data is stored only in the browser (localStorage key `loadline_eatwin_v1`).

## Files
- `index.html`: the whole app (vanilla JS)
- `sw.js`: offline cache (cache `loadline-eatwin-v1`)
- `manifest.webmanifest`
- `icons/`: icon-180 (apple-touch), icon-192, icon-512, icon-512-maskable (10% safe-zone padding)

## Deploy
1. Upload this folder to any HTTPS static host (Netlify Drop, Cloudflare Pages, Vercel, GitHub Pages). HTTPS is required for install.
2. iPhone: Safari > Share > Add to Home Screen. Android: Chrome menu > Install app.
3. Works offline after the first visit.

## Review checklist for Reed
- Safety gate items and the "Talk with your clinician or dietitian first." wording
- "Stop and eat if you feel dizzy, shaky, faint or unwell."
- Calorie floors (1200 F / 1500 M) and 400 kcal deficit; protein 1.6 g/kg capped at 2 g/kg
- Reference intakes (copied verbatim from the Jax Kalenz app's `nums()`)
- Meal spacing (4-5 h target, snack after 5 h), bedtime gap (warn under 2 h, ideal 3 h), exercise timing (1-2 h after a meal, 30 min after a snack), Seconds wait (15-20 min)
- Sources listed in the About tab

## v2 changes (Reed review, Oct 22 2026)
Age asked first (under 13 blocked; 13-17 Off and 12:12 only, no kcal/macros, no Weight loss goal); kcal/macros hidden until Targets is saved; care box feeds the safety gate; expanded gate with required "None of these apply to me", 90-day re-check, doctor-OK tick for 20:4/OMAD and for 16:8+ at 65+ or frail; 23 h fast cap; OMAD caution; new stop/911 line; height/weight validation; BMI under 18.5 = no deficit; "Estimated maintenance" label below the floor; new deficit wording; unsupported claims removed; disclaimer in onboarding and About; sex-option note; macro cap; privacy/data note.

## v3 changes (Reed re-review, Oct 22 2026)
Rules now use the actual computed fast, not the mode name: snaps are skipped past nominal + 2 h, at 20 h+ without the doctor-OK tick, or past 14 h for minors/flagged users; a fast over 14 h (minors/flagged) or 16 h (adults, unless doctor-OK covers 20:4/OMAD/20 h+) pulls the start back to wake + 60 min with a long-overnight-fast note; kitchen close must be at least 10 h after wake for minors/flagged users; any mode whose real fast reaches 20 h needs the doctor-OK tick (Jesse's work-day 18:6 at 3 PM included). "I have trouble keeping weight on" is a hard-block gate item; the frail item reads "I am frail". New macro-cap wording. Cache bumped to loadline-eatwin-v3.

## v4 changes (Reed re-review, Oct 22 2026)
Block instead of warn: if the real fast after the pull-back is over 14 h (minors/flagged) or 20 h or more (anyone, unless doctor-OK covers a non-Off/12:12 mode within nominal + 2 h), no window is planned and a block message points to Setup; Off and 12:12 can be blocked too. The 10 h wake-to-close rule for minors/flagged users is now enforced on saved data (legacy data, flagged after Setup, age changed to under 18): the app opens Setup with an update message. New Modes sentence on skipped breaks, updated doctor-OK note, and a night-shift/late-wake support note on Setup save failures. Cache bumped to loadline-eatwin-v4.

## v5 changes (Reed re-review, Oct 22 2026)
Saved schedules for all users are re-checked against the Off rule (offBad, no plan() call). A schedule whose Off plan would mean a fast of 20 h or more (e.g. wake 3:30 PM, close 5 PM) blocks every mode, including OMAD with doctor OK, and opens Setup with "Your schedule needs an update: your wake time and kitchen close leave too short an eating window." The 10 h message stays for the minor/flagged case. The redirect now refreshes the tab bar so Setup is marked current. Cache bumped to loadline-eatwin-v5.

Still open for Jesse or the attorney: COPPA/minor privacy, privacy policy/terms, and the "0.5-1 lb per week" wording.
