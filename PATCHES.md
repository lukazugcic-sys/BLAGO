# BLAGO local patches (0.9.44-beta) — top 5 from acceptance review

1. **First-minute clarity** — Energija X/Y, multiplier cost/payout, resource micro-labels, refill ETA (`SlotScreen`, `Header`, `OnboardModal`)
2. **Sljedeći cilj card** — one next goal on Automat with cost / nedostaje / reward (`sljedeciCilj.ts`, `SljedeciCiljCard.tsx`)
3. **Low-energy flow** — Smanji ×N, jutro energy claim, clearer KUPI (`SlotScreen`)
4. **Dođi sutra** — tomorrow CTA + midnight countdown after jutro (`daily.ts`, `JutroSheet`, `DailyRewardModal`, `gameStore`)
5. **Soft-gate side systems** until Kuća LVL ≥ 1 (`sideGate.ts`, `SideGateKartica.tsx`, nav/shop/missions/social/salun)

Not deployed to blago.grok.me — local `/workspace/BLAGO` only until pushed to Izgradi/GitHub.

## GUI polish + optimize (local follow-up)

6. **Resource labels on tap** — Header chips show icon+amount; name reveals ~1.8s on press (`Header.tsx`, `.chip-ime`)
7. **Nicer spin** — smoother reel-cycle blur/momentum, staggered `--reel-spd`, better land-thump (`styles.css`, `SlotReel.tsx`)
8. **Hot-path trim** — ETA interval only when low energy + second-granularity setState; memo SlotReel/Chip; narrow win gold selector (`SlotScreen.tsx`, `SlotReel.tsx`, `Header.tsx`)

## GUI polish pass 2 (Automata HUD)

9. **Automata hierarchy** — Compact weekly/jutro/event cluster (`slot-hud-vrh`); spin + Sljedeći cilj + energy stay primary (`SlotScreen`, `TjedanTraka`, `JutroSheet`, `EventBanner`)
10. **SljedećiCiljCard** — Progress bar, display type, clearer CTA + chevron, tighter cost chips (`SljedeciCiljCard.tsx`)
11. **Energy HUD** — Meter bar + integrated low-energy CTA strip (Smanji / jutro) (`SlotScreen`)
12. **Soft lock** — Dim + gold lock badge on nav/tabs; softer SideGateKartica (`AppNav`, `ScreenTabs`, `SideGateKartica`)
13. **Pager** — Slightly snappier tab slide (`styles.css` `.pager-track`)
