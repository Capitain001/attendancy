"use client";
import { useQueryClient } from "@tanstack/react-query";

export default function DebugQueries() {
  const queryClient = useQueryClient();

  const queries = queryClient.getQueryCache().getAll();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="font-bold mb-2">🧠 Queries en cache :</h2>
      <ul className="space-y-2">
        {queries.map((q) => (
          <li key={q.queryHash} className="text-sm">
            <strong>{q.queryHash}</strong>
            <pre>{JSON.stringify(q.state.data, null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
