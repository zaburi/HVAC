import {
  applyDemoOperation,
  createDemoSnapshot,
} from "../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = createDemoSnapshot();
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
    const { result } = applyDemoOperation(createDemoSnapshot(), {
      ...payload,
      action: "postReceipt",
    });
    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
