import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Box,
  Button,
} from "@mui/material";
import { OrganizationItem } from "../network/getSalesAssignment";

// ========== ダイアログのプロパティ（受け取るデータ） ========== //
interface UpdateSalesSectionDialogProps {
  open: boolean; // ダイアログの開閉状態
  onClose: () => void; // ダイアログを閉じる関数
  onUpdate: (data: { id: number; name: string; title: string }) => void; // 更新ボタンが押された時の関数
  onDelete: (id: number, title: string) => void; // 削除ボタンが押された時の関数
  selectedItem: OrganizationItem | null; // ダブルクリックされたノード（課または係）
}

// ========== メインコンポーネント ========== //
export default function UpdateSalesSectionDialog({
  open,
  onClose,
  onUpdate,
  onDelete,
  selectedItem,
}: UpdateSalesSectionDialogProps) {
  // ========== 状態管理 ========== //
  // - 名前入力フィールドの値を管理
  // - ダブルクリックされたノード（課または係）の名前を初期値に設定
  const [name, setName] = useState("");

  // ========== 初期値を設定 ========== //
  // - ダイアログが開くたびに、選択されたノードの名前を反映
  // - selectedItemが変更されたら、フォームの値を更新
  useEffect(() => {
    if (selectedItem && selectedItem.exists && selectedItem.id !== null) {
      setName(selectedItem.name);
    }
  }, [selectedItem]);

  // ========== 更新ボタンの処理 ========== //
  // - 入力された名前とノードのID、タイトルを親コンポーネントに渡す
  // - フォームをリセットしてダイアログを閉じる
  const handleUpdate = () => {
    if (!name || !selectedItem?.id || !selectedItem?.title) return;
    onUpdate({
      id: selectedItem.id,
      name,
      title: selectedItem.title, // "課" または "係"
    });
    setName("");
    onClose();
  };

  // ========== 削除ボタンの処理 ========== //
  // - ノードのIDとタイトル（課または係）を親コンポーネントに渡す
  // - ダイアログを閉じる
  const handleDelete = () => {
    if (selectedItem?.id && selectedItem?.title) {
      onDelete(selectedItem.id, selectedItem.title);
      onClose();
    }
  };

  // ========== 無効なフィールドのスタイル ========== //
  const disabledStyle = {
    "& .MuiInputBase-input.Mui-disabled": { cursor: "not-allowed", color: "#666" },
    "& .MuiInputBase-root.Mui-disabled": { backgroundColor: "#ddd" },
  };

  // ========== ダイアログの描画 ========== //
  // - 名前入力フィールドのみを提供（課または係の名前を編集）
  // - 更新と削除のボタンを追加
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{selectedItem?.title === "課" ? "課の編集" : "係の編集"}</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          名前を編集してください
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            label={selectedItem?.title === "課" ? "課の名前" : "係の名前"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: "1 1 200px", ...disabledStyle }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={!selectedItem?.id}
        >
          削除
        </Button>
        <Button
          variant="contained"
          onClick={handleUpdate}
          disabled={!name}
        >
          更新
        </Button>
      </DialogActions>
    </Dialog>
  );
}