import { describe, it, expect } from "vitest";
import {
  serializeVenue,
  serializeBooking,
  serializeTournament,
  serializeRegistration,
  serializeTeam,
  serializeNotification,
  serializeMessage,
} from "@/lib/serializers";

describe("lib/serializers", () => {
  it("serializeVenue transforms venue database records accurately with fallbacks", () => {
    const dbVenue = {
      id: "v1",
      name: "Downtown Arena",
      area: "Downtown",
      address: null,
      sports: ["FOOTBALL", "BASKETBALL"],
      pricePerHour: 1000,
      rating: 4.8,
      reviews: 24,
      image: "/v1.jpg",
      status: "APPROVED",
      bookingsToday: 5,
      occupancy: 80,
      revenueThisMonth: 15000,
      ownerId: "o1",
    };

    const serialized = serializeVenue(dbVenue);

    expect(serialized.id).toBe("v1");
    expect(serialized.name).toBe("Downtown Arena");
    expect(serialized.sports).toEqual(["Football", "Basketball"]);
    expect(serialized.status).toBe("APPROVED");
    expect(serialized.address).toBeNull();
    expect(serialized.images).toEqual([]);
    expect(serialized.cancellationPolicy).toBeNull();
  });

  it("serializeBooking transforms booking database records cleanly", () => {
    const dbBooking = {
      id: "b1",
      venueId: "v1",
      userId: "u1",
      sport: "FOOTBALL",
      slot: "Mon, 5 Jan, 10:00",
      amount: 1000,
      status: "CONFIRMED",
      createdAt: new Date("2026-01-01"),
      venue: { name: "Downtown Arena", area: "Downtown" },
      user: { name: "John Doe", email: "john@example.com", phone: "+1234567890" },
    };

    const serialized = serializeBooking(dbBooking);

    expect(serialized.id).toBe("b1");
    expect(serialized.venue).toBe("Downtown Arena");
    expect(serialized.requestedBy).toBe("John Doe");
    expect(serialized.sport).toBe("Football");
    expect(serialized.status).toBe("CONFIRMED");
    expect(serialized.recurrenceGroupId).toBeNull();
  });

  it("serializeTournament computes teams registered count correctly", () => {
    const dbTournament = {
      id: "t1",
      name: "Championship 2026",
      sport: "BADMINTON",
      format: "Knockout",
      teamsCap: 16,
      entryFee: 500,
      startDate: new Date("2026-02-01"),
      status: "REGISTRATION_OPEN",
      organizerId: "org1",
      organizer: { name: "Sports League Inc" },
      revenueCollected: 8000,
      registrations: [{ id: "r1", status: "APPROVED" }, { id: "r2", status: "PENDING" }],
    };

    const serialized = serializeTournament(dbTournament);

    expect(serialized.id).toBe("t1");
    expect(serialized.sport).toBe("Badminton");
    expect(serialized.teamsRegistered).toBe(2);
    expect(serialized.pendingApprovals).toBe(1);
  });

  it("serializeNotification maps database type enum to display format", () => {
    const dbNotif = {
      id: "n1",
      title: "Booking Request",
      detail: "Slot booked for Football",
      type: "BOOKING",
      read: false,
      createdAt: new Date("2026-01-01"),
    };

    const serialized = serializeNotification(dbNotif);

    expect(serialized.id).toBe("n1");
    expect(serialized.type).toBe("booking");
    expect(serialized.groupCount).toBe(1);
  });

  it("serializeMessage formats direct chat messages correctly", () => {
    const dbMsg = {
      id: "m1",
      fromId: "u1",
      toId: "u2",
      content: "Hello there!",
      read: true,
      createdAt: new Date("2026-01-01"),
      from: { name: "Alice" },
      to: { name: "Bob" },
    };

    const serialized = serializeMessage(dbMsg);

    expect(serialized.id).toBe("m1");
    expect(serialized.fromName).toBe("Alice");
    expect(serialized.toName).toBe("Bob");
    expect(serialized.content).toBe("Hello there!");
    expect(serialized.read).toBe(true);
  });
});
