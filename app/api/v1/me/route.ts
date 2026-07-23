import { createDemoSnapshot } from "../../../../lib/demo-data";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = createDemoSnapshot();
    return Response.json({
      user: {
        displayName: "Asha Mwita",
        email: "demo@coolops.example",
        demo: true,
      },
      organizations: [
        {
          id: snapshot.organization.id,
          name: snapshot.organization.name,
          role: "OPERATIONS_MANAGER",
          branchIds: snapshot.branches.map((branch) => branch.id),
          permissions: [
            "dashboard:view",
            "job:create",
            "job:assign",
            "job:status",
            "inventory:view",
            "stock:issue:view",
            "report:view",
          ],
        },
      ],
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
