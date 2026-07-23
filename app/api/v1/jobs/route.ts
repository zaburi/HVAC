import {
  applyDemoOperation,
  createDemoSnapshot,
} from "../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = createDemoSnapshot();
    return Response.json({
      data: snapshot.jobs,
      meta: { count: snapshot.jobs.length, generatedAt: snapshot.generatedAt },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const { result } = applyDemoOperation(createDemoSnapshot(), {
      ...payload,
      action: "createJob",
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
