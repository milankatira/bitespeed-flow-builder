import FlowWrapper from "./flow/FlowWrapper";

export default function Home() {
  return (
    <main className="min-h-screen flex bg-gray-50 text-black">
      <div className="w-full h-screen">
        <FlowWrapper />
      </div>
    </main>
  );
}
