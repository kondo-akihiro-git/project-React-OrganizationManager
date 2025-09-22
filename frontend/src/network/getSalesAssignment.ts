// frontend/src/network/getSalesAssignment.ts
import { API_URL } from "../base/Base";
import mockData from "../network/mock/get_sales_assignment.json";

// ======================================================
// データの型定義（OrganizationItem）
// ======================================================
export interface OrganizationItem {
  id: number | null;
  name: string;
  title: string;
  exists: boolean;
  children: OrganizationItem[];
}

// ======================================================
// API 呼び出し関数
// ======================================================
// getSalesAssignment() を呼ぶと、組織データを取得できます
export async function getSalesAssignment(): Promise<OrganizationItem[]> {
  // try {
  //   const response = await fetch(`${API_URL}/sales_assignment`);
  //   if (!response.ok) {
  //     throw new Error(`API error: ${response.status}`);
  //   }
  //   const data: OrganizationItem[] = await response.json();
  //   return data;
  // } catch (error) {
  //   console.error("fetchSalesAssignment error:", error);
  //   return []; // 失敗時は空配列を返す
  // }
  return mockData as OrganizationItem[];
}
