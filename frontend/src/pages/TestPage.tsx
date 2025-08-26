import { useEffect, useState } from "react";
import { API_URL } from "../Base";

function TestPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/test`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h2>Supabase Test Table</h2>
      <ul>
        {data.map((row) => (
          <li key={row.id}>{row.id}: {row.created_at}</li>
        ))}
      </ul>
    </div>
  );
}

export default TestPage;
