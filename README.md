# Garden Guard

Garden Guard is an original, self-contained browser lane-defense game. Build a line of moonmeadow guardians, discover powerful fusions, harvest dew, and protect the moon gate through campaign waves or Endless Moonmeadow.

The campaign starts with a small scouting wave and gives longer preparation windows between waves. Later formations grow substantially tougher, introduce resistance specialists, and culminate in the Orchard Breaker boss.

## Levels

- Level 1: Sprout Path - Glow Sprig, Dew Well, and Vine Lash.
- Level 2: Bramble Rise - adds Bark Bastion, Thorn Coil, and Lantern Leaf, plus the first fusion lesson.
- Level 3: Windfire Reach - adds Breeze Bell, Ember Pod, and Pebble Pod.
- Level 4: Moonlit Grove - adds Tempo Reed, Mend Moss, and Mist Fern.
- Level 5: Orchard Break - adds Sunburst Corm, Hush Cap, and Star Bloom, ending with the Orchard Breaker.

Completing a level unlocks the next level in the main menu, grants a persistent upgrade choice, and eventually unlocks Endless mode. Progression, settings, and endless best score are stored in `localStorage`.

## Run

No build or dependencies are required. Open `index.html` directly, or serve the folder locally:

```powershell
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Controls

- Click a guardian card, then click a garden plot to place it.
- Each guardian card must recharge after placement. Its remaining time appears on the card.
- Sunburst Corm and Hush Cap are instant-use guardians: place them to trigger a blast or garden-wide chill, after which they disappear and begin a longer recharge.
- Mend Moss heals adjacent guardians, while Tempo Reed accelerates adjacent guardians' abilities.
- Hedge Vaulters leap over the first guardian they meet, Rage Scribes become faster and stronger when their parchment shield breaks, and Gloom Heralds empower nearby enemies.
- Energized enemies occasionally burst with a gold-green pulse and drop plant food. Plant food is now stored as charges.
- Press **F** or click **Plant food** to arm one charge, then place it on a specific guardian for a role-based boost (damage bursts, healing/protection, dew generation, cooldown acceleration, lane push/slow, etc.).
- Plant food strength and duration can be improved via between-level progression upgrades.
- Use **1×/2× Speed** to change the simulation speed without changing balance.
- Before every run, choose **two fusion slots**. Only those two fusion recipes can trigger in that run.
- Existing fusions still work, plus new recipes including Bark Bastion + Mend Moss, Glow Sprig + Tempo Reed, and Hush Cap + Mist Fern.
- Read enemy armor colors: orange resists blast damage but is weak to slow, purple resists slow but is weak to blasts, and cyan resists pushback but is weak to direct green sparks.
- The final Moon Surge includes a colossal Orchard Breaker that throws enemies into plots near the moon gate.
- Each lane has a mower mech as a one-use emergency defense. It clears the first breach in its lane; enemies that get past the mower damage the moon gate.
- Click glowing dew drops to collect resources, and grab green plant food drops when energized enemies fall.
- Use **Uproot** and click a placed guardian to remove it.
- Enter `DEBUG` in the Test code field to unlock the safe testing console. Then use `HELP`, `TEST_ALL`, `FOOD`, `FOOD +`, `ENERGIZED`, `WAVE 5`, `WIN`, `LOSE`, or `RESET`.
- Keyboard: `1`–`9` and `0` select guardians, arrow keys move the plot cursor, `Enter` places/uses armed plant food, `F` toggles plant food arm mode, `R` toggles uproot mode, `Space` collects nearby dew, and `P` pauses.

## New systems

- **Progression upgrades:** pick one reward after level clears (starting dew, guardian health, recharge trim, mower strength, plant-food boost).
- **Endless mode + weather:** unlocked after campaign completion, with rotating Heavy Dew / Moon Fog / Cold Night / Strong Wind / Eclipse modifiers.
- **Distinct enemy variants:** Burrower, Splitling (spawns sproutlets), and Night Gardener support enemy.
- **Settings:** toggles for SFX, music, reduced motion, screen shake, high contrast, and colorblind indicators. Includes progression reset.
- **Sound:** dependency-free Web Audio effects and ambient pulses, started only after interaction.
- **Feedback:** floating damage/status text, readiness rings, low-health warnings, and lane danger warnings.
- **Tutorial:** short and skippable; completion/skip state persists.

## Testing

Run lightweight Node tests and syntax checks:

```bash
npm test
node --check game.js
node --check systems.js
```

A GitHub Actions workflow (`.github/workflows/node-ci.yml`) runs the same checks on PRs.

All visuals and game concepts are original and rendered with HTML, CSS, and Canvas. No external assets, libraries, or copyrighted game content are used.
