// frontend/src/pages/TestPage.tsx
import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { API_URL } from "../Base";

interface Assignment {
  assignment_id: number;
  employee_id: number;
  employee_name: string;
  department_id: number;
  department_name: string;
  section_id: number;
  section_name: string;
  parent_section_id: number | null;
  position_id: number | null;
  position_name: string | null;
}

const departmentColors: { [key: number]: string } = {
  1: "#FF5733",
  2: "#33C1FF",
  3: "#33FF99",
};

const positionColors: { [key: string]: string } = {
  "部長": "#FFD700",
  "課長 (マネージャー)": "#FFA500",
  "係長 (サブマネージャー)": "#FF8C00",
  "主任 (チームリーダー)": "#ADFF2F",
  "副主任 (サブリーダー)": "#7FFF00",
  "メンバー": "#87CEFA",
  "責任者": "#FF69B4",
  "PHP": "#C0C0C0",
  "Java": "#D2691E",
  "インフラ": "#8A2BE2",
  "デザイン": "#FF1493",
  "SE": "#00CED1",
  "PG": "#7B68EE",
  "役職不明": "#D3D3D3",
};

const departmentBgColors: { [key: number]: string } = {
  1: "rgba(255, 87, 51, 0.1)",
  2: "rgba(51, 193, 255, 0.1)",
  3: "rgba(51, 255, 153, 0.1)",
};

const roleColumns: { [key: string]: number } = {
  "課長 (マネージャー)": 0,
  "係長 (サブマネージャー)": 1,
  "主任 (チームリーダー)": 2,
  "副主任 (サブリーダー)": 2,
  "メンバー": 3,
  "責任者": 3,
  "PHP": 3,
  "Java": 3,
  "インフラ": 3,
  "デザイン": 3,
  "SE": 3,
  "PG": 3,
  "役職不明": 3,
};

export default function TestPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assignments`)
      .then((res) => res.json())
      .then((data: Assignment[]) => setAssignments(data));
  }, []);

  const departments = [1, 2, 3];

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Assignments
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {departments.map((deptId) => {
          const deptMembers = assignments.filter((d) => d.department_id === deptId);

          const roleGroups: { [col: number]: Assignment[] } = {};
          deptMembers.forEach((m) => {
            const col = roleColumns[m.position_name || "役職不明"];
            if (!roleGroups[col]) roleGroups[col] = [];
            roleGroups[col].push(m);
          });

          return (
            <Box
              key={deptId}
              sx={{
                p: 2,
                border: `2px solid ${departmentColors[deptId]}`,
                borderRadius: 2,
                backgroundColor: departmentBgColors[deptId],
              }}
            >
              {/* 部署タイトル */}
              <Typography variant="h6" align="center" fontWeight="bold" gutterBottom>
                {deptMembers[0]?.department_name || `Department ${deptId}`}
              </Typography>

              {/* 役職ごとの横並び */}
              <Box sx={{ display: "flex", gap: 2 }}>
                {Object.entries(roleGroups).map(([colStr, members]) => (
                  <Box
                    key={colStr}
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {members.map((member) => (
                      <Paper
                        key={member.assignment_id}
                        sx={{
                          p: 1,
                          border: `2px solid ${departmentColors[member.department_id]}`,
                          backgroundColor: positionColors[member.position_name || "役職不明"],
                          borderRadius: 1,
                          textAlign: "center",
                          minWidth: 150,
                        }}
                      >
                        <Typography variant="subtitle2">{member.section_name}</Typography>
                        <Typography variant="body2">{member.position_name || "N/A"}</Typography>
                        <Typography variant="body2">{member.employee_name}</Typography>
                      </Paper>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
