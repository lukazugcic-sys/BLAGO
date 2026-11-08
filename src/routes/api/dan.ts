import { createFileRoute } from "@tanstack/react-router";
import { cycleDay, resolveDaily, serverDanKey } from "@/lib/game/daily";

async function POST({ request }: { request: Request }) {
  let body: { streak?: unknown; zadnjaDnevna?: unknown } = {};
  try {
    body = (await request.json()) as { streak?: unknown; zadnjaDnevna?: unknown };
  } catch {
    /* prazno tijelo */
  }
  const now = new Date();
  const dan = serverDanKey(now);
  const streak = Math.max(0, Math.floor(Number(body.streak) || 0));
  const zadnja = typeof body.zadnjaDnevna === "string" ? body.zadnjaDnevna : undefined;
  const resolved = resolveDaily({ streak, zadnjaDnevna: zadnja }, dan);
  return Response.json({
    now: now.toISOString(),
    dan,
    streak: resolved.streak,
    preuzeto: resolved.claimedToday,
    danCiklusa: cycleDay(Math.max(1, resolved.streak)),
  });
}

export const Route = createFileRoute("/api/dan")({
  server: { handlers: { POST } },
});
