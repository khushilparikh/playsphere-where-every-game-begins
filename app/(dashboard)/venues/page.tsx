"use client";

import { useMemo, useState } from "react";
import { Star, MapPin, Search, PlusCircle, Check, X, Phone, Mail } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useApiGet } from "@/lib/use-api";
import { apiPost, apiPatch } from "@/lib/api-client";
import { sports, areas, type Sport } from "@/lib/mock-data";
import { DemoPaymentModal } from "@/components/payments/DemoPaymentModal";
const AMENITY_OPTIONS = ["Parking", "Washrooms", "Floodlights", "Drinking Water", "Changing Rooms", "First Aid", "Seating", "Cafeteria", "Equipment Rental"];

const emptyForm = { name: "", area: "Satellite", address: "", description: "", contactPhone: "", sport: sports[0] as Sport, pricePerHour: 800, amenities: [] as string[] };

function MapEmbed({ address, name }: { address?: string | null; name: string }) {
  if (!address) return null;
  const query = encodeURIComponent(`${name}, ${address}`);
  return (
    <iframe
      title={`Map for ${name}`}
      className="h-48 w-full rounded-xl border border-court-line"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps?q=${query}&output=embed`}
    />
  );
}

// Task 54, Phase 6: weekly bookings/revenue trend, computed from real
// Booking rows (see GET /api/venues/:id/analytics) rather than the
// point-in-time counters already shown in the stats grid above.
function VenueTrendChart({ venueId }: { venueId: string }) {
  const { data } = useApiGet<{ series: any[]; totalBookings: number; confirmationRate: number }>(`/api/venues/${venueId}/analytics`);
  const series = data?.series ?? [];
  const maxBookings = Math.max(1, ...series.map((s: any) => s.bookings));

  if (series.length === 0) return <p className="mt-3 text-xs text-ink-faint">No bookings in the last 12 weeks yet.</p>;

  return (
    <div className="mt-3">
      <div className="flex items-end gap-1.5" style={{ height: 64 }}>
        {series.map((s: any) => (
          <div key={s.week} className="group relative flex-1">
            <div
              className="rounded-t bg-volt/70 transition-colors group-hover:bg-volt"
              style={{ height: `${Math.max(4, (s.bookings / maxBookings) * 64)}px` }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] text-court group-hover:block">
              {s.week}: {s.bookings} booking(s) · ₹{s.confirmedRevenue}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-faint">{data?.totalBookings} bookings over 12 weeks · {data?.confirmationRate}% confirmed</p>
    </div>
  );
}

function VenueAnalyticsToggle({ venueId }: { venueId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-court-line pt-3">
      <button onClick={() => setOpen((o) => !o)} className="focus-ring text-xs font-medium text-volt hover:underline">
        {open ? "Hide" : "Show"} 12-week trend
      </button>
      {open && <VenueTrendChart venueId={venueId} />}
    </div>
  );
}

function ManageVenuesView() {
  const { data, loading, refresh } = useApiGet<{ venues: any[] }>("/api/venues?mine=true");
  const { data: reqData, refresh: refreshReqs } = useApiGet<{ bookings: any[] }>("/api/bookings?forOwner=true");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const venues = data?.venues ?? [];
  const bookingRequests = reqData?.bookings ?? [];

  async function createVenue() {
    if (!form.name || !form.address) return alert("Venue name and full address are required so players can find it.");
    try {
      await apiPost("/api/venues", {
        name: form.name,
        area: form.area,
        address: form.address,
        description: form.description || undefined,
        contactPhone: form.contactPhone || undefined,
        sports: [form.sport],
        pricePerHour: form.pricePerHour,
        amenities: form.amenities,
      });
      setShowForm(false);
      setForm(emptyForm);
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function decide(id: string, status: "CONFIRMED" | "DECLINED") {
    try {
      await apiPatch(`/api/bookings/${id}`, { status });
      refreshReqs();
      refresh();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-md text-sm text-ink-muted">
          Manage your listed venues, track bookings and approve incoming
          requests from players and organizers.
        </p>
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusCircle size={16} /> List a new venue
        </Button>
      </div>

      {showForm && (
        <Card className="mt-6 p-6">
          <h3 className="font-display text-lg tracking-wide">NEW VENUE</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <input
              placeholder="Venue name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm sm:col-span-2"
            />
            <input
              placeholder="Full address (so it shows correctly on the map)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm sm:col-span-2"
            />
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted"
            >
              {areas.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select
              value={form.sport}
              onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted"
            >
              {sports.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              type="number"
              placeholder="Hourly Rate (₹/hr) (Players charged by total hours)"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm"
            />
            <input
              placeholder="Contact phone"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm"
            />
            <textarea
              placeholder="Description — surface, lighting, parking, amenities…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm sm:col-span-2"
            />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs text-ink-faint">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] })}
                  className={`focus-ring rounded-full border px-3 py-1 text-xs font-medium ${form.amenities.includes(a) ? "border-volt bg-volt/10 text-volt" : "border-court-line text-ink-muted"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Button className="mt-5" onClick={createVenue}>Submit for review</Button>
        </Card>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading && <p className="text-sm text-ink-faint">Loading venues…</p>}
          {!loading && venues.length === 0 && <p className="text-sm text-ink-faint">You haven&apos;t listed any venues yet.</p>}
          {venues.map((v) => (
            <Card key={v.id} hover glow className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base tracking-wide">{v.name.toUpperCase()}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
                    <MapPin size={12} /> {v.address || v.area}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {v.sports.map((s: string) => <Badge key={s} tone="muted">{s}</Badge>)}
                    <Badge tone={v.status === "Active" ? "volt" : "whistle"}>{v.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-court px-2 py-2.5">
                  <p className="font-display text-lg text-volt">{v.bookingsToday}</p>
                  <p className="text-[9px] uppercase tracking-widest text-ink-faint">Today</p>
                </div>
                <div className="rounded-lg bg-court px-2 py-2.5">
                  <p className="font-display text-lg text-whistle">{v.occupancy}%</p>
                  <p className="text-[9px] uppercase tracking-widest text-ink-faint">Occupancy</p>
                </div>
                <div className="rounded-lg bg-court px-2 py-2.5">
                  <p className="font-display text-lg text-ink">₹{(v.revenueThisMonth / 1000).toFixed(0)}k</p>
                  <p className="text-[9px] uppercase tracking-widest text-ink-faint">Revenue</p>
                </div>
                <div className="rounded-lg bg-court px-2 py-2.5">
                  <p className="flex items-center justify-center gap-0.5 font-display text-lg text-ink">
                    {v.rating > 0 ? <><Star size={13} fill="currentColor" className="text-volt" />{v.rating}</> : "—"}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-ink-faint">Rating</p>
                </div>
              </div>

              <VenueAnalyticsToggle venueId={v.id} />

              {v.address && (
                <div className="mt-4">
                  <MapEmbed address={v.address} name={v.name} />
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card className="h-fit p-6">
          <h3 className="mb-4 font-display text-lg tracking-wide">BOOKING REQUESTS</h3>
          <div className="space-y-3">
            {bookingRequests.length === 0 && <p className="text-sm text-ink-faint">No pending requests.</p>}
            {bookingRequests.map((b: any) => (
              <div key={b.id} className="rounded-xl border border-court-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{b.requestedBy}</p>
                  <Badge tone="volt">{b.sport}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{b.venue}</p>
                <p className="text-xs font-medium text-ink">{b.slot}</p>
                {(b.requestedByPhone || b.requestedByEmail) && (
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-faint">
                    {b.requestedByPhone && <span className="flex items-center gap-1"><Phone size={10} /> {b.requestedByPhone}</span>}
                    {b.requestedByEmail && <span className="flex items-center gap-1"><Mail size={10} /> {b.requestedByEmail}</span>}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-volt">₹{b.amount}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => decide(b.id, "CONFIRMED")} className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-volt/10 text-volt hover:bg-volt/20">
                      <Check size={13} />
                    </button>
                    <button onClick={() => decide(b.id, "DECLINED")} className="focus-ring flex h-6 w-6 items-center justify-center rounded-md bg-whistle/10 text-whistle hover:bg-whistle/20">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function VenueReviews({ venueId }: { venueId: string }) {
  const { data, refresh } = useApiGet<{ reviews: any[] }>(`/api/venues/${venueId}/reviews`);
  const reviews = data?.reviews ?? [];
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await apiPost(`/api/venues/${venueId}/reviews`, { rating, comment: comment.trim() || undefined });
      setComment("");
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">Reviews ({reviews.length})</p>
      <div className="mb-3 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className="focus-ring">
            <Star size={18} className={n <= rating ? "text-volt" : "text-ink-faint"} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          className="focus-ring flex-1 rounded-lg border border-court-line bg-court px-3 py-1.5 text-xs"
        />
        <Button size="sm" onClick={submit} disabled={submitting}>Rate</Button>
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {reviews.map((r: any) => (
          <div key={r.id} className="rounded-lg bg-court px-3 py-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.userName}</span>
              <span className="flex items-center gap-0.5 text-volt"><Star size={11} fill="currentColor" /> {r.rating}</span>
            </div>
            {r.comment && <p className="mt-0.5 text-ink-muted">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookVenueModal({ open, onClose, venue, onBooked }: { open: boolean; onClose: () => void; venue: any; onBooked: () => void }) {
  const [sport, setSport] = useState(venue?.sports?.[0] ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  
  // Payment Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSession, setPaymentSession] = useState<any>(null);

  useMemo(() => {
    if (venue) setSport(venue.sports?.[0] ?? "");
  }, [venue]);

  const datePrefix = date ? `${new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}, ` : "";
  const { data: availability } = useApiGet<{ bookedTimes: string[], slotStates: { time: string, status: string }[] }>(
    open && venue && datePrefix ? `/api/venues/${venue.id}/availability?datePrefix=${encodeURIComponent(datePrefix)}` : null,
    [open, venue?.id, datePrefix]
  );
  const bookedTimes = availability?.bookedTimes ?? [];
  const slotStates = availability?.slotStates ?? [];
  
  // Calculate slot string for checking conflicts client-side
  const slotStr = endTime ? `${time}-${endTime}` : time;
  
  // Basic client-side check if exactly matching string
  const timeConflict = slotStr && bookedTimes.some(b => b.includes(time) || (endTime && b.includes(endTime)));

  // Calculate dynamic price
  let durationInHours = 1;
  if (time && endTime) {
    const [h1, m1] = time.split(":").map(Number);
    const [h2, m2] = endTime.split(":").map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) diff += 24 * 60;
    durationInHours = diff / 60;
  }
  const totalAmount = Math.round(durationInHours * (venue?.pricePerHour || 0));

  async function submit() {
    if (!date || !time) return alert("Pick a date and start time.");
    if (timeConflict) return alert("That time is already booked or overlaps — please choose another.");
    setSubmitting(true);
    try {
      // 1. Create Pending Booking
      const res = await apiPost<{ recurrence?: { created: number; skipped: string[] }, booking?: any }>("/api/bookings", {
        venueId: venue.id,
        slot: `${datePrefix}${slotStr}`,
        sport,
        amount: totalAmount,
        date: repeatWeekly ? date : undefined,
        time: repeatWeekly ? time : undefined,
        recurrenceWeeks: repeatWeekly ? recurrenceWeeks : undefined,
      });

      if (res.recurrence && res.recurrence.skipped.length > 0) {
        alert(`Booked ${res.recurrence.created} of ${recurrenceWeeks} weeks. Already taken: ${res.recurrence.skipped.join(", ")}`);
      }

      // 2. Initiate Payment Session
      // Note: for weekly repeat, we will just charge for the first booking for demo purposes, 
      // or if booking object is returned. In actual implementation, recurring charges would be a subscription.
      const bookingId = res.booking?.id || (Array.isArray(res) && res[0]?.id) || (res as any).id;
      
      if (bookingId) {
        const payRes = await fetch("/api/payments/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: "BOOKING",
            targetId: bookingId,
            amount: totalAmount,
            method: "CARD"
          })
        });
        
        const payData = await payRes.json();
        if (payData.success) {
          setPaymentSession(payData);
          setShowPayment(true);
          return; // Wait for modal
        }
      }

      // Fallback if no payment session generated
      onClose();
      onBooked();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="BOOK VENUE" subtitle={venue?.name}>
        {venue?.address && <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-faint"><MapPin size={12} /> {venue.address}</p>}
        <div className="grid gap-3">
          <select value={sport} onChange={(e) => setSport(e.target.value)} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted">
            {(venue?.sports ?? []).map((s: string) => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-ink-faint">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`focus-ring w-full rounded-xl border bg-court px-4 py-2.5 text-sm ${timeConflict ? "border-whistle" : "border-court-line"}`}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-ink-faint">End Time (Optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`focus-ring w-full rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm`}
              />
            </div>
          </div>
        </div>
        {date && slotStates.length > 0 && (
          <div className="mt-2 text-xs">
            <p className="text-ink-faint mb-1">Already reserved times on this date:</p>
            <div className="flex flex-wrap gap-1.5">
              {slotStates.map((s, i) => (
                <Badge key={i} tone={s.status === "HELD_IN_PAYMENT" ? "whistle" : "muted"}>
                  {s.time} {s.status === "HELD_IN_PAYMENT" ? "(Temporarily Held)" : "(Booked)"}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {timeConflict && <p className="mt-1 text-xs text-whistle">That time slot overlaps with an existing booking — pick a different time.</p>}

        <label className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
          <input type="checkbox" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} className="focus-ring h-3.5 w-3.5 rounded border-court-line" />
          Repeat weekly
        </label>
        {repeatWeekly && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-ink-faint">for</span>
            <select value={recurrenceWeeks} onChange={(e) => setRecurrenceWeeks(Number(e.target.value))} className="focus-ring rounded-lg border border-court-line bg-court px-2 py-1.5">
              {[2, 4, 8, 12].map((n) => <option key={n} value={n}>{n} weeks</option>)}
            </select>
          </div>
        )}

        <p className="mt-3 text-xs text-ink-faint">₹{venue?.pricePerHour}/hr · {durationInHours} hr(s) = ₹{totalAmount}</p>
        {venue?.cancellationPolicy && <p className="mt-1 text-xs text-ink-faint">Cancellation policy: {venue.cancellationPolicy}</p>}
        <Button className="mt-4 w-full" onClick={submit} disabled={submitting || !!timeConflict}>
          {submitting ? "Processing…" : `Pay ₹${totalAmount} & Book`}
        </Button>
      </Modal>

      {showPayment && paymentSession && (
        <DemoPaymentModal 
          isOpen={showPayment} 
          onClose={() => {
            setShowPayment(false);
            onClose();
          }}
          onSuccess={(txId) => {
            setShowPayment(false);
            onClose();
            onBooked();
          }}
          sessionToken={paymentSession.sessionToken}
          idempotencyKey={paymentSession.idempotencyKey}
          expiresAt={paymentSession.expiresAt}
          amount={totalAmount}
          upiLink={paymentSession.upiLink}
        />
      )}
    </>
  );
}

// Task 28, Phase 6: lets the booker see and cancel their own bookings —
// previously only the venue owner could act on a Booking at all.
function MyBookingsPanel() {
  const { data, refresh } = useApiGet<{ bookings: any[] }>("/api/bookings");
  const bookings = (data?.bookings ?? []).filter((b: any) => b.status === "PENDING" || b.status === "CONFIRMED");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function cancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setBusyId(id);
    try {
      await apiPatch(`/api/bookings/${id}`, { status: "CANCELLED" });
      refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (bookings.length === 0) return null;

  return (
    <Card className="mb-4 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-faint">My upcoming bookings</h3>
      <div className="space-y-2">
        {bookings.map((b: any) => (
          <div key={b.id} className="flex items-center justify-between rounded-lg border border-court-line px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{b.venue}</p>
              <p className="text-xs text-ink-faint">{b.slot} · <Badge tone={b.status === "CONFIRMED" ? "volt" : "muted"}>{b.status}</Badge></p>
            </div>
            <button
              onClick={() => cancel(b.id)}
              disabled={busyId === b.id}
              className="focus-ring rounded-lg bg-whistle/10 px-2.5 py-1 text-xs font-medium text-whistle hover:bg-whistle/20"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BrowseVenuesView() {
  const [sport, setSport] = useState<Sport | "All">("All");
  const [area, setArea] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [bookingTarget, setBookingTarget] = useState<any | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<any | null>(null);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (sport !== "All") p.set("sport", sport);
    if (area !== "All") p.set("area", area);
    if (query) p.set("q", query);
    return p.toString();
  }, [sport, area, query]);

  const { data, loading, refresh } = useApiGet<{ venues: any[] }>(`/api/venues?${qs}`, [qs]);
  const venues = data?.venues ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <MyBookingsPanel />
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search venues by name..."
            className="focus-ring w-full rounded-xl border border-court-line bg-court px-10 py-2.5 text-sm placeholder:text-ink-faint focus:border-volt/50"
          />
        </div>
        <select value={sport} onChange={(e) => setSport(e.target.value as Sport | "All")} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted focus:border-volt/50">
          <option value="All">All sports</option>
          {sports.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="focus-ring rounded-xl border border-court-line bg-court px-4 py-2.5 text-sm text-ink-muted focus:border-volt/50">
          <option value="All">All areas</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Card>

      <p className="mt-4 text-xs text-ink-faint">{loading ? "Loading…" : `${venues.length} venues found`}</p>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <Card key={v.id} hover glow className="group overflow-hidden p-0">
            <button className="block h-40 w-full overflow-hidden" onClick={() => setDetailsTarget(v)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.image || "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop"} alt={v.name} className="h-full w-full object-cover transition-transform duration-500 ease-spring group-hover:scale-110" />
            </button>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base tracking-wide">{v.name.toUpperCase()}</h3>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-volt">
                  <Star size={13} fill="currentColor" /> {v.rating}
                </span>
              </div>
              <button onClick={() => setDetailsTarget(v)} className="focus-ring mt-1 flex items-center gap-1.5 text-left text-xs text-ink-faint hover:text-volt">
                <MapPin size={12} /> {v.address ? `${v.address}` : v.area} · {v.reviews} reviews
              </button>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {v.sports.map((s: string) => <Badge key={s} tone="muted">{s}</Badge>)}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-court-line pt-4">
                <div>
                  <p className="font-display text-lg tracking-wide text-ink">₹{v.pricePerHour}<span className="text-xs font-body font-normal text-ink-faint">/hr</span></p>
                  <p className="text-xs text-volt">{v.slotsLeftToday} slots left today</p>
                </div>
                <Button size="sm" onClick={() => setBookingTarget(v)}>Book now</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!detailsTarget} onClose={() => setDetailsTarget(null)} title={detailsTarget?.name ?? ""} subtitle={detailsTarget?.address ?? detailsTarget?.area} width="lg">
        {detailsTarget && (
          <div className="space-y-4">
            <MapEmbed address={detailsTarget.address} name={detailsTarget.name} />
            {detailsTarget.description && <p className="text-sm text-ink-muted">{detailsTarget.description}</p>}
            {detailsTarget.contactPhone && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted"><Phone size={14} className="text-ink-faint" /> {detailsTarget.contactPhone}</p>
            )}
            {!!detailsTarget.amenities?.length && (
              <div className="flex flex-wrap gap-1.5">
                {detailsTarget.amenities.map((a: string) => <Badge key={a} tone="muted">{a}</Badge>)}
              </div>
            )}
            <VenueReviews venueId={detailsTarget.id} />
            <Button className="w-full" onClick={() => { setBookingTarget(detailsTarget); setDetailsTarget(null); }}>Book now</Button>
          </div>
        )}
      </Modal>

      <BookVenueModal
        open={!!bookingTarget}
        onClose={() => setBookingTarget(null)}
        venue={bookingTarget}
        onBooked={() => {
          alert("Booking request sent! The venue owner will confirm it.");
          refresh();
        }}
      />
    </div>
  );
}

export default function VenuesPage() {
  const { role } = useAuth();

  return (
    <div className="pb-16">
      <Topbar title={role === "venue" ? "My Venues" : "Venue Booking"} />
      {role === "venue" ? <ManageVenuesView /> : <BrowseVenuesView />}
    </div>
  );
}
