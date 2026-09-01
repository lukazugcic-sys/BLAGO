export type CloudPayload = Record<string, unknown>;

export async function loadCloudSave() {
  return null;
}

export async function pushCloudSave(_args?: unknown) {
  return;
}

export async function listLeaderboard() {
  return [] as Array<{
    uid: string;
    ime: string;
    razina: number;
    zlato: number;
    vrtnje: number;
  }>;
}

export async function listRaidTargets() {
  return [] as Array<{ uid: string; ime: string; razina: number }>;
}

export async function attackPlayer(_args?: unknown) {
  return { ok: false as const, razlog: "offline" };
}

export async function createClan(_args?: unknown) {
  throw new Error("offline");
}

export async function joinClan(_args?: unknown) {
  throw new Error("offline");
}

export async function donateClan(_args?: unknown) {
  throw new Error("offline");
}
