// frontend/src/pages/TestPage.tsx
import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
} from "reactflow";
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

function TestPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/assignments`)
      .then((res) => res.json())
      .then((data: Assignment[]) => {
        // Node 作成
        const createdNodes: Node[] = data.map((row, index) => ({
          id: String(row.assignment_id),
          position: { x: 150 * (index % 5), y: 100 * Math.floor(index / 5) },
          data: { label: `${row.employee_name} (${row.position_name || "N/A"})` },
        }));

        // Edge 作成 (parent_section_id があれば線でつなぐ)
        const createdEdges: Edge[] = data
          .filter((row) => row.parent_section_id !== null)
          .map((row) => ({
            id: `e${row.parent_section_id}-${row.section_id}`,
            source: String(row.parent_section_id),
            target: String(row.section_id),
            animated: true,
          }));

        setNodes(createdNodes);
        setEdges(createdEdges);
      });
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <h2>Assignments Flow</h2>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default TestPage;
