import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { API_URL } from "../Base";

type Employee = {
  id: number;
  name: string;
  department: string;
  parent_section: string;
  child_section: string | null;
  position: string;
  manager_id: number | null;
  manager_name: string | null;
  submanager_id: number | null;
  submanager_name: string | null;
  leader_id: number | null;
  leader_name: string | null;
};

export default function TestPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/sales_assignment`)
      .then((res) => res.json())
      .then((data: Employee[]) => setEmployees(data.slice(0, 10))); // とりあえず10件表示
  }, []);

  return (
    <Box sx={{ display: "flex", gap: 4, p: 4 }}>
      {/* 親課 */}
      <Box sx={{ flex: 1 }}>
        {employees.map((emp) => (
          <Paper
            key={emp.id}
            sx={{
              p: 2,
              mb: 4,
              textAlign: "center",
              position: "relative",
            }}
          >
            {emp.parent_section}
            {/* 縦線 */}
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                width: 20,
                borderTop: "1px solid black",
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* 子課 */}
      <Box sx={{ flex: 1 }}>
        {employees.map((emp) => (
          <Paper key={emp.id} sx={{ p: 2, mb: 4, textAlign: "center", position: "relative" }}>
            {emp.child_section || "なし"}
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                width: 20,
                borderTop: "1px solid black",
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* マネージャー */}
      <Box sx={{ flex: 1 }}>
        {employees.map((emp) => (
          <Paper key={emp.id} sx={{ p: 2, mb: 4, textAlign: "center", position: "relative" }}>
            {emp.manager_name || "なし"}
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                width: 20,
                borderTop: "1px solid black",
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* サブマネージャー */}
      <Box sx={{ flex: 1 }}>
        {employees.map((emp) => (
          <Paper key={emp.id} sx={{ p: 2, mb: 4, textAlign: "center", position: "relative" }}>
            {emp.submanager_name || "なし"}
            <Box
              sx={{
                position: "absolute",
                right: -20,
                top: "50%",
                width: 20,
                borderTop: "1px solid black",
              }}
            />
          </Paper>
        ))}
      </Box>

      {/* リーダー */}
      <Box sx={{ flex: 1 }}>
        {employees.map((emp) => (
          <Paper key={emp.id} sx={{ p: 2, mb: 4, textAlign: "center" }}>
            {emp.leader_name || "なし"}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
