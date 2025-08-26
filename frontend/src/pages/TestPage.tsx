// frontend/src/pages/TestPage.tsx
import { useEffect, useState } from "react";
import ReactFlow, { Node, Edge, Background } from "reactflow";
import "reactflow/dist/style.css";
import { API_URL } from "../Base";

interface Assignment {
  assignment_id: number;
  employee_id: number;
  employee_name: string;
  department_id: number;
  department_name: string;
  section_id: number;
  section_name: string;
  parent_section_id: number | null;
  position_id: number | null;
  position_name: string | null;
}

const departmentColors: { [key: number]: string } = {
  1: "#FF5733",
  2: "#33C1FF",
  3: "#33FF99",
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

const departmentBgColors: { [key: number]: string } = {
  1: "rgba(255, 87, 51, 0.1)",
  2: "rgba(51, 193, 255, 0.1)",
  3: "rgba(51, 255, 153, 0.1)",
};

const roleColumns: { [key: string]: number } = {
  "課長 (マネージャー)": 0,
  "係長 (サブマネージャー)": 1,
  "主任 (チームリーダー)": 2,
  "副主任 (サブリーダー)": 2,
  "メンバー": 3,
  "責任者": 3,
  "PHP": 3,
  "Java": 3,
  "インフラ": 3,
  "デザイン": 3,
  "SE": 3,
  "PG": 3,
  "役職不明": 3,
};

export default function TestPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assignments`)
      .then((res) => res.json())
      .then((data: Assignment[]) => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];

        const columnWidth = 200;
        const rowHeight = 80;
        let yOffset = 0;

        // 部署ごとに縦に並べる
        const departments = [1, 2, 3];
        departments.forEach((deptId) => {
          const deptMembers = data.filter((d) => d.department_id === deptId);

          // 部署タイトルノード
          nodes.push({
            id: `dept-${deptId}`,
            position: { x: 0, y: yOffset },
            style: {
              width: window.innerWidth - 40,
              height: 40,
              backgroundColor: departmentBgColors[deptId],
              border: `2px solid ${departmentColors[deptId]}`,
              borderRadius: 6,
              textAlign: "center",
              fontWeight: "bold",
              paddingTop: 10,
            },
            data: { label: data.find(d => d.department_id === deptId)?.department_name || "" },
          });
          yOffset += 50;

          // 役職ごとにグループ化
          const roleGroups: { [col: number]: Assignment[] } = {};
          deptMembers.forEach((m) => {
            const col = roleColumns[m.position_name || "役職不明"];
            if (!roleGroups[col]) roleGroups[col] = [];
            roleGroups[col].push(m);
          });

          // 横方向にマネ→サブ→主任/副主任→その他
          Object.entries(roleGroups).forEach(([colStr, members]) => {
            const col = Number(colStr);
            let roleYOffset = yOffset;

            members.forEach((member) => {
              nodes.push({
                id: String(member.assignment_id),
                position: { x: col * columnWidth + 20, y: roleYOffset },
                data: {
                  label: (
                    <div
                      style={{
                        padding: 6,
                        border: `2px solid ${departmentColors[member.department_id]}`,
                        backgroundColor: positionColors[member.position_name || "役職不明"],
                        borderRadius: 6,
                        minWidth: 150,
                        textAlign: "center",
                      }}
                    >
                      <div>{member.section_name}</div>
                      <div>{member.position_name || "N/A"}</div>
                      <div>{member.employee_name}</div>
                    </div>
                  ),
                },
              });

              // edges: parent_section_id に従属
              if (member.parent_section_id) {
                const parent = deptMembers.find(d => d.section_id === member.parent_section_id);
                if (parent) {
                  edges.push({
                    id: `e-${parent.assignment_id}-${member.assignment_id}`,
                    source: String(parent.assignment_id),
                    target: String(member.assignment_id),
                    animated: true,
                  });
                }
              }

              roleYOffset += rowHeight;
            });
          });

          // 部署の縦オフセット調整
          yOffset += Math.max(...Object.values(roleGroups).map(g => g.length)) * rowHeight + 50;
        });

        setNodes(nodes);
        setEdges(edges);
      });
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <h2>Assignments Flow</h2>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        panOnScroll={true}
        panOnDrag={false}
        minZoom={1}
        maxZoom={1}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
