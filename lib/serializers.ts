// Central place for turning Prisma rows into the JSON shapes the frontend
// components already expect (see lib/mock-data.ts for the original shapes).
import {
  sportsFromDb,
  VENUE_STATUS_FROM_DB,
  TOURNAMENT_STATUS_FROM_DB,
  LEVEL_FROM_DB,
  NOTIF_TYPE_FROM_DB,
  SPORT_FROM_DB,
} from "@/lib/api-format";

export function serializeVenue(v: any) {
  return {
    id: v.id,
    name: v.name,
    area: v.area,
    address: v.address ?? null,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null,
    description: v.description ?? null,
    contactPhone: v.contactPhone ?? null,
    amenities: v.amenities ?? [],
    sports: sportsFromDb(v.sports),
    pricePerHour: v.pricePerHour,
    rating: v.rating,
    reviews: v.reviews,
    image: v.image,
    // Task 26, Phase 6: extra gallery photos beyond the card thumbnail above.
    images: (v.images ?? []).map((img: any) => ({ id: img.id, image: img.image, caption: img.caption ?? null })),
    // Task 28, Phase 6: shown on the booking modal so players know the policy before requesting.
    cancellationPolicy: v.cancellationPolicy ?? null,
    slotsLeftToday: v.slotsLeftToday,
    status: VENUE_STATUS_FROM_DB[v.status] ?? v.status,
    bookingsToday: v.bookingsToday,
    occupancy: v.occupancy,
    revenueThisMonth: v.revenueThisMonth,
    ownerId: v.ownerId,
  };
}

export function serializeBooking(b: any) {
  return {
    id: b.id,
    venue: b.venue?.name,
    venueId: b.venueId,
    venueArea: b.venue?.area,
    requestedBy: b.user?.name,
    requestedByPhone: b.user?.phone ?? null,
    requestedByEmail: b.user?.email ?? null,
    userId: b.userId,
    sport: SPORT_FROM_DB[b.sport] ?? b.sport,
    slot: b.slot,
    amount: b.amount,
    status: b.status,
    paymentStatus: b.paymentStatus ?? null,
    createdAt: b.createdAt,
    // Task 25/28, Phase 6
    recurrenceGroupId: b.recurrenceGroupId ?? null,
    cancelledAt: b.cancelledAt ?? null,
    cancelledByUserId: b.cancelledByUserId ?? null,
  };
}

export function serializeTournament(t: any) {
  return {
    id: t.id,
    name: t.name,
    sport: SPORT_FROM_DB[t.sport] ?? t.sport,
    format: t.format,
    bracketType: t.bracketType ?? "KNOCKOUT",
    isPublic: t.isPublic ?? true,
    teamsRegistered: t._count?.registrations ?? t.registrations?.length ?? 0,
    teamsCap: t.teamsCap,
    entryFee: t.entryFee,
    startDate: t.startDate,
    status: TOURNAMENT_STATUS_FROM_DB[t.status] ?? t.status,
    organizer: t.organizer?.name ?? t.organizer?.organizationName,
    organizerId: t.organizerId,
    revenueCollected: t.revenueCollected,
    pendingApprovals:
      t.registrations?.filter((r: any) => r.status === "PENDING").length ?? undefined,
  };
}

export function serializeRegistration(r: any) {
  return {
    id: r.id,
    team: r.team?.name,
    teamId: r.teamId,
    tournament: r.tournament?.name,
    tournamentId: r.tournamentId,
    players: r.players,
    status: r.status,
    submittedAt: r.submittedAt,
  };
}

export function serializeTeam(t: any) {
  return {
    id: t.id,
    name: t.name,
    sport: SPORT_FROM_DB[t.sport] ?? t.sport,
    members: t._count?.members ?? t.members?.length ?? 0,
    wins: t.wins,
    losses: t.losses,
    captain: t.captain?.name,
    captainId: t.captainId,
    logoColor: t.logoColor,
    logo: t.logo ?? null,
    coachName: t.coachName ?? null,
    coachContact: t.coachContact ?? null,
  };
}

export function serializePost(p: any, viewerId?: string | null) {
  return {
    id: p.id,
    author: p.author?.name,
    authorId: p.authorId,
    authorAvatar: p.author?.avatar ?? null,
    role: p.author?.role,
    content: p.content,
    sport: p.sport ? SPORT_FROM_DB[p.sport] ?? p.sport : null,
    image: p.image,
    images: (p.images ?? []).map((img: any) => img.image), // Task 36, Phase 6
    tags: p.tags ?? [],
    likes: p.likes,
    comments: p.comments,
    likedByMe: viewerId ? (p.postLikes ?? []).some((l: any) => l.userId === viewerId) : false,
    bookmarkedByMe: viewerId ? (p.bookmarks ?? []).some((b: any) => b.userId === viewerId) : false,
    hidden: p.hidden ?? false, // Task 34, Phase 6
    createdAt: p.createdAt,
  };
}

export function serializeComment(c: any) {
  return {
    id: c.id,
    postId: c.postId,
    authorId: c.authorId,
    author: c.author?.name,
    authorAvatar: c.author?.avatar ?? null,
    content: c.content,
    createdAt: c.createdAt,
  };
}

export function serializePlayerRequest(r: any) {
  return {
    id: r.id,
    title: r.title,
    sport: SPORT_FROM_DB[r.sport] ?? r.sport,
    area: r.area,
    date: r.date,
    playersNeeded: r.playersNeeded,
    level: LEVEL_FROM_DB[r.level] ?? r.level,
    postedBy: r.postedBy?.name,
    postedById: r.postedById,
  };
}

export function serializeTrainer(t: any) {
  return {
    id: t.id,
    name: t.user?.name,
    avatar: t.user?.avatar ?? null,
    userId: t.userId,
    sport: SPORT_FROM_DB[t.sport] ?? t.sport,
    experience: t.experience,
    rating: t.rating,
    reviewCount: t.reviewCount ?? 0,
    students: t.studentCount,
    area: t.area,
    price: t.price,
    tag: t.tag,
    bio: t.bio ?? null,
    specializations: t.specializations ?? [],
    certifications: t.certifications ?? [],
    languages: t.languages ?? [],
    introVideo: t.introVideo ?? null,
    responseTime: t.responseTime ?? null,
    sessionModes: (t.sessionModes ?? ["OFFLINE"]).map((m: string) => m.charAt(0) + m.slice(1).toLowerCase()),
    // Task 5/6, Phase 2: TrainerStatus shares ACTIVE/UNDER_REVIEW values
    // with VenueStatus, so the same display-name map applies.
    status: VENUE_STATUS_FROM_DB[t.status] ?? t.status,
  };
}

export function serializeAcademy(a: any) {
  return {
    id: a.id,
    name: a.name,
    sports: sportsFromDb(a.sports),
    area: a.area,
    batches: a.batches,
    established: a.established,
    rating: a.rating,
    status: VENUE_STATUS_FROM_DB[a.status] ?? a.status,
  };
}

export function serializeBatch(b: any) {
  return {
    id: b.id,
    name: b.name,
    time: b.time,
    days: b.days,
    venue: b.venue,
    students: b._count?.students ?? b.students?.length ?? 0,
  };
}

export function serializeStudent(s: any) {
  return {
    id: s.id,
    name: s.studentName,
    batch: s.batch?.name,
    attendance: s.attendance,
    since: s.since,
  };
}

export function serializeInquiry(i: any) {
  return {
    id: i.id,
    from: i.fromName,
    message: i.message,
    reply: i.reply,
    createdAt: i.createdAt,
  };
}

export function serializeMatch(m: any) {
  return {
    id: m.id,
    sport: SPORT_FROM_DB[m.sport] ?? m.sport,
    status: m.status,
    teamA: m.teamA,
    teamB: m.teamB,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    meta: m.meta,
    venue: m.venue?.name ?? m.venueName,
    venueId: m.venueId ?? null,
    tournamentId: m.tournamentId ?? null,
    startedById: m.startedById ?? null,
  };
}

export function serializeTeamDetail(t: any) {
  return {
    id: t.id,
    name: t.name,
    sport: SPORT_FROM_DB[t.sport] ?? t.sport,
    wins: t.wins,
    losses: t.losses,
    captainId: t.captainId,
    logoColor: t.logoColor,
    logo: t.logo ?? null,
    coachName: t.coachName ?? null,
    coachContact: t.coachContact ?? null,
    members: (t.members ?? []).map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.user?.name,
      email: m.user?.email,
      roleName: m.roleName,
    })),
  };
}

export function serializeChatMessage(m: any) {
  return {
    id: m.id,
    teamId: m.teamId,
    senderId: m.senderId,
    senderName: m.sender?.name,
    content: m.content,
    attachmentUrl: m.attachmentUrl ?? null,
    createdAt: m.createdAt,
  };
}

export function serializeJoinRequest(j: any) {
  return {
    id: j.id,
    requestId: j.requestId,
    requesterId: j.requesterId,
    requesterName: j.requester?.name,
    message: j.message,
    status: j.status,
    createdAt: j.createdAt,
  };
}

export function serializeNotification(n: any) {
  return {
    id: n.id,
    title: n.title,
    detail: n.detail,
    type: NOTIF_TYPE_FROM_DB[n.type] ?? n.type,
    read: n.read,
    time: n.createdAt,
    groupCount: n.groupCount ?? 1, // Task 17, Phase 4 — see lib/notify.ts
  };
}

// Task 21, Phase 5: direct messages
export function serializeMessage(m: any) {
  return {
    id: m.id,
    fromId: m.fromId,
    fromName: m.from?.name,
    toId: m.toId,
    toName: m.to?.name,
    content: m.content,
    read: m.read,
    createdAt: m.createdAt,
  };
}
