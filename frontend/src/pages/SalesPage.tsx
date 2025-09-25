// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { Tree, TreeNode } from "react-organizational-chart";
import { getSalesAssignment, OrganizationItem } from "../network/getSalesAssignment";
import CreateSalesUserAccordion from "../components/CreateSalesUserAccordion";
import UpdateSalesUserDialog from "../components/UpdateSalesUserDialog";
import { createSalesAssignment } from "../network/createSalesAssignment";

// SalesPage: 営業部の組織図を表示し、メンバー追加機能を提供
export default function SalesPage() {
  const [data, setData] = useState<OrganizationItem[]>([]);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrganizationItem | null>(null);

  // データ取得
  useEffect(() => {
    getSalesAssignment().then(setData);
  }, []);

  // 画面サイズに合わせて縮小率を調整
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth;
        const scrollWidth = containerRef.current.scrollWidth;
        setScale(scrollWidth > parentWidth ? parentWidth / scrollWidth : 1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  const getBoxStyle = (item: OrganizationItem) => ({
    padding: 1,
    border: "1px solid #1976d2",
    borderRadius: 1,
    backgroundColor:
      item.title === "課" || item.title === "係"
        ? "#d3d3d3" // 課と係はグレー
        : item.title === "メンバー" || item.title === "副主任"
        ? "#e3f2fd" // メンバーと副主任
        : "#bbdefb", // 課長、係長、主任
    textAlign: "center" as const,
    fontSize: "0.75rem",
  });

  const getTextColor = (item: OrganizationItem) => ({
    color: item.exists === false && ["課長", "係", "係長", "主任"].includes(item.title) ? "#757575" : "#000000",
  });

  const getRootBoxStyle = () => ({
    padding: 1,
    border: "1px solid #1976d2",
    borderRadius: 1,
    backgroundColor: "#d3d3d3",
    textAlign: "center" as const,
  });

  const getLeadersGridStyle = (count: number) => ({
    border: "2px dashed #1976d2",
    borderRadius: 1,
    padding: 1,
    display: "grid",
    gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`,
    gap: 1,
  });

  const renderMembers = (members: OrganizationItem[]) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
      {members.map((member) => (
        <Box
          key={member.id}
          sx={{ ...getBoxStyle(member), ...getTextColor(member), padding: "2px 4px" }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSelectedItem(member);
            setDialogOpen(true);
          }}
        >
          {member.name}
        </Box>
      ))}
    </Box>
  );

  const renderItem = (item: OrganizationItem) => {
    const members = item.children.filter((child) => child.title === "メンバー" || child.title === "副主任");
    const subItems = item.children.filter((child) => child.title !== "メンバー" && child.title !== "副主任");
    const leaders = subItems.filter((child) => child.title === "主任");
    const nonLeaders = subItems.filter((child) => child.title !== "主任");

    const labelText =
      item.exists === false && ["課長", "係", "係長", "主任"].includes(item.title)
        ? `${item.title}なし`
        : ["課長", "係長", "主任"].includes(item.title)
        ? `${item.title} ${item.name}`
        : item.name;

    const label = (
      <Box
        sx={{ ...getBoxStyle(item), ...getTextColor(item) }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // 課と係のダブルクリックは無効化
          if (item.title !== "課" && item.title !== "係") {
            setSelectedItem(item);
            setDialogOpen(true);
          }
        }}
      >
        {labelText}
        {item.title !== "係" && members.length > 0 && renderMembers(members)}
      </Box>
    );

    if (!leaders.length && !nonLeaders.length) {
      return item.title === "係" && members.length > 0 ? (
        <TreeNode key={item.id} label={label}>
          <TreeNode label={<Box sx={{ ...getBoxStyle(item), ...getTextColor(item) }}>{renderMembers(members)}</Box>} />
        </TreeNode>
      ) : (
        <TreeNode key={item.id} label={label} />
      );
    }

    return (
      <TreeNode key={item.id} label={label}>
        {leaders.length > 1 ? (
          <TreeNode
            label={
              <Box sx={getLeadersGridStyle(leaders.length)}>
                {leaders.map((leader) => (
                  <Box
                    key={leader.id}
                    sx={{ ...getBoxStyle(leader), ...getTextColor(leader) }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(leader);
                      setDialogOpen(true);
                    }}
                  >
                    {leader.title} {leader.name}
                    {renderMembers(leader.children)}
                  </Box>
                ))}
              </Box>
            }
          />
        ) : (
          leaders.map(renderItem)
        )}
        {nonLeaders.map(renderItem)}
      </TreeNode>
    );
  };

const handleCreate = async (formData: any) => {
  try {
    const result = formData
    // const result = await createSalesAssignment(formData);
    console.log("Created:", result);
    // 再取得して組織図をリフレッシュ
    const updated = await getSalesAssignment();
    setData(updated);
  } catch (error) {
    alert("作成に失敗しました");
  }
};

  const handleUpdate = (formData: any) => {
    console.log("Updated member data:", formData);
  };

  const handleDelete = (id: number, role: string) => {
    console.log(`Delete member: id=${id}, role=${role}`);
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        営業部 組織図
      </Typography>
      <Box sx={{ mt: 2, mb: 2 }}>
        <CreateSalesUserAccordion onCreate={handleCreate} organizationData={data} />
      </Box>
      <Box ref={containerRef} sx={{ overflowX: "auto" }}>
        <Box sx={{ transform: `scale(${scale})`, transformOrigin: "top left", minWidth: "100%" }}>
          <Tree label={<Box sx={getRootBoxStyle()}>営業部</Box>}>
            {data.map(renderItem)}
          </Tree>
        </Box>
      </Box>
      <UpdateSalesUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        selectedItem={selectedItem}
        organizationData={data}
      />
    </Box>
  );
}