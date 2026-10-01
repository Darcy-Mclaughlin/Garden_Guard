# Garden Guard

Garden Guard is an original, self-contained browser lane-defense game. Build a line of moonmeadow guardians, discover powerful fusions, harvest dew, and protect the moon gate through ten escalating waves and four Moon Surge checkpoints.

The campaign starts with a small scouting wave and gives longer preparation windows between waves. Later formations grow substantially tougher, introduce resistance specialists, and culminate in the Orchard Breaker boss.

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
- Energized enemies occasionally burst with a gold-green pulse and drop plant food. Collect it to trigger a one-time super-growth burst that empowers every guardian in the garden.
- Use **1×/2× Speed** to change the simulation speed without changing balance.
- Fuse compatible guardians by selecting one and placing it onto an occupied plot. Try Glow Sprig + Thorn Coil, Dew Well + Bark Bastion, and Ember Pod + Breeze Bell.
- Read enemy armor colors: orange resists blast damage but is weak to slow, purple resists slow but is weak to blasts, and cyan resists pushback but is weak to direct green sparks.
- The final Moon Surge includes a colossal Orchard Breaker that throws enemies into plots near the moon gate.
- Each lane has a mower mech as a one-use emergency defense. It clears the first breach in its lane; enemies that get past the mower damage the moon gate.
- Click glowing dew drops to collect resources, and grab green plant food drops when energized enemies fall.
- Use **Uproot** and click a placed guardian to remove it.
- Enter `DEBUG` in the Test code field to unlock the safe testing console. Then use `HELP`, `TEST_ALL`, `FOOD`, `ENERGIZED`, `WAVE 5`, `WIN`, `LOSE`, or `RESET` to exercise systems without changing normal gameplay.
- Keyboard: `1`–`9` and `0` select guardians, arrow keys move the plot cursor, `Enter` places, `R` toggles uproot mode, `Space` collects nearby dew, and `P` pauses.

All visuals and game concepts are original and rendered with HTML, CSS, and Canvas. No external assets, libraries, or copyrighted game content are used.
