// frontend/src/pages/TestPage.tsx
import { useEffect, useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Section, Employee, get_sales_assignment } from "../network/getSalesAssignment";

export default function TestPage() {
  // 取得したセクション情報を格納
  const [allSections, setAllSections] = useState<Section[]>([]);

  // ページ読み込み時にAPIからデータ取得
  useEffect(() => {
    get_sales_assignment().then(setAllSections);
  }, []);

  // ============================
  // セクションや社員を再帰的に表示する関数
  // ============================
  const displaySection = (section: Section) => (
    <Paper
      key={section.section_id}
      elevation={3}
      sx={{ margin: 2 ,padding: 5 }}
    >
      {/* セクション名 */}
      <Typography>{section.section_name}</Typography>

      {/* セクション直下の社員 */}
      {section.employees.map(displayEmployee)}

      {/* サブセクションがあれば再帰的に描画 */}
      {section.children.map(displaySection)}
    </Paper>
  );

  // ============================
  // 社員情報を再帰的に表示する関数
  // ============================
  const displayEmployee = (employee: Employee) => {
  // メンバーなら小さく、それ以外は通常サイズ
  const isMember = employee.role === "メンバー";
  const isManager = employee.role === "マネージャー";
  const paddingSize = isMember ? 3 : 3;        // MUI の spacing 単位
  const marginLeft = isMember ? "" : "15%";
  const paddingHeight = isMember ? 1 : "";

  return (
    <Paper
      key={employee.employee_id}
      elevation={3}
      sx={{ margin: 1, padding: 5, paddingY: paddingHeight, marginLeft: marginLeft }} 
    >
      {/* 役職と名前 */}
      <Typography>{`${employee.position} ${employee.employee_name}`}</Typography>

      {/* サブマネージャーやリーダーの下位社員 */}
      {employee.children.map(displayEmployee)}

      {/* リーダーの下のメンバー */}
      {employee.employees.map(displayEmployee)}
    </Paper>
  );
};


  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>営業部</Typography>

      {/* APIから取得したセクションを順番に表示 */}
      {allSections.map(displaySection)}
    </Box>
  );
}
