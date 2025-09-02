// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";
import { Section, Employee, get_sales_assignment } from "../network/getSalesAssignment";

export default function SalesPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        get_sales_assignment().then(setSections);
    }, []);

    // 横幅に収めるために scale を計算
    useLayoutEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parentWidth = containerRef.current.offsetWidth;
                const scrollWidth = containerRef.current.scrollWidth;
                if (scrollWidth > parentWidth) {
                    setScale(parentWidth / scrollWidth);
                } else {
                    setScale(1);
                }
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [sections]);

    const boxStyle = {
        padding: 1,
        border: "1px solid #1976d2",
        borderRadius: 1,
        backgroundColor: "#e3f2fd",
        textAlign: "center" as const,
        whiteSpace: "nowrap" as const,
        overflowWrap: "anywhere" as const,
        fontSize: "0.75rem",
    };

    const renderEmployee = (employee: Employee) => {
        // 子がいない & メンバーがいる場合（最終階層）
        if (employee.children.length === 0 && employee.employees.length > 0) {
            return (
                <TreeNode
                    key={employee.employee_id}
                    label={
                        <Box sx={boxStyle}>
                            {employee.position} {employee.employee_name}
                            <Box sx={{ marginTop: 1 }}>
                                {employee.employees.map((mem) => (
                                    <Box
                                        key={mem.employee_id}
                                        sx={{
                                            ...boxStyle,
                                            padding: 0.5,
                                            marginTop: 0.5,
                                        }}
                                    >
                                        {mem.position} {mem.employee_name}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    }
                />
            );
        }

        // 子が主任のみの場合 → 主任群を作る
        const leaders = employee.children.filter((c) => c.role === "リーダー");
        const others = employee.children.filter((c) => c.role !== "リーダー");

        return (
            <TreeNode
                key={employee.employee_id}
                label={<Box sx={boxStyle}>{employee.position} {employee.employee_name}</Box>}
            >
                {/* その他の子（サブマネ等） */}
                {others.map(renderEmployee)}


                {/* 主任群 */}
                {/* フレックスで何列にも対応できる */}
                {leaders.length > 0 && (
                    <TreeNode
                        key={`${employee.employee_id}-leader-group`}
                        label={
                            <Box
                                sx={{
                                    ...boxStyle,
                                    display: "flex",                // grid → flex
                                    flexWrap: "wrap",               // 複数列に折り返す
                                    gap: 2,
                                    padding: 2,
                                    backgroundColor: "#c8e6c9",
                                    justifyContent: "space-between", // 横幅いっぱいに広げる
                                }}
                            >
                                {leaders.map((leader) => (
                                    <Box
                                        key={leader.employee_id}
                                        sx={{
                                            ...boxStyle,
                                            flex: "1 1 10%",   // 画面幅に応じて自動調整、最大3列
                                            minWidth: 120,     // 最小幅
                                            marginBottom: 2,   // 折り返し時の間隔
                                            padding: 1.5,
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        {leader.position} {leader.employee_name}
                                        <Box sx={{ marginTop: 0.5 }}>
                                            {leader.employees.map((mem) => (
                                                <Box key={mem.employee_id} sx={{ ...boxStyle, padding: 0.5, marginTop: 0.5 }}>
                                                    {mem.position} {mem.employee_name}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        }
                    />
                )}
            </TreeNode>
        );
    };



    const renderSection = (section: Section) => (
        <TreeNode
            key={section.section_id}
            label={
                <Box
                    sx={{
                        padding: 1,
                        border: "2px solid #1976d2",
                        borderRadius: 1,
                        backgroundColor: "#bbdefb",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                    }}
                >
                    📂 {section.section_name}
                </Box>
            }
        >
            {/* まず課長（section.employees）を描画 */}
            {section.employees.map(renderEmployee)}

            {/* その下に係（section.children）を描画 */}
            {section.children.map(renderSection)}
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
                        {sections.map(renderSection)}
                    </Tree>
                </Box>
            </Box>
        </Box>
    );
}

