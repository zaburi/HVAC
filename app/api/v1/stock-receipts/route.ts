import {
  getOperationsSnapshot,
  performOperation,
} from "../../../../lib/database";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getOperationsSnapshot();
    const data = snapshot.movements.filter(
      (movement) => movement.movement_type === "RECEIPT",
    );
    return Response.json({ data, meta: { count: data.length } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await performOperation(
      { ...payload, action: "postReceipt" },
      request.headers.get("Idempotency-Key"),
    );
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
