// Shared entry point for creating a Notification row. Every route that
// used to call `prisma.notification.create(...)` directly should call
// `notifyUser(...)` instead, so all three of the following stay correct
// in exactly one place rather than needing to be reimplemented at each
// of the dozen-plus call sites:
//
//  - Task 16 (preference enforcement): skips creating the row entirely
//    if the recipient has turned off that notification type.
//  - Task 14 (real-time delivery): pushes the new notification over the
//    existing Socket.IO connection (see lib/socket-emit.ts / server.js)
//    to that user's private room, so the sidebar bell updates instantly
//    instead of waiting for the next poll/refresh.
//  - Task 17 (grouping): if an unread notification with the same
//    groupKey already exists for this user, bumps its detail/count and
//    timestamp instead of inserting a new row — e.g. "3 people liked
//    your post" instead of 3 separate rows.
import { prisma } from "@/lib/prisma";
import { emitToUser } from "@/lib/socket-emit";

type NotificationType = "BOOKING" | "TOURNAMENT" | "COMMUNITY" | "SYSTEM";

// SYSTEM notifications (account/security-relevant) are never optional —
// there's deliberately no toggle for them. The other three map 1:1 onto
// the preference fields already on User.
const PREFERENCE_FIELD: Partial<Record<NotificationType, "notifyBooking" | "notifyTournament" | "notifyCommunity">> = {
  BOOKING: "notifyBooking",
  TOURNAMENT: "notifyTournament",
  COMMUNITY: "notifyCommunity",
};

export async function notifyUser(params: {
  userId: string;
  title: string;
  detail: string;
  type: NotificationType;
  /**
   * When provided, a second notification with the same (userId, groupKey)
   * that's still unread gets updated in place instead of duplicated.
   * Use a stable key per "thing being grouped", e.g. `likes:${postId}`.
   */
  groupKey?: string;
}) {
  const { userId, title, detail, type, groupKey } = params;

  const prefField = PREFERENCE_FIELD[type];
  if (prefField) {
    const recipient = await prisma.user.findUnique({ where: { id: userId }, select: { [prefField]: true } as any });
    if (recipient && (recipient as any)[prefField] === false) {
      return null; // recipient opted out of this notification type
    }
  }

  let notification;
  if (groupKey) {
    const existing = await prisma.notification.findFirst({
      where: { userId, groupKey, read: false },
    });
    if (existing) {
      const nextCount = existing.groupCount + 1;
      // A simple, robust suffix works for any title without needing to
      // know its grammar (unlike rewriting "New comment" ->
      // "3 new comments", which would only work for that exact phrasing).
      const baseTitle = existing.title.replace(/ \(×\d+\)$/, "");
      notification = await prisma.notification.update({
        where: { id: existing.id },
        data: {
          title: nextCount > 1 ? `${baseTitle} (×${nextCount})` : baseTitle,
          detail,
          groupCount: nextCount,
          createdAt: new Date(), // bump to top of the list
        },
      });
    }
  }

  if (!notification) {
    notification = await prisma.notification.create({
      data: { userId, title, detail, type, groupKey },
    });
  }

  emitToUser(userId, "notification:new", notification);
  return notification;
}
