// frontend/src/network/getSalesAssignment.ts
import { API_URL } from "../Base";

// ============================
// 社員タイプ
// ============================
export type Employee = {
  employee_id: number;
  employee_name: string;
  position: string;
  role: string;
  children: Employee[];   // サブマネージャーやリーダーの下位社員
  employees: Employee[];  // リーダーの下のメンバー
};

// ============================
// セクションタイプ
// ============================
export type Section = {
  section_id: number;
  section_name: string;
  children: Section[];     // サブセクション
  employees: Employee[];   // このセクションに直接所属する社員
};

// ============================
// APIからデータを取得する関数
// ============================
export const get_sales_assignment = async (): Promise<Section[]> => {
  const response = await fetch(`${API_URL}/sales_assignment`);
  const data: Section[] = await response.json();
  return data; // そのまま返す
};
