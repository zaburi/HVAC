import HVACApp from "./hvac-app";

export default function Home() {
  return (
    <HVACApp
      viewer={{
        name: "Asha Mwita",
        email: "demo@hvac.example",
        role: "Operations Manager",
      }}
    />
  );
}
