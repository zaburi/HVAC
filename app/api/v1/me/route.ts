import { getChatGPTUser } from "../../../chatgpt-auth";
import { getOperationsSnapshot } from "../../../../lib/database";
import { apiErrorResponse } from "../../../../lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [user, snapshot] = await Promise.all([
      getChatGPTUser(),
      getOperationsSnapshot(),
    ]);
    return Response.json({
      user: {
        displayName: user?.displayName ?? "Asha Mwita",
        email: user?.email ?? "operations@kiboclimate.co.tz",
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
