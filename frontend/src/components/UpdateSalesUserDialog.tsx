import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  MenuItem,
  Box,
  Button,
} from "@mui/material";
import { OrganizationItem } from "../network/getSalesAssignment";

interface UpdateSalesUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: (id: number, role: string) => void;
  selectedItem: OrganizationItem | null;
  organizationData: OrganizationItem[];
}

export default function UpdateSalesUserDialog({
  open,
  onClose,
  onUpdate,
  onDelete,
  selectedItem,
  organizationData,
}: UpdateSalesUserDialogProps) {
  const [role, setRole] = useState<string>("");
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");
  const [managerId, setManagerId] = useState<string>("");
  const [subManagerId, setSubManagerId] = useState<string>("");
  const [leaderId, setLeaderId] = useState<string>("");

  // ノードをIDで検索
  const findNodeById = (items: OrganizationItem[], targetId: number): OrganizationItem | null => {
    for (const item of items) {
      if (item.id === targetId) return item;
      const found = findNodeById(item.children, targetId);
      if (found) return found;
    }
    return null;
  };

  // 祖先を正確に取得
  const findAncestors = (items: OrganizationItem[], targetId: number): OrganizationItem[] => {
    const ancestors: OrganizationItem[] = [];
    function traverse(nodes: OrganizationItem[], currentPath: OrganizationItem[] = []) {
      for (const node of nodes) {
        if (node.id === targetId) {
          ancestors.push(...currentPath);
          return true;
        }
        if (node.children) {
          if (traverse(node.children, [...currentPath, node])) return true;
        }
      }
      return false;
    }
    traverse(organizationData);
    return ancestors;
  };

  // 直属の所属名または社員名を取得
  const findParentName = (items: OrganizationItem[], targetId: number): string => {
    const ancestors = findAncestors(items, targetId);
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const ancestor = ancestors[i];
      if (ancestor.exists && ancestor.name) {
        return ancestor.name;
      }
    }
    return "(不明)"; // フォールバック
  };

  // 初期値設定
  useEffect(() => {
    if (selectedItem) {
      setName(selectedItem.exists ? selectedItem.name : "");
      const roleMap: Record<string, string> = {
        課長: "manager",
        係長: "sub_manager",
        主任: "leader",
        メンバー: "member-none",
        副主任: "member-sub",
      };
      setRole(roleMap[selectedItem.title] || "");

      const ancestors = findAncestors(organizationData, selectedItem.id);
      let deptId = "", tmId = "", mgrId = "", subMgrId = "", ldrId = "";
      
      for (const ancestor of ancestors) {
        if (ancestor.title === "課") deptId = String(ancestor.id);
        else if (ancestor.title === "係") tmId = String(ancestor.id);
        else if (ancestor.title === "課長") mgrId = String(ancestor.id);
        else if (ancestor.title === "係長") subMgrId = String(ancestor.id);
        else if (ancestor.title === "主任") ldrId = String(ancestor.id);
      }

      const parent = ancestors[ancestors.length - 1];
      if (parent) {
        if (parent.title === "課長") mgrId = String(parent.id);
        else if (parent.title === "係長") subMgrId = String(parent.id);
        else if (parent.title === "主任") ldrId = String(parent.id);
        else if (parent.title === "係") tmId = String(parent.id);
        else if (parent.title === "課") deptId = String(parent.id);

        const grandParent = ancestors[ancestors.length - 2];
        if (grandParent) {
          if (grandParent.title === "課" && !deptId) deptId = String(grandParent.id);
          else if (grandParent.title === "課長" && !mgrId) mgrId = String(grandParent.id);
          else if (grandParent.title === "係" && !tmId) tmId = String(grandParent.id);
          else if (grandParent.title === "係長" && !subMgrId) subMgrId = String(grandParent.id);

          const greatGrandParent = ancestors[ancestors.length - 3];
          if (greatGrandParent) {
            if (greatGrandParent.title === "課" && !deptId) deptId = String(greatGrandParent.id);
            else if (greatGrandParent.title === "課長" && !mgrId) mgrId = String(greatGrandParent.id);
          }
        }
      }

      setDepartmentId(deptId);
      setTeamId(tmId);
      setManagerId(mgrId);
      setSubManagerId(subMgrId);
      setLeaderId(ldrId);
    }
  }, [selectedItem, organizationData]);

  // 選択肢取得（exists: falseも含め、exists: trueを先にソート）
  function findItemsByTitle(items: OrganizationItem[], targetTitle: string): OrganizationItem[] {
    let result: OrganizationItem[] = [];
    function traverse(node: OrganizationItem) {
      if (node.title === targetTitle) result.push(node);
      if (node.children) node.children.forEach(traverse);
    }
    items.forEach(traverse);
    // exists: trueを先に、exists: falseを後にソート（id順は維持）
    return result.sort((a, b) => (a.exists === b.exists ? 0 : a.exists ? -1 : 1));
  }

  const departments = findItemsByTitle(organizationData, "課");
  const teams = findItemsByTitle(organizationData, "係");
  const filteredManagers = findItemsByTitle(organizationData, "課長");
  const filteredSubManagers = findItemsByTitle(organizationData, "係長");
  const filteredLeaders = findItemsByTitle(organizationData, "主任");

  const isDepartmentEnabled = role !== "";
  const isTeamEnabled = role === "sub_manager" || role === "leader" || role.startsWith("member");
  const isManagerEnabled = role === "sub_manager" || role === "leader" || role.startsWith("member");
  const isSubManagerEnabled = role === "leader" || role.startsWith("member");
  const isLeaderEnabled = role.startsWith("member");

  useEffect(() => {
    if (!isDepartmentEnabled) setDepartmentId("");
    if (!isTeamEnabled) setTeamId("");
    if (!isManagerEnabled) setManagerId("");
    if (!isSubManagerEnabled) setSubManagerId("");
    if (!isLeaderEnabled) setLeaderId("");
  }, [role]);

  const roleToTitleMap: Record<string, string> = {
    manager: "課長",
    sub_manager: "係長",
    leader: "主任",
    "member-none": "メンバー",
    "member-sub": "副主任",
  };

  const handleUpdate = () => {
    if (!name || !role || !selectedItem?.id) return;
    onUpdate({
      id: selectedItem.id,
      role,
      name,
      title: roleToTitleMap[role] || "",
      department_id: departmentId === "" ? null : Number(departmentId),
      team_id: teamId === "" ? null : Number(teamId),
      manager_id: managerId === "" ? null : Number(managerId),
      sub_manager_id: subManagerId === "" ? null : Number(subManagerId),
      leader_id: leaderId === "" ? null : Number(leaderId),
    });
    setName("");
    setRole("");
    setDepartmentId("");
    setTeamId("");
    setManagerId("");
    setSubManagerId("");
    setLeaderId("");
    onClose();
  };

  const handleDelete = () => {
    if (selectedItem?.id && role) {
      onDelete(selectedItem.id, role);
      onClose();
    }
  };

  const disabledStyle = {
    "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed", color: "#666" },
    "& .MuiInputBase-root.Mui-disabled": { backgroundColor: "#ddd" },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>社員情報の編集</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          1. 社員名を編集してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
          />
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          2. 役職を選択してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            select
            label="役職"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={{ flex: "1 1 200px" }}
          >
            <MenuItem value="">未選択</MenuItem>
            <MenuItem value="manager">課長</MenuItem>
            <MenuItem value="sub_manager">係長</MenuItem>
            <MenuItem value="leader">主任</MenuItem>
            <MenuItem value="member-none">メンバー</MenuItem>
            <MenuItem value="member-sub">メンバー（副主任）</MenuItem>
          </TextField>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          3. 所属部署を選択してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            select
            label="課"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isDepartmentEnabled}
          >
            <MenuItem value="">未選択</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={String(d.id)}>
                {d.name || `課なし（${findParentName(organizationData, d.id)}）`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="係"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isTeamEnabled}
          >
            <MenuItem value="">未選択</MenuItem>
            {teams.map((t) => (
              <MenuItem key={t.id} value={String(t.id)}>
                {t.name || `係なし（${findParentName(organizationData, t.id)}）`}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          4. 直属上司を選択してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            select
            label="課長"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isManagerEnabled}
          >
            <MenuItem value="">未選択</MenuItem>
            {filteredManagers.map((m) => (
              <MenuItem key={m.id} value={String(m.id)}>
                {m.name || `課長なし（${findParentName(organizationData, m.id)}）`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="係長"
            value={subManagerId}
            onChange={(e) => setSubManagerId(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isSubManagerEnabled}
          >
            <MenuItem value="">未選択</MenuItem>
            {filteredSubManagers.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.name || `係長なし（${findParentName(organizationData, s.id)}）`}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="主任"
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isLeaderEnabled}
          >
            <MenuItem value="">未選択</MenuItem>
            {filteredLeaders.map((l) => (
              <MenuItem key={l.id} value={String(l.id)}>
                {l.name || `主任なし（${findParentName(organizationData, l.id)}）`}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={!selectedItem?.id || !role}
        >
          削除
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={!role || !name}
        >
          更新
        </Button>
      </DialogActions>
    </Dialog>
  );
}