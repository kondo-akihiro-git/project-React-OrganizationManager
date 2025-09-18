// frontend/src/dialogs/CreateSalesUserAccordion.tsx
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  MenuItem,
  Box,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { OrganizationItem } from "../network/getSalesAssignment";

interface CreateSalesUserAccordionProps {
  onCreate: (data: any) => void;
  organizationData: OrganizationItem[];
}

export default function CreateSalesUserAccordion({
  onCreate,
  organizationData,
}: CreateSalesUserAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState<string>("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [subManagerId, setSubManagerId] = useState<number | null>(null);
  const [leaderId, setLeaderId] = useState<number | null>(null);

  // --- title ベースで全件フィルタ（ネスト関係は考慮しない） ---
  function findItemsByTitle(items: OrganizationItem[], targetTitle: string): OrganizationItem[] {
    let result: OrganizationItem[] = [];
    function traverse(node: OrganizationItem) {
      if (node.title === targetTitle) result.push(node);
      if (node.children) node.children.forEach(traverse);
    }
    items.forEach(traverse);
    return result;
  }

  const departments = findItemsByTitle(organizationData, "課");
  const teams = findItemsByTitle(organizationData, "係");
  const filteredManagers = findItemsByTitle(organizationData, "課長");
  const filteredSubManagers = findItemsByTitle(organizationData, "係長");
  const filteredLeaders = findItemsByTitle(organizationData, "主任");

  // --- 役職ごとの入力可否 ---
  const isDepartmentEnabled = role !== "";
  const isTeamEnabled =
    role === "sub_manager" || role === "leader" || role === "member-none" || role === "member-sub";
  const isManagerEnabled = role === "sub_manager" || role === "leader" || role.startsWith("member");
  const isSubManagerEnabled = role === "leader" || role.startsWith("member");
  const isLeaderEnabled = role.startsWith("member");

  // roleが変わったら不要な入力はクリア
  useEffect(() => {
    if (!isDepartmentEnabled) setDepartmentId(null);
    if (!isTeamEnabled) setTeamId(null);
    if (!isManagerEnabled) setManagerId(null);
    if (!isSubManagerEnabled) setSubManagerId(null);
    if (!isLeaderEnabled) setLeaderId(null);
  }, [role]);

  const roleToTitleMap: Record<string, string> = {
    manager: "課長",
    sub_manager: "係長",
    leader: "主任",
    "member-none": "メンバー",
    "member-sub": "副主任",
  };

  const handleSubmit = () => {
    if (!name || !role) return;
    onCreate({
      role,
      name,
      title: roleToTitleMap[role] || "",
      department_id: departmentId,
      team_id: teamId,
      manager_id: managerId,
      sub_manager_id: subManagerId,
      leader_id: leaderId,
    });
    setName("");
    setRole("");
    setTitle("");
    setDepartmentId(null);
    setTeamId(null);
    setManagerId(null);
    setSubManagerId(null);
    setLeaderId(null);
    setExpanded(false);
  };

  const disabledStyle = {
    "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed", color: "#666" },
    "& .MuiInputBase-root.Mui-disabled": { backgroundColor: "#ddd" },
  };

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>営業メンバー追加</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {/* 1. メンバー名 */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          1. 追加するメンバー名を入力してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
          />
        </Box>

        {/* 2. 役職 */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          2. 追加するメンバーの役職を入力してください
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

        {/* 3. 所属部署 */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          3. 所属部署を選択してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            select
            label="課"
            value={departmentId ?? ""}
            onChange={(e) => setDepartmentId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isDepartmentEnabled}
          >
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="係"
            value={teamId ?? ""}
            onChange={(e) => setTeamId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isTeamEnabled}
          >
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        </Box>

        {/* 4. 直属上司 */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          4. 直属上司を選択してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            select
            label="課長"
            value={managerId ?? ""}
            onChange={(e) => setManagerId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isManagerEnabled}
          >
            {filteredManagers.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="係長"
            value={subManagerId ?? ""}
            onChange={(e) => setSubManagerId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isSubManagerEnabled}
          >
            {filteredSubManagers.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="主任"
            value={leaderId ?? ""}
            onChange={(e) => setLeaderId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!isLeaderEnabled}
          >
            {filteredLeaders.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={handleSubmit} disabled={!role}>
            追加
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
