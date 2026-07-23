import { createDemoSnapshot } from "../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = createDemoSnapshot();
    return Response.json({
      data: snapshot.technicians,
      meta: {
        count: snapshot.technicians.length,
        scoringWeights: { completion: 50, volume: 30, timeliness: 20 },
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
