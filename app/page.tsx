import CoolOpsApp from "./coolops-app";

export default function Home() {
  return (
    <CoolOpsApp
      viewer={{
        name: "Asha Mwita",
        email: "demo@coolops.example",
        role: "Operations Manager",
      }}
    />
  );
}
