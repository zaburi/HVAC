import { getOperationsSnapshot } from "../../../../lib/database";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getOperationsSnapshot();
    return Response.json({
      data: snapshot.audits,
      meta: { count: snapshot.audits.length },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
