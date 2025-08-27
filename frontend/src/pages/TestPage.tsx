// frontend/src/pages/TestPage.tsx
import { JSX, useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { API_URL } from "../Base";

interface Employee {
  id: number;
  name: string;
  position: string;
  parent_employee_id?: number | null;
}

interface TreeNode {
  name: string;
  type: "department" | "section" | "position";
  children?: TreeNode[];
  employees?: Employee[];
}

const departmentColors: { [key: string]: string } = {
  "営業部": "#FF5733",
  "技術本部": "#33C1FF",
  "管理部": "#33FF99",
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

export default function TestPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assignments`)
      .then((res) => res.json())
      .then((data: TreeNode[]) => setTreeData(data));
  }, []);

  // 社員を親子階層でレンダリング
  const renderEmployees = (employees: Employee[]): JSX.Element => {
    const empMap: { [id: number]: Employee & { children?: Employee[] } } = {};
    const roots: (Employee & { children?: Employee[] })[] = [];

    employees.forEach(emp => {
      empMap[emp.id] = { ...emp, children: [] };
    });

    employees.forEach(emp => {
      const parentId = emp.parent_employee_id;
      if (parentId && empMap[parentId]) {
        empMap[parentId].children!.push(empMap[emp.id]);
      } else {
        roots.push(empMap[emp.id]);
      }
    });

    const renderRow = (emps: (Employee & { children?: Employee[] })[]): JSX.Element => (
      <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
        {emps.map(emp => (
          <Box key={emp.id} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Paper sx={{ p: 1, border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#fff" }}>
              <Typography variant="body2">{emp.name}</Typography>
              <Typography variant="caption">{emp.position}</Typography>
            </Paper>
            {emp.children && emp.children.length > 0 && renderRow(emp.children)}
          </Box>
        ))}
      </Box>
    );

    return renderRow(roots);
  };

  const renderNode = (node: TreeNode): JSX.Element => {
    return (
      <Box key={`${node.type}-${node.name}`} sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
        {/* 部署・セクション・役職などの階層ボックスを横方向に配置 */}
        <Box sx={{ display: "flex", flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
          <Paper
            sx={{
              p: 1,
              border: node.type === "department" ? `2px solid ${departmentColors[node.name]}` : "1px solid #ccc",
              backgroundColor: node.type === "position" ? positionColors[node.name] || "#eee" : "#f9f9f9",
              borderRadius: 1,
              minWidth: 150,
            }}
          >
            <Typography variant="subtitle2">{node.name}</Typography>
          </Paper>

          {/* 子ノード（セクション・役職など）があれば横に並べる */}
          {node.children && node.children.map(child => renderNode(child))}
        </Box>

        {/* 社員がいれば階層化して表示 */}
        {node.employees && renderEmployees(node.employees)}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Assignments
      </Typography>

      {/* 各部署ごとの縦方向のエリア */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {treeData.map(dept => renderNode(dept))}
      </Box>
    </Box>
  );
}
