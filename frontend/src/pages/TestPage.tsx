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
  type: "department" | "section_1" | "section_2" | "position_1" | "position_2" | "position_3" | "position_4";
  children?: TreeNode[];
  employees?: Employee[];
}

export default function TestPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assignments`)
      .then(res => res.json())
      .then((data: TreeNode[]) => setTreeData(data));
  }, []);

  return (

    // 6つボックスを横並びに表示

    <Box sx={{ display: "flex", flexDirection: "column", width: "100%", gap: "0.5%", mb: 2 }}>
      {treeData.map((department, department_index) =>
        department.children?.filter(child => child.type === "section_1").map((section_1, section_1_index) =>
          (section_1.children && section_1.children.filter(c => c.type === "section_2").length > 0
            ? section_1.children.filter(c => c.type === "section_2")
            : [null]
          ).map((section_2, section_2_index) =>
            (
              (section_2?.children?.filter(c => c.type === "position_1").length
                ? section_2.children.filter(c => c.type === "position_1")
                : section_1.children?.filter(c => c.type === "position_1")?.length
                  ? section_1.children.filter(c => c.type === "position_1")
                  : [null]
              )
            ).map((position_1, position_1_index) =>
              (
                (position_1?.children?.filter(c => c.type === "position_2").length
                  ? position_1.children.filter(c => c.type === "position_2")
                  : section_2?.children?.filter(c => c.type === "position_2")?.length
                    ? section_2.children.filter(c => c.type === "position_2")
                    : section_1.children?.filter(c => c.type === "position_2")?.length
                      ? section_1.children.filter(c => c.type === "position_2")
                      : [null]
                )
              ).map((position_2, position_2_index) =>
                (
                  position_2?.children?.filter(c => c.type === "position_3").length
                    ? position_2.children.filter(c => c.type === "position_3")
                    : position_1?.children?.filter(c => c.type === "position_3")?.length
                      ? position_1.children.filter(c => c.type === "position_3")
                      : section_2?.children?.filter(c => c.type === "position_3")?.length
                        ? section_2.children.filter(c => c.type === "position_3")
                        : section_1.children?.filter(c => c.type === "position_3")?.length
                          ? section_1.children.filter(c => c.type === "position_3")
                          : [null]
                ).map((position_3, position_3_index) =>



                  <Box
                    key={`${department_index}-${section_1_index}-${section_2_index}-${position_1_index}-${position_2_index}-${position_3_index}`}
                    sx={{ display: "flex", gap: "0.5%" }}
                  >


                    {/* 部署 */}
                    <Paper sx={{ visibility: section_1_index === 0 ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{department.name}</Typography>
                    </Paper>

                    {/* 課1 */}
                    <Paper sx={{ visibility: section_2_index === 0 ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{section_1.name}</Typography>
                    </Paper>

                    {/* 課2 */}
                    <Paper sx={{ visibility: section_2?.name ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{section_2?.name ?? ""}</Typography>
                    </Paper>
                    <Paper sx={{ visibility: position_1?.name ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{position_1?.name}</Typography>
                      {position_1?.employees?.map(emp => (
                        <Typography key={emp.id} variant="body2">
                          {emp.position}：{emp.name}
                        </Typography>

                      ))}
                    </Paper>
                    <Paper sx={{ visibility: position_2?.name ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{position_2?.name}</Typography>
                      {position_2?.employees?.map(emp => (
                        <Typography key={emp.id} variant="body2">
                          {emp.position}：{emp.name}
                        </Typography>
                      ))}
                    </Paper>
                    <Paper sx={{ visibility: position_3?.name ? "visible" : "hidden", flex: 1, p: 3, textAlign: "center", border: "1px solid #aaa", borderRadius: 1, backgroundColor: "#f0f0f0" }}>
                      <Typography variant="subtitle1">{position_3?.name}</Typography>
                      {position_3?.employees?.map(emp => (
                        <Typography key={emp.id} variant="body2">
                          {emp.position}：{emp.name}
                        </Typography>
                      ))}
                    </Paper>
                  </Box>

                )))))
      )
      }
    </Box>

  );
}
