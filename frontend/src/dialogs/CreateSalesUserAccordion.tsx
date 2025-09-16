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

interface CreateSalesUserAccordionProps {
  onCreate: (data: any) => void;
}

export default function CreateSalesUserAccordion({ onCreate }: CreateSalesUserAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [role, setRole] = useState<string>(""); // デフォルト未選択
  const [name, setName] = useState("");
  const [title, setTitle] = useState(""); // 今は役職メニューに統合
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [subManagerId, setSubManagerId] = useState<number | null>(null);
  const [leaderId, setLeaderId] = useState<number | null>(null);

  // 仮データ
  const [departments] = useState([
    { id: 1, name: "第一営業課（PP/BP）" },
    { id: 2, name: "第二営業課（受託）" },
    { id: 3, name: "第三営業課（新規開拓）" },
    { id: 4, name: "営業事務" },
  ]);
  const [teams] = useState([
    { id: 1, name: "SES(PP)" },
    { id: 2, name: "SES(BP)" },
    { id: 3, name: "受託" },
    { id: 4, name: "トップセール" },
    { id: 5, name: "新規開拓" },
  ]);
  const [managers] = useState([
    { id: 1, name: "佐藤 絵里子" },
    { id: 2, name: "宮本 和世士" },
  ]);
  const [subManagers] = useState([
    { id: 1, name: "長谷 健太朗" },
    { id: 2, name: "作本 薫宏" },
  ]);
  const [leaders] = useState([
    { id: 1, name: "柴山 朋希" },
    { id: 2, name: "男澤 純一" },
    { id: 3, name: "津田 秦隆" },
    { id: 4, name: "飯塚 美穂" },
  ]);

  const roleSelected = role !== "";

  // const isDepartmentDisabled = !roleSelected;
  // const isTeamDisabled = !roleSelected || !(role === "sub_manager" || role === "leader" || role === "member");
  // const isManagerDisabled = !roleSelected || !(role === "sub_manager" || role === "leader" || role === "member");
  // const isSubManagerDisabled = !roleSelected || !(role === "leader" || role === "member");
  // const isLeaderDisabled = !roleSelected || role !== "member";

// --- 役職ごとの入力可否 ---
const isDepartmentDisabled =
  !role || !(role === "manager" || role === "sub_manager" || role === "leader" || role === "member-none" || role === "member-sub");

const isTeamDisabled =
  !role || !(role === "sub_manager" || role === "leader" || role === "member-none" || role === "member-sub");

const isManagerDisabled =
  !role || !(role === "sub_manager" || role === "leader" || role === "member-none" || role === "member-sub");

const isSubManagerDisabled =
  !role || !(role === "leader" || role === "member-none" || role === "member-sub");

const isLeaderDisabled =
  !role || !(role === "member-none" || role === "member-sub");


  useEffect(() => {
    if (isDepartmentDisabled) setDepartmentId(null);
    if (isTeamDisabled) setTeamId(null);
    if (isManagerDisabled) setManagerId(null);
    if (isSubManagerDisabled) setSubManagerId(null);
    if (isLeaderDisabled) setLeaderId(null);
    if (role !== "member") setTitle("");
  }, [
    isDepartmentDisabled,
    isTeamDisabled,
    isManagerDisabled,
    isSubManagerDisabled,
    isLeaderDisabled,
    role,
  ]);

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
  // フォーム初期化
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


  // 濃めのグレーアウト
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
        {/* 1段目: 役職・名前 */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
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
            <MenuItem value="member-none">メンバー（なし）</MenuItem>
            <MenuItem value="member-sub">メンバー（副主任）</MenuItem>
          </TextField>

          <TextField
            label="名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={!roleSelected}
          />
        </Box>

        {/* 2段目: 所属系 */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          <TextField
            select
            label="課"
            value={departmentId ?? ""}
            onChange={(e) => setDepartmentId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={isDepartmentDisabled}
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
            disabled={isTeamDisabled}
          >
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        </Box>

        {/* 3段目: 上司系 */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <TextField
            select
            label="課長"
            value={managerId ?? ""}
            onChange={(e) => setManagerId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={isManagerDisabled}
          >
            {managers.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="係長"
            value={subManagerId ?? ""}
            onChange={(e) => setSubManagerId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={isSubManagerDisabled}
          >
            {subManagers.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="主任"
            value={leaderId ?? ""}
            onChange={(e) => setLeaderId(Number(e.target.value))}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
            disabled={isLeaderDisabled}
          >
            {leaders.map((l) => (
              <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="contained" onClick={handleSubmit} disabled={!roleSelected}>
            追加
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
