import { useEffect, useState } from "react";
import { Box, Paper } from "@mui/material";
import { API_URL } from "../Base";

type Employee = {
  id: number;
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

export default function TestPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/sales_assignment`)
      .then((res) => res.json())
      .then((data: Employee[]) => setEmployees(data)); // 全件取得
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      {/* 親課ごとにまとめる */}
      {Array.from(
        new Set(employees.map((e) => e.parent_section).filter((v) => v))
      ).map((parent) => {
        // 親課に所属する従業員だけ取得
        const parentEmployees = employees.filter((e) => e.parent_section === parent);

        return (
          <Paper
            key={parent}
            sx={{ p: 2, mb: 2, border: "1px solid #aaa", backgroundColor: "#f8f8f8" }}
          >
            {parent}

            {/* 子課ごとにまとめる */}
            {Array.from(
              new Set(
                parentEmployees
                  .map((e) => e.child_section)
                  .filter((v) => v)
              )
            ).map((child) => {
              const childEmployees = parentEmployees.filter((e) => e.child_section === child);

              return (
                <Paper
                  key={child}
                  sx={{ p: 1, mt: 1, border: "1px solid #bbb", backgroundColor: "#fafafa" }}
                >
                  {child}

                  {/* マネージャーごとにまとめる */}
                  {Array.from(
                    new Set(
                      childEmployees
                        .map((e) => e.manager_name)
                        .filter((v) => v)
                    )
                  ).map((manager) => {
                    const managerEmployees = childEmployees.filter(
                      (e) => e.manager_name === manager
                    );

                    return (
                      <Paper
                        key={manager}
                        sx={{ p: 1, mt: 1, border: "1px solid #ccc", backgroundColor: "#f5f5f5" }}
                      >
                        {manager}

                        {/* サブマネージャーごとにまとめる */}
                        {Array.from(
                          new Set(
                            managerEmployees
                              .map((e) => e.submanager_name)
                              .filter((v) => v)
                          )
                        ).map((sub) => {
                          const subEmployees = managerEmployees.filter(
                            (e) => e.submanager_name === sub
                          );

                          return (
                            <Paper
                              key={sub}
                              sx={{
                                p: 1,
                                mt: 1,
                                border: "1px solid #ddd",
                                backgroundColor: "#f0f0f0",
                              }}
                            >
                              {sub}

                              {/* リーダーごとにまとめる */}
                              {Array.from(
                                new Set(
                                  subEmployees
                                    .map((e) => e.leader_name)
                                    .filter((v) => v)
                                )
                              ).map((leader) => {
                                const leaderEmployees = subEmployees.filter(
                                  (e) => e.leader_name === leader
                                );

                                return (
                                  <Paper
                                    key={leader}
                                    sx={{
                                      p: 1,
                                      mt: 1,
                                      border: "1px solid #eee",
                                      backgroundColor: "#f9f9f9",
                                    }}
                                  >
                                    {leader}

                                    {/* リーダーに所属する従業員を表示 */}
                                    {leaderEmployees.map((e) => (
                                      <Paper
                                        key={e.id}
                                        sx={{
                                          p: 1,
                                          mt: 1,
                                          border: "1px dashed #aaa",
                                          backgroundColor: "#fff",
                                        }}
                                      >
                                        {e.name} ({e.position})
                                      </Paper>
                                    ))}
                                  </Paper>
                                );
                              })}
                            </Paper>
                          );
                        })}
                      </Paper>
                    );
                  })}
                </Paper>
              );
            })}
          </Paper>
        );
      })}
    </Box>
  );
}
