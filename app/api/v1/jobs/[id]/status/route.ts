import { performOperation } from "../../../../../../lib/database";
import { apiErrorResponse } from "../../../../../../lib/api-response";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await performOperation(
      { ...payload, action: "updateJobStatus", jobId: id },
      request.headers.get("Idempotency-Key"),
    );
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
