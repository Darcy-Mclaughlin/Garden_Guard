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
- Use **1×/2× Speed** to change the simulation speed without changing balance.
- Fuse compatible guardians by selecting one and placing it onto an occupied plot. Try Glow Sprig + Thorn Coil, Dew Well + Bark Bastion, and Ember Pod + Breeze Bell.
- Read enemy armor colors: orange resists blast damage but is weak to slow, purple resists slow but is weak to blasts, and cyan resists pushback but is weak to direct green sparks.
- The final Moon Surge includes a colossal Orchard Breaker that throws enemies into plots near the moon gate.
- Click glowing dew drops to collect resources.
- Use **Uproot** and click a placed guardian to remove it.
- Keyboard: `1`–`9` and `0` select guardians, arrow keys move the plot cursor, `Enter` places, `R` toggles uproot mode, `Space` collects nearby dew, and `P` pauses.

All visuals and game concepts are original and rendered with HTML, CSS, and Canvas. No external assets, libraries, or copyrighted game content are used.
