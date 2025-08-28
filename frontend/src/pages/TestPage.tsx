import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";
import { Section, Employee, get_sales_assignment } from "../network/getSalesAssignment";

export default function TestPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    get_sales_assignment().then(setSections);

    const handleResize = () => {
      // 仮に画面幅1000px基準として縮小率を計算
      const scale = Math.min(1, window.innerWidth / 1000);
      setFontScale(scale);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // 初期呼び出し
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderEmployee = (employee: Employee) => {
    const boxStyle = {
      padding: 1,
      border: "1px solid #1976d2",
      borderRadius: 1,
      backgroundColor: "#e3f2fd",
      textAlign: "center" as const,
      whiteSpace: "nowrap" as const,
      overflowWrap: "anywhere" as const,
      fontSize: `${0.75 * fontScale}rem`,
    };

    if (employee.children.length === 0 && employee.employees.length > 0) {
      return (
        <TreeNode
          key={employee.employee_id}
          label={
            <Box sx={boxStyle}>
              {employee.position} {employee.employee_name}
              <Box sx={{ marginTop: 1 }}>
                {employee.employees.map((mem) => (
                  <Box
                    key={mem.employee_id}
                    sx={{
                      ...boxStyle,
                      padding: 0.5,
                      marginTop: 0.5,
                    }}
                  >
                    {mem.position} {mem.employee_name}
                  </Box>
                ))}
              </Box>
            </Box>
          }
        />
      );
    }

    return (
      <TreeNode
        key={employee.employee_id}
        label={<Box sx={boxStyle}>{employee.position} {employee.employee_name}</Box>}
      >
        {employee.children.map(renderEmployee)}
        {employee.employees.map(renderEmployee)}
      </TreeNode>
    );
  };

  const renderSection = (section: Section) => (
    <TreeNode
      key={section.section_id}
      label={
        <Box
          sx={{
            padding: 1,
            border: "2px solid #1976d2",
            borderRadius: 1,
            backgroundColor: "#bbdefb",
            textAlign: "center",
            fontSize: `${0.75 * fontScale}rem`,
            whiteSpace: "nowrap",
          }}
        >
          📂 {section.section_name}
        </Box>
      }
    >
      {section.employees.map(renderEmployee)}
      {section.children.map(renderSection)}
    </TreeNode>
  );

  return (
    <Box sx={{ padding: 2, overflowX: "auto" }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        営業部 組織図
      </Typography>

      <Tree
        label={
          <Box
            sx={{
              padding: 1,
              border: "2px solid #1976d2",
              borderRadius: 1,
              backgroundColor: "#90caf9",
              textAlign: "center",
              fontSize: `${0.75 * fontScale}rem`,
              whiteSpace: "nowrap",
            }}
          >
            営業部
          </Box>
        }
      >
        {sections.map(renderSection)}
      </Tree>
    </Box>
  );
}
