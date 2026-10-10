import { z } from "zod";

export const registerTeamSchema = z.object({
  teamId: z.string().min(1, "teamId is required"),
  // Optional override of the registered squad size — defaults to the
  // team's actual roster size server-side when omitted.
  players: z.number().int().positive().max(50).optional(),
});
