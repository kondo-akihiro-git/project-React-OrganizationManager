// frontend/src/pages/TestPage.tsx
import { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { API_URL } from "../Base";

interface Employee {
  id: number;
  name: string;
  position: string;
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

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const marginLeft = depth * 20;

    return (
      <Box key={`${node.type}-${node.name}`} sx={{ ml: marginLeft, mb: 1 }}>
        {/* node自体 */}
        <Paper
          sx={{
            p: 1,
            border:
              node.type === "department"
                ? `2px solid ${departmentColors[node.name]}`
                : "1px solid #ccc",
            backgroundColor:
              node.type === "position"
                ? positionColors[node.name] || "#eee"
                : "#f9f9f9",
            borderRadius: 1,
            minWidth: 150,
          }}
        >
          <Typography variant="subtitle2">{node.name}</Typography>
        </Paper>

        {/* 従業員がいれば表示 */}
        {node.employees &&
          node.employees.map((emp) => (
            <Paper
              key={emp.id}
              sx={{
                p: 1,
                border: "1px solid #aaa",
                borderRadius: 1,
                backgroundColor: "#fff",
                ml: 2,
                mt: 0.5,
              }}
            >
              <Typography variant="body2">{emp.name}</Typography>
              <Typography variant="caption">{emp.position}</Typography>
            </Paper>
          ))}

        {/* childrenがいれば再帰描画 */}
        {node.children && node.children.map((child) => renderNode(child, depth + 1))}
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Assignments
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {treeData.map((dept) => renderNode(dept))}
      </Box>
    </Box>
  );
}
