import {
  applyDemoOperation,
  createDemoSnapshot,
} from "../../../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../../../lib/api-response";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const { result } = applyDemoOperation(createDemoSnapshot(), {
      ...payload,
      action: "updateJobStatus",
      jobId: id,
    });
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
