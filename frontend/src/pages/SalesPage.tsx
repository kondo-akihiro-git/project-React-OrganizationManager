// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";

const API_URL = "http://localhost:8000";

type Node = {
  id: number;
  name: string;
  title?: string;
  children: Node[];
};

export default function SalesPage() {
  const [data, setData] = useState<Node[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${API_URL}/sales_assignment`);
      const json = await res.json();
      setData(json);
    };
    fetchData();
  }, []);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.offsetWidth;
      const scrollWidth = containerRef.current.scrollWidth;
      setScale(scrollWidth > parentWidth ? parentWidth / scrollWidth : 1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  const getBoxStyle = (node: Node) => {
    let bgColor = "#e3f2fd"; // メンバー
    if (node.title === "副主任") bgColor = "#c8e6c9";
    else if (!node.children.length) bgColor = "#e3f2fd"; // メンバー
    else if (!node.title) bgColor = "#bbdefb"; // 課・課長・チーム・主任
    return {
      padding: 1,
      border: "1px solid #1976d2",
      borderRadius: 1,
      backgroundColor: bgColor,
      textAlign: "center" as const,
      whiteSpace: "nowrap" as const,
      overflowWrap: "anywhere" as const,
      fontSize: "0.75rem",
    };
  };

  // 再帰描画
  const renderNode = (node: Node) => (
    <TreeNode
      key={node.id}
      label={<Box sx={getBoxStyle(node)}>{node.title ? `${node.title} ${node.name}` : node.name}</Box>}
    >
      {node.children.map(renderNode)}
    </TreeNode>
  );

  return (
    <Box sx={{ padding: 2, overflow: "hidden" }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        営業部 組織図
      </Typography>

      <Box ref={containerRef} sx={{ width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            display: "inline-block",
          }}
        >
          <Tree
            label={
              <Box
                sx={{
                  padding: 1,
                  border: "2px solid #1976d2",
                  borderRadius: 1,
                  backgroundColor: "#90caf9",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                営業部
              </Box>
            }
          >
            {data.map(renderNode)}
          </Tree>
        </Box>
      </Box>
    </Box>
  );
}
