export function isTimeOver(session) {
  if (!session || !session.started_at) return false;

  const totalTimeMs = Number(session.total_time_ms);
  if (!Number.isFinite(totalTimeMs) || totalTimeMs <= 0) return false;

  const endTime =
    new Date(session.started_at).getTime() + totalTimeMs;

  return Date.now() >= endTime;
}
