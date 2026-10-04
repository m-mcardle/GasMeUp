# GasMeUp — brag plan

**What it is:** An iOS app that works out what a car trip cost in gas and splits it between the people in the car.
**Who for:** Anyone who drives friends around (or rides along) and is tired of "so… what do I owe you for gas?"
**What sets it apart:** It does the whole loop: live regional gas price + your car's fuel economy → trip cost → pick who was in the car → everyone's balance updates and they get a push notification. No calculator, no group-chat IOUs.
**Most impressive claim:** README: "Just put in your riders, your route, and we will do the rest."
**Visual hook:** The violet hero card counting up the trip cost, then splitting it four ways.
**Real UI to show:** Calculate screen (route card + "Estimated trip cost" hero card + stat tiles), "Who was in the car?" picker, "Who drove?" split sheet, Friends balances, the real "New Trip" push copy from `functions/src/notificationMessages.ts`.
**Tone:** `default` — punchy, playful, clean, in the app's own "Midnight Violet" look (v1.4 redesign).
**Share caption:** "Road trip math, solved: GasMeUp prices the drive and splits it with everyone in the car."

## Visual identity
- Background ink950 `#09080F`, surfaces `#151321` / `#1C192B`, hairline borders.
- One accent: violet `#7C5CFF` (text `#B3A1FF`), hero gradient `#8A6CFF → #5B36E6 → #3A1F9E`.
- Money colours: mint `#3DDC97` (owed to you), coral `#FF6B7A` (you owe).
- Inter 400–800 (the app's bundled font), Ionicons + MaterialCommunityIcons from the app.
- Phone is rebuilt in HTML from the app's real components/tokens (Page, ScreenHeader, Card, RouteField, StatsSection, ListRow, TripSettingsModal, FriendRow); copy taken verbatim from source.
- Trip numbers use the app's real formula: 541.6 km × 10 L/100km (app default) × $1.42/L = $76.91; split evenly 4 ways = $19.23.

## Storyboard (22s, 1920×1080, 30fps)

| # | Time | Scene | On screen | Motion | Sound |
|---|---|---|---|---|---|
| 1 | 0.0–2.8 | Hook | Big type, left: "4 friends. 1 road trip." then "Who owes what for gas?" (violet "gas") | Words punch in one by one; glow breathes | Kick + bass enter on beat 1; soft tick per word |
| 2 | 2.8–6.3 | Reveal | Phone slides in on the right (Calculate tab). Typing "Toronto, ON" → suggestion tap → "Montréal, QC". Left caption: "Pick a start and a destination." | Type-on, suggestion list, tap ripple | Soft key clicks under the music |
| 3 | 6.3–10.0 | Highlight 1 — the cost | Hero card pulses (loading) then counts $0 → **$76.91**, tiles fill: 541.6 km · 54.2 L · 10.0 L/100km · $1.42/L. Caption: "Live gas prices. Your car's fuel economy." | Count-up, camera punch-in on card | Rising riser into a bright chord stab on the reveal |
| 4 | 10.0–14.2 | Highlight 2 — split | Tap "Save & split with friends" → "Who was in the car?" check 3 friends → "Who drove?" sheet: "Split evenly $19.23 each, driver included". Caption: "Tap who was in the car." | Checks pop in sequence, sheet slides up | Pluck per check (in key) |
| 5 | 14.2–17.5 | Highlight 3 — balances | Friends tab: You're owed **$57.69** (mint), rows "Owes you $19.23". A "New Trip" push banner drops in on a second, tilted phone behind: "Riley Morgan added a new trip! You owe $19.23." (Riley = you, the driver; the banner is on a friend's phone) Caption: "Everyone's balance updates. Nobody does the math." | Rows stagger in, banner drop | Notification chime (in key) |
| 6 | 17.5–22.0 | Outro | App icon (the car on violet), "GasMeUp", README line "Put in your riders, your route — we'll do the rest.", "On the App Store" | Icon scale-in, text rises, settle & hold | Final chord, tail out |

Total: 22s (outro extended so the README line holds long enough to read).

Names (you: Riley Morgan; friends: Alex Chen, Sam Patel, Jordan Lee) and the route are illustrative UI content.

## Sound
Self-synthesised 120 BPM track in F major: soft four-on-the-floor, sub bass, warm pad chords (F – Dm – Bb – C), light hats. All SFX pitched to F major and mixed ~10 dB under the music.
