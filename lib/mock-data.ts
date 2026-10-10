// Central mock data source. In production this would be replaced by
// API calls to the Next.js API routes / Prisma layer described in the
// project proposal (Chapter 8 — Technology Stack).

export type Sport =
  | "Cricket"
  | "Football"
  | "Badminton"
  | "Basketball"
  | "Tennis"
  | "Table Tennis"
  | "Volleyball";

export const sports: Sport[] = [
  "Cricket",
  "Football",
  "Badminton",
  "Basketball",
  "Tennis",
  "Table Tennis",
  "Volleyball",
];

export const areas = [
  "Satellite",
  "Bopal",
  "Vastrapur",
  "SG Highway",
  "Maninagar",
  "Naranpura",
  "Prahladnagar",
  "Chandkheda",
];

export interface LiveMatch {
  id: string;
  sport: Sport;
  status: "LIVE" | "UPCOMING" | "FT";
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  meta: string; // e.g. "Over 14.2" or "72'"
  venue: string;
}

export const liveMatches: LiveMatch[] = [
  { id: "m1", sport: "Cricket", status: "LIVE", teamA: "Satellite Strikers", teamB: "Bopal Blazers", scoreA: "142/4", scoreB: "—", meta: "Ov 14.2", venue: "Karnavati Ground" },
  { id: "m2", sport: "Football", status: "LIVE", teamA: "SG United", teamB: "Vastrapur FC", scoreA: "2", scoreB: "1", meta: "72'", venue: "Sabarmati Turf" },
  { id: "m3", sport: "Badminton", status: "UPCOMING", teamA: "R. Mehta", teamB: "K. Shah", scoreA: "-", scoreB: "-", meta: "6:30 PM", venue: "Prahladnagar Courts" },
  { id: "m4", sport: "Basketball", status: "FT", teamA: "Naranpura Ballers", teamB: "Chandkheda Kings", scoreA: "58", scoreB: "61", meta: "Final", venue: "Chandkheda Arena" },
  { id: "m5", sport: "Cricket", status: "UPCOMING", teamA: "Maninagar Mavericks", teamB: "Thaltej Titans", scoreA: "-", scoreB: "-", meta: "Sun, 9:00 AM", venue: "Thaltej Box Cricket" },
  { id: "m6", sport: "Volleyball", status: "LIVE", teamA: "Bodakdev Smashers", teamB: "Isanpur Spikers", scoreA: "2", scoreB: "1", meta: "Set 4", venue: "Isanpur Indoor Hall" },
];

export interface Venue {
  id: string;
  name: string;
  area: string;
  sports: Sport[];
  pricePerHour: number;
  rating: number;
  reviews: number;
  image: string;
  slotsLeftToday: number;
}

export const venues: Venue[] = [
  { id: "v1", name: "Karnavati Sports Arena", area: "Satellite", sports: ["Cricket", "Football"], pricePerHour: 1200, rating: 4.7, reviews: 214, image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 3 },
  { id: "v2", name: "Prahladnagar Smash Courts", area: "Prahladnagar", sports: ["Badminton", "Table Tennis"], pricePerHour: 500, rating: 4.5, reviews: 132, image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 6 },
  { id: "v3", name: "SG Highway Turf Club", area: "SG Highway", sports: ["Football"], pricePerHour: 1500, rating: 4.8, reviews: 301, image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 2 },
  { id: "v4", name: "Chandkheda Hoops Arena", area: "Chandkheda", sports: ["Basketball"], pricePerHour: 900, rating: 4.4, reviews: 88, image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 5 },
  { id: "v5", name: "Vastrapur Ace Club", area: "Vastrapur", sports: ["Tennis"], pricePerHour: 800, rating: 4.6, reviews: 97, image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 4 },
  { id: "v6", name: "Bopal Box Cricket", area: "Bopal", sports: ["Cricket"], pricePerHour: 1100, rating: 4.3, reviews: 156, image: "https://images.unsplash.com/photo-1531159954418-fe8fefe7213e?q=80&w=800&auto=format&fit=crop", slotsLeftToday: 1 },
];

export interface Tournament {
  id: string;
  name: string;
  sport: Sport;
  format: string;
  teamsRegistered: number;
  teamsCap: number;
  entryFee: number;
  startDate: string;
  status: "Registration Open" | "In Progress" | "Completed";
  organizer: string;
}

export const tournaments: Tournament[] = [
  { id: "t1", name: "Ahmedabad Premier Box Cricket League", sport: "Cricket", format: "Knockout", teamsRegistered: 14, teamsCap: 16, entryFee: 3500, startDate: "2026-07-18", status: "Registration Open", organizer: "Satellite Sports Club" },
  { id: "t2", name: "SG Turf Football Cup", sport: "Football", format: "League + Playoffs", teamsRegistered: 10, teamsCap: 12, entryFee: 5000, startDate: "2026-07-25", status: "Registration Open", organizer: "SG United FC" },
  { id: "t3", name: "Prahladnagar Open Badminton Championship", sport: "Badminton", format: "Singles Knockout", teamsRegistered: 48, teamsCap: 64, entryFee: 400, startDate: "2026-07-10", status: "In Progress", organizer: "Smash Courts Academy" },
  { id: "t4", name: "Chandkheda 3x3 Basketball Slam", sport: "Basketball", format: "3x3 Knockout", teamsRegistered: 16, teamsCap: 16, entryFee: 1500, startDate: "2026-06-20", status: "Completed", organizer: "Hoops Arena" },
  { id: "t5", name: "Bodakdev Volleyball Invitational", sport: "Volleyball", format: "Round Robin", teamsRegistered: 6, teamsCap: 8, entryFee: 2000, startDate: "2026-08-02", status: "Registration Open", organizer: "Bodakdev Sports Council" },
];

export interface CommunityPost {
  id: string;
  author: string;
  role: string;
  avatarColor: string;
  time: string;
  content: string;
  sport: Sport;
  likes: number;
  comments: number;
  image?: string;
}

export const communityPosts: CommunityPost[] = [
  {
    id: "p1",
    author: "Kavya Shah",
    role: "Player · Badminton",
    avatarColor: "#B6FF3C",
    time: "2h ago",
    content:
      "Looking for 2 more players for a doubles friendly this Saturday morning at Prahladnagar. Intermediate level, 7–9 AM. Drop a comment!",
    sport: "Badminton",
    likes: 24,
    comments: 9,
  },
  {
    id: "p2",
    author: "Satellite Strikers",
    role: "Team · Cricket",
    avatarColor: "#FF5A36",
    time: "5h ago",
    content:
      "Won our Premier League opener by 6 wickets! Great chase led by our middle order. Next up: Bopal Blazers on Sunday. Come cheer us on at Karnavati Ground.",
    sport: "Cricket",
    likes: 118,
    comments: 21,
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=900&auto=format&fit=crop",
  },
  {
    id: "p3",
    author: "Coach Aryan Patel",
    role: "Trainer · Football",
    avatarColor: "#3B82F6",
    time: "1d ago",
    content:
      "New batch for U-14 footballers starting next Monday at SG Highway Turf Club. Focus on first touch and positional awareness. DM for trial slot.",
    sport: "Football",
    likes: 76,
    comments: 14,
  },
  {
    id: "p4",
    author: "Rhea Mehta",
    role: "Player · Tennis",
    avatarColor: "#E879F9",
    time: "1d ago",
    content:
      "Anyone up for hitting practice this week at Vastrapur Ace Club? Just moved to intermediate level, want to rally with someone consistent.",
    sport: "Tennis",
    likes: 12,
    comments: 5,
  },
];

export interface Trainer {
  id: string;
  name: string;
  sport: Sport;
  experience: string;
  rating: number;
  students: number;
  area: string;
  price: string;
  tag: string;
}

export const trainers: Trainer[] = [
  { id: "tr1", name: "Aryan Patel", sport: "Football", experience: "8 yrs coaching · Ex-state player", rating: 4.9, students: 210, area: "SG Highway", price: "₹800/session", tag: "Youth Specialist" },
  { id: "tr2", name: "Nisha Rao", sport: "Badminton", experience: "AIBA certified · 12 yrs", rating: 4.8, students: 340, area: "Prahladnagar", price: "₹600/session", tag: "Top Rated" },
  { id: "tr3", name: "Vikram Solanki", sport: "Cricket", experience: "Former Ranji trialist · 10 yrs", rating: 4.7, students: 180, area: "Satellite", price: "₹900/session", tag: "Batting Specialist" },
  { id: "tr4", name: "Meera Joshi", sport: "Tennis", experience: "ITF Level 2 · 6 yrs", rating: 4.6, students: 95, area: "Vastrapur", price: "₹1000/session", tag: "All Levels" },
];

export interface Academy {
  id: string;
  name: string;
  sports: Sport[];
  area: string;
  batches: number;
  established: string;
  rating: number;
}

export const academies: Academy[] = [
  { id: "a1", name: "Karnavati Cricket Academy", sports: ["Cricket"], area: "Satellite", batches: 6, established: "2014", rating: 4.8 },
  { id: "a2", name: "Ace Badminton Institute", sports: ["Badminton"], area: "Prahladnagar", batches: 4, established: "2018", rating: 4.6 },
  { id: "a3", name: "Sabarmati Football School", sports: ["Football"], area: "SG Highway", batches: 5, established: "2016", rating: 4.7 },
];

export interface TeamMember {
  name: string;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  sport: Sport;
  members: number;
  wins: number;
  losses: number;
  captain: string;
  logoColor: string;
}

export const teams: Team[] = [
  { id: "tm1", name: "Satellite Strikers", sport: "Cricket", members: 14, wins: 9, losses: 3, captain: "Dhruvil Rana", logoColor: "#B6FF3C" },
  { id: "tm2", name: "SG United", sport: "Football", members: 16, wins: 11, losses: 4, captain: "Aryan Patel", logoColor: "#FF5A36" },
  { id: "tm3", name: "Bodakdev Smashers", sport: "Volleyball", members: 8, wins: 5, losses: 2, captain: "Kavya Shah", logoColor: "#3B82F6" },
];

export interface PlayerRequest {
  id: string;
  title: string;
  sport: Sport;
  area: string;
  date: string;
  playersNeeded: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  postedBy: string;
}

export const playerRequests: PlayerRequest[] = [
  { id: "pr1", title: "Weekend 6-a-side football", sport: "Football", area: "SG Highway", date: "Sat, 6:00 PM", playersNeeded: 2, level: "Intermediate", postedBy: "SG United" },
  { id: "pr2", title: "Morning badminton doubles", sport: "Badminton", area: "Prahladnagar", date: "Sat, 7:00 AM", playersNeeded: 2, level: "Intermediate", postedBy: "Kavya Shah" },
  { id: "pr3", title: "Box cricket, need bowlers", sport: "Cricket", area: "Bopal", date: "Sun, 9:00 AM", playersNeeded: 3, level: "Advanced", postedBy: "Bopal Blazers" },
  { id: "pr4", title: "Casual tennis rally", sport: "Tennis", area: "Vastrapur", date: "Wed, 6:30 PM", playersNeeded: 1, level: "Beginner", postedBy: "Rhea Mehta" },
  { id: "pr5", title: "3x3 basketball pickup", sport: "Basketball", area: "Chandkheda", date: "Fri, 7:30 PM", playersNeeded: 2, level: "Intermediate", postedBy: "Chandkheda Kings" },
];

export interface Notification {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "booking" | "tournament" | "community" | "system";
}

export const notifications: Notification[] = [
  { id: "n1", title: "Booking confirmed", detail: "Karnavati Sports Arena · Sun, 7:00–8:00 AM", time: "10m ago", type: "booking" },
  { id: "n2", title: "Fixture published", detail: "Ahmedabad Premier Box Cricket League · Quarterfinal draw is out", time: "1h ago", type: "tournament" },
  { id: "n3", title: "New comment", detail: "Aryan Patel commented on your post", time: "3h ago", type: "community" },
  { id: "n4", title: "Payment received", detail: "₹3,500 tournament entry fee — Ahmedabad Premier League", time: "1d ago", type: "system" },
];

export const currentUser = {
  name: "Dhruvil Rana",
  role: "Player · Team Captain",
  sportsPref: ["Cricket", "Football"],
  area: "Satellite, Ahmedabad",
  memberSince: "2025",
  matchesPlayed: 47,
  tournamentsWon: 3,
  sportsPassportLevel: "Gold",
};

export const stats = {
  activeUsers: "12,400+",
  venuesListed: 180,
  tournamentsHosted: 260,
  matchesScored: "9,800+",
};

// ---------- Role-specific data (Venue Owner / Organizer / Trainer) ----------

export interface OwnedVenue {
  id: string;
  name: string;
  sports: Sport[];
  bookingsToday: number;
  occupancy: number; // percentage
  revenueThisMonth: number;
  rating: number;
  status: "Active" | "Under review";
}

export const myVenues: OwnedVenue[] = [
  { id: "ov1", name: "Karnavati Sports Arena", sports: ["Cricket", "Football"], bookingsToday: 6, occupancy: 82, revenueThisMonth: 148000, rating: 4.7, status: "Active" },
  { id: "ov2", name: "Karnavati Indoor Courts", sports: ["Badminton"], bookingsToday: 3, occupancy: 54, revenueThisMonth: 62000, rating: 4.5, status: "Active" },
  { id: "ov3", name: "Karnavati Turf Extension", sports: ["Football"], bookingsToday: 0, occupancy: 0, revenueThisMonth: 0, rating: 0, status: "Under review" },
];

export interface BookingRequest {
  id: string;
  venue: string;
  requestedBy: string;
  slot: string;
  sport: Sport;
  amount: number;
}

export const bookingRequests: BookingRequest[] = [
  { id: "br1", venue: "Karnavati Sports Arena", requestedBy: "Rhea Mehta", slot: "Sun, 7:00–8:00 AM", sport: "Cricket", amount: 1200 },
  { id: "br2", venue: "Karnavati Indoor Courts", requestedBy: "Vikram Solanki", slot: "Sat, 6:00–7:00 PM", sport: "Badminton", amount: 500 },
  { id: "br3", venue: "Karnavati Sports Arena", requestedBy: "SG United", slot: "Mon, 5:00–6:30 PM", sport: "Football", amount: 1800 },
];

export interface OrganizedTournament {
  id: string;
  name: string;
  sport: Sport;
  teamsRegistered: number;
  teamsCap: number;
  pendingApprovals: number;
  status: "Registration Open" | "In Progress" | "Completed";
  revenueCollected: number;
}

export const myTournaments: OrganizedTournament[] = [
  { id: "ot1", name: "Ahmedabad Premier Box Cricket League", sport: "Cricket", teamsRegistered: 14, teamsCap: 16, pendingApprovals: 3, status: "Registration Open", revenueCollected: 49000 },
  { id: "ot2", name: "Satellite Corporate Cricket Cup", sport: "Cricket", teamsRegistered: 8, teamsCap: 8, pendingApprovals: 0, status: "In Progress", revenueCollected: 28000 },
];

export interface PendingTeamRegistration {
  id: string;
  team: string;
  tournament: string;
  submittedAt: string;
  players: number;
}

export const pendingRegistrations: PendingTeamRegistration[] = [
  { id: "pt1", team: "Bopal Blazers", tournament: "Ahmedabad Premier Box Cricket League", submittedAt: "2h ago", players: 12 },
  { id: "pt2", team: "Naranpura Knights", tournament: "Ahmedabad Premier Box Cricket League", submittedAt: "6h ago", players: 11 },
  { id: "pt3", team: "Thaltej Titans", tournament: "Ahmedabad Premier Box Cricket League", submittedAt: "1d ago", players: 13 },
];

export interface Student {
  id: string;
  name: string;
  sport: Sport;
  batch: string;
  attendance: number;
  since: string;
}

export const myStudents: Student[] = [
  { id: "st1", name: "Aarav Shah", sport: "Football", batch: "U-14 Evening", attendance: 92, since: "Jan 2026" },
  { id: "st2", name: "Diya Patel", sport: "Football", batch: "U-14 Evening", attendance: 88, since: "Feb 2026" },
  { id: "st3", name: "Kabir Mehta", sport: "Football", batch: "U-16 Morning", attendance: 95, since: "Nov 2025" },
  { id: "st4", name: "Ishaan Rao", sport: "Football", batch: "U-16 Morning", attendance: 79, since: "Mar 2026" },
];

export interface TrainerBatch {
  id: string;
  name: string;
  time: string;
  days: string;
  students: number;
  venue: string;
}

export const myBatches: TrainerBatch[] = [
  { id: "b1", name: "U-14 Evening", time: "5:00 – 6:30 PM", days: "Mon / Wed / Fri", students: 16, venue: "SG Highway Turf Club" },
  { id: "b2", name: "U-16 Morning", time: "6:30 – 8:00 AM", days: "Tue / Thu / Sat", students: 14, venue: "SG Highway Turf Club" },
];

export interface Inquiry {
  id: string;
  from: string;
  message: string;
  time: string;
}

export const inquiries: Inquiry[] = [
  { id: "iq1", from: "Priya Desai", message: "Is there a trial session available for my 10-year-old before joining the U-14 batch?", time: "1h ago" },
  { id: "iq2", from: "Rohan Joshi", message: "What are the fees for the U-16 morning batch and is equipment provided?", time: "5h ago" },
  { id: "iq3", from: "Meera Iyer", message: "Do you offer one-on-one goalkeeping sessions separately?", time: "1d ago" },
];
