import {
  applyDemoOperation,
  createDemoSnapshot,
} from "../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(createDemoSnapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const { result } = applyDemoOperation(createDemoSnapshot(), payload);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
