# Senja di Pasar — Duel Lapak Terakhir

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kuzan-creator/senja-di-pasar/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kuzan-creator/senja-di-pasar/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Senja di Pasar — Duel Lapak Terakhir.** An original offline card game for the desktop browser. You are **Sari**, a dusk-market stall trader, duelling **Juragan Bara**, a rival who wants the whole market. Spend 4 Koin Senja a turn, combine 28 trading cards across 4 suits — Lampion, Ombak, Daun, Bulan — chase Resonansi, Rantai Senja, Roda Senja and Pasar Ramai combos, read your opponent's intent before you play, and bring their Reputation to 0 before your lamp goes out.

> Dua lapak, satu senja. Habiskan Reputasi lawan sebelum lampumu padam.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step, no files outside `game/`.

- **Goal:** reduce Juragan Bara's Reputasi from 50 to 0. If yours hits 0, your stall closes.
- **Turn:** draw 2 cards, spend up to 4 Koin Senja (5 when Senja Terakhir is active at Reputasi ≤ 10), then press **TUTUP LAPAK**.
- **Cards:** click a card to select it, click again (or press Enter) to play it. Keys **1–8** select, **Enter** plays, **Space** ends the turn, **M** mutes, **R** plays again on the end screens.
- **Combos:** two cards of the same suit in one turn trigger Resonansi; rising costs trigger Rantai Senja; three different suits trigger Pasar Ramai; a suit that beats the opponent's last suit on the Roda Senja (Lampion > Daun > Ombak > Lampion) hits +3.
- **Intent:** the badge above the table tells you what Juragan Bara will do next — attack, shield, or heal — so you can answer it before it happens.

## Files

- `game/` — the playable game (HTML, CSS, and 12 small JS files, one job each)
- `screenshots/` — 4 screenshots of the game itself: table, title, win, loss
- `main.ts` — the make.fun entry program (Node 22): copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
