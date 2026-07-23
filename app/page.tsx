import { getChatGPTUser } from "./chatgpt-auth";
import CoolOpsApp from "./coolops-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <CoolOpsApp
      viewer={{
        name: user?.displayName ?? "Asha Mwita",
        email: user?.email ?? "operations@kiboclimate.co.tz",
        role: "Operations Manager",
      }}
    />
  );
}
