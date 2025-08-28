import { useEffect, useState } from "react";
import { API_URL } from "../Base";

type Employee = {
  employee_id: number;
  name: string;
  department: string;
  parent_section: string;
  child_section: string | null;
  position: string;
  manager_id: number | null;
  manager_name: string | null;
  submanager_id: number | null;
  submanager_name: string | null;
  leader_id: number | null;
  leader_name: string | null;
};

type NestedEmployee = {
  employee_id?: number; 
  name: string;           // 表示用の名前
  position?: string;      // 役職つき社員ならポジションも追加
  employees?: Employee[]; // メンバー
  children?: NestedEmployee[];
};

export default function TestPage() {
  const [nestedEmployees, setNestedEmployees] = useState<NestedEmployee[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/sales_assignment`)
      .then((res) => res.json())
      .then((data: Employee[]) => {
        const parentSections: NestedEmployee[] = [];

        data.forEach((emp) => {
          // --- 親課 ---
          let parent = parentSections.find((p) => p.name === emp.parent_section);
          if (!parent) {
            parent = { name: emp.parent_section, children: [] };
            parentSections.push(parent);
          }

          // --- 子課 ---
          if (emp.child_section) {
            if (!parent.children) parent.children = [];
            let child = parent.children.find((c) => c.name === emp.child_section);
            if (!child) {
              child = { name: emp.child_section, children: [] };
              parent.children.push(child);
            }

            // --- マネージャー ---
            if (emp.manager_name) {
              if (!child.children) child.children = [];
              let managerNode = child.children.find((m) => m.name === emp.manager_name);
              if (!managerNode) {
                managerNode = {
                  employee_id: emp.manager_id || undefined,
                  name: emp.manager_name,
                  position: data.find(d => d.employee_id === emp.manager_id)?.position,
                  children: [],
                };
                child.children.push(managerNode);
              }

              // --- サブマネージャー ---
              if (emp.submanager_name) {
                if (!managerNode.children) managerNode.children = [];
                let subNode = managerNode.children.find((s) => s.name === emp.submanager_name);
                if (!subNode) {
                  subNode = {
                    employee_id: emp.submanager_id || undefined,
                    name: emp.submanager_name,
                    position: data.find(d => d.employee_id === emp.submanager_id)?.position,
                    children: [],
                  };
                  managerNode.children.push(subNode);
                }

                // --- リーダー ---
                if (emp.leader_name) {
                  if (!subNode.children) subNode.children = [];
                  let leaderNode = subNode.children.find((l) => l.name === emp.leader_name);
                  if (!leaderNode) {
                    leaderNode = {
                      employee_id: emp.leader_id || undefined,
                      name: emp.leader_name,
                      position: data.find(d => d.employee_id === emp.leader_id)?.position,
                      employees: [],
                    };
                    subNode.children.push(leaderNode);
                  }
                  if (!leaderNode.employees) leaderNode.employees = [];
                  leaderNode.employees.push(emp);
                } else {
                  if (!subNode.employees) subNode.employees = [];
                  subNode.employees.push(emp);
                }
              } else {
                if (!managerNode.employees) managerNode.employees = [];
                managerNode.employees.push(emp);
              }
            } else {
              if (!child.employees) child.employees = [];
              child.employees.push(emp);
            }
          } else {
            if (!parent.employees) parent.employees = [];
            parent.employees.push(emp);
          }
        });

        setNestedEmployees(parentSections);
      });
  }, []);

  useEffect(() => {
    console.log("整形済み社員データ:", nestedEmployees);
  }, [nestedEmployees]);

  return (
    <div>
      <h2>社員データを整理中...</h2>
      <pre>{JSON.stringify(nestedEmployees, null, 2)}</pre>
    </div>
  );
}
