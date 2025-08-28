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
      sx={{ margin: 2 ,padding: 3, marginLeft:undefined }}
    >
      {/* セクション名 */}
      <Typography>{section.section_name}</Typography>

      {/* セクション直下の社員 */}
{/* セクション直下の社員はトップレベル */}
{section.employees.map((e) => displayEmployee(e, true))}


      {/* サブセクションがあれば再帰的に描画 */}
      {section.children.map(displaySection)}
    </Paper>
  );

  // ============================
  // 社員情報を再帰的に表示する関数
  // ============================
const displayEmployee = (employee: Employee, isTopLevel: boolean = false) => {
  // メンバーなら小さく、それ以外は通常サイズ
  const isMember = employee.role === "メンバー";

  // マネージャーやサブマネ、リーダーでトップレベルじゃない場合は marginLeft 15%
  const marginLeft = !isMember && !isTopLevel ? "15%" : undefined;

  // メンバーだけ高さ小さく
  const paddingVertical = isMember ? 1 : undefined;

  const fontSize = isMember ? "0.7rem" : "1rem";

  return (
    <Paper
      key={employee.employee_id}
      elevation={3}
      sx={{ margin: 2, padding: 3, paddingY: paddingVertical, marginLeft: marginLeft }}
    >
      {/* 役職と名前 */}
      <Typography fontSize={fontSize}>{`${employee.position} ${employee.employee_name}`}</Typography>

      {/* サブマネージャーやリーダーの下位社員 */}
      {employee.children.map((e) => displayEmployee(e))}

      {/* リーダーの下のメンバー */}
      {employee.employees.map((e) => displayEmployee(e))}
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
