import { useEffect, useState } from "react";

function App() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/test")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div>
      <h1>Supabase Test Table</h1>
      <ul>
        {data.map((row) => (
          <li key={row.id}>{row.id}: {row.created_at}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
