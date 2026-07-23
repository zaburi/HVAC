import { createDemoSnapshot } from "../../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const filters = (await request.json()) as Record<string, unknown>;
    const snapshot = createDemoSnapshot();
    const jobs = snapshot.jobs.filter(
      (job) =>
        !filters.branchId || job.branch_id === String(filters.branchId),
    );
    const completed = jobs.filter((job) => job.status === "COMPLETED").length;
    const nonCancelled = jobs.filter((job) => job.status !== "CANCELLED").length;
    return Response.json({
      data: {
        stockValue: snapshot.items.reduce(
          (total, item) => total + Number(item.value),
          0,
        ),
        totalItems: snapshot.items.length,
        stockExceptions: snapshot.items.filter(
          (item) => item.health !== "HEALTHY",
        ).length,
        jobsLogged: nonCancelled,
        jobsCompleted: completed,
        completionRate: nonCancelled
          ? Math.round((completed / nonCancelled) * 1000) / 10
          : 0,
        activeTechnicians: snapshot.technicians.filter(
          (technician) =>
            String(
              (technician as Record<string, unknown>).employment_status,
            ) === "ACTIVE",
        ).length,
      },
      filters,
      generatedAt: snapshot.generatedAt,
      freshness: "live",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
