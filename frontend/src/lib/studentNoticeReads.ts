const storageKey = (userId: string) => `notice-portal-read:${userId}`;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function getReadNoticeIds(userId: string): string[] {
  if (!userId) {
    return [];
  }

  try {
    return asStringArray(JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]"));
  } catch {
    return [];
  }
}

export function isNoticeRead(userId: string, noticeId: string): boolean {
  return getReadNoticeIds(userId).includes(noticeId);
}

export function rememberNoticeRead(userId: string, noticeId: string): void {
  if (!userId || !noticeId) {
    return;
  }

  const ids = new Set(getReadNoticeIds(userId));
  ids.add(noticeId);
  localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
}
