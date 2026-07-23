import {
  getOperationsSnapshot,
  performOperation,
} from "../../../../lib/database";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getOperationsSnapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const result = await performOperation(
      payload,
      request.headers.get("Idempotency-Key"),
    );
    return Response.json(result, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
