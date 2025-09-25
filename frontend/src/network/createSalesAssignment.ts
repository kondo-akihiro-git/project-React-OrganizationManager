// frontend/src/network/createSalesAssignment.ts
import { API_URL } from "../base/Base";

export interface CreateSalesUserPayload {
  name: string;
  role: "manager" | "sub_manager" | "leader" | "member";
  title: string;
  exists: boolean;
  department_id: number;
  manager_id?: number;
  team_id?: number;
  sub_manager_id?: number;
  leader_id?: number;
}

export async function createSalesAssignment(
  payload: CreateSalesUserPayload
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/create_sales_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("createSalesAssignment error:", error);
    throw error;
  }
}
