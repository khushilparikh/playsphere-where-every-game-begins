import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, withErrorHandling } from "@/lib/api-format";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// GET /api/tournaments/:id/certificate?teamId=xyz
// Task 31, Phase 6: a simple participation/placement certificate,
// generated server-side with pdf-lib (no external design service) from
// the tournament + team's own data. Public — a team should be able to
// download and share their certificate without needing to be logged in
// as the organizer.
export const GET = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) return jsonError("teamId query param is required");

  const [tournament, registration] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: params.id } }),
    prisma.teamRegistration.findFirst({
      where: { tournamentId: params.id, teamId, status: "APPROVED" },
      include: { team: true },
    }),
  ]);
  if (!tournament) return jsonError("Tournament not found", 404);
  if (!registration) return jsonError("This team isn't an approved participant in this tournament.", 404);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape, points
  const { width, height } = page.getSize();

  const heading = await pdf.embedFont(StandardFonts.HelveticaBold);
  const body = await pdf.embedFont(StandardFonts.Helvetica);

  const gold = rgb(0.83, 0.69, 0.22);
  const ink = rgb(0.13, 0.14, 0.18);
  const faint = rgb(0.45, 0.47, 0.52);

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: gold, borderWidth: 2 });

  const center = (text: string, size: number, font = body) => (width - font.widthOfTextAtSize(text, size)) / 2;

  page.drawText("CERTIFICATE OF PARTICIPATION", {
    x: center("CERTIFICATE OF PARTICIPATION", 26, heading),
    y: height - 140,
    size: 26,
    font: heading,
    color: gold,
  });

  page.drawText("This certifies that", {
    x: center("This certifies that", 14),
    y: height - 200,
    size: 14,
    font: body,
    color: faint,
  });

  const teamName = registration.team.name;
  page.drawText(teamName, {
    x: center(teamName, 32, heading),
    y: height - 250,
    size: 32,
    font: heading,
    color: ink,
  });

  const line2 = `participated in ${tournament.name}`;
  page.drawText(line2, { x: center(line2, 15), y: height - 300, size: 15, font: body, color: faint });

  const dateStr = new Date(tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(dateStr, { x: center(dateStr, 12), y: height - 330, size: 12, font: body, color: faint });

  page.drawText("PlaySphere", { x: 60, y: 70, size: 12, font: heading, color: gold });

  const pdfBytes = await pdf.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${tournament.name.replace(/[^a-z0-9]/gi, "-")}-${teamName.replace(/[^a-z0-9]/gi, "-")}-certificate.pdf"`,
    },
  });
});
