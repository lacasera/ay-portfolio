import { useEffect, useState } from "react";

interface HelloResponse {
  message: string;
}

export default function App() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json() as Promise<HelloResponse>)
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Failed to reach backend."));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          ay-portfolio
        </h1>
        <p className="mt-4 text-sm font-medium text-slate-500">Backend says:</p>
        <blockquote className="mt-2 border-l-4 border-indigo-500 bg-indigo-50 px-4 py-3 text-slate-800">
          {message}
        </blockquote>
      </div>
    </main>
  );
}
