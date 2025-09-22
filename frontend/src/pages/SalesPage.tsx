// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";
import { getSalesAssignment, OrganizationItem } from "../network/getSalesAssignment";
import { Button } from "@mui/material";
import CreateSalesUserAccordion from "../dialogs/CreateSalesUserAccordion";

// このコンポーネントは、営業部の組織図を表示するメインのページです。
// 組織データをAPIから取得し、ツリー構造で視覚化します。
// 初心者向け: Reactの関数コンポーネントとして定義。状態管理とライフサイクルフックを使って動的な表示を実現します。
export default function SalesPage() {

  // ユーザー追加ダイアログの開閉状態を管理するstate。
  // なぜ必要か: ダイアログを開く/閉じる動作を制御するため。stateが変わるとコンポーネントが再レンダリングされ、UIが更新されます。
  const [dialogOpen, setDialogOpen] = useState(false);

  // ユーザー作成時のハンドラー関数。
  // なぜ必要か: フォームから送信されたデータを処理し、将来的にAPIを呼び出してサーバーにデータを送信するため。ここではログ出力のみですが、拡張可能です。
  const handleCreateUser = async (data: any) => {
    console.log("送信データ", data);
    // TODO: API 呼び出し fetch("/create_sales_user", {...})
  };

  // 組織データを保持するstate。初期値は空配列。
  // なぜ必要か: APIから取得したデータをコンポーネント内で保持し、組織図を描画するために使用。stateを使うことでデータ変更時にUIが自動更新されます。
  const [organizationData, setOrganizationData] = useState<OrganizationItem[]>([]);

  // 組織図のコンテナ要素を参照するためのref。
  // なぜ必要か: DOM要素の幅を測定して縮小率を計算するため。refを使うと、Reactが管理するDOMに直接アクセスできます。
  const containerRef = useRef<HTMLDivElement>(null);

  // 組織図の縮小率を管理するstate。初期値は1（等倍）。
  // なぜ必要か: 組織図が画面幅を超える場合に自動縮小するため。stateが変わるとスタイルが更新され、UIが調整されます。
  const [scale, setScale] = useState(1);

  // APIから組織データを取得するuseEffect。
  // なぜ必要か: コンポーネントがマウントされた時に一度だけデータをフェッチするため。依存配列が空なので初回のみ実行され、無駄な再取得を防ぎます。
  useEffect(() => {
    const fetchData = async () => {
      const data = await getSalesAssignment();
      setOrganizationData(data);
    };
    fetchData();
  }, []);

  // ウィンドウサイズ変更時に縮小率を調整するuseLayoutEffect。
  // なぜ必要か: 描画後にDOMサイズを測定して組織図を画面に収めるため。useLayoutEffectは同期的に実行され、ちらつきを防ぎます。組織データ変更時やリサイズ時に再計算。
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const parentWidth = containerRef.current.offsetWidth;
      const scrollWidth = containerRef.current.scrollWidth;

      if (scrollWidth > parentWidth) {
        setScale(parentWidth / scrollWidth);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [organizationData]);

  // 組織アイテムのボックススタイルを返す関数。
  // なぜ必要か: 役職ごとに背景色を変えて視覚的に区別するため。スタイルオブジェクトを返すことで、MUIのsxプロパティに適用しやすくなります。
  const getBoxStyle = (item: OrganizationItem) => {
    let bgColor = "#e3f2fd";

    if (item.title === "副主任") {
      bgColor = "#e3f2fd";
    } else if (item.title === "メンバー") {
      bgColor = "#e3f2fd";
    } else {
      bgColor = "#bbdefb";
    }

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

  // メンバーリストを縦に並べて描画する関数。
  // なぜ必要か: 複数のメンバーをコンパクトに表示するため。Boxコンポーネントを使って縦並びを実現し、各メンバーを個別のボックスで区切ります。
  const renderMembers = (members: OrganizationItem[]) => {
    return (
      <Box
        sx={{
          fontSize: "0.7rem",
          marginTop: 0.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {members.map((member) => (
          <Box
            key={member.id}
            sx={{
              backgroundColor:
                member.title === "副主任" ? "#e3f2fd" : "#e3f2fd",
              borderRadius: 0.5,
              padding: "1px 4px",
            }}
          >
            {member.title ? `${member.title} ${member.name}` : member.name}
          </Box>
        ))}
      </Box>
    );
  };

  // 組織アイテムを再帰的に描画する関数。ツリー構造を構築します。
  // なぜ必要か: 組織の階層（課、係、主任、メンバー）をツリーとして視覚化するため。再帰呼び出しで深い階層も扱え、react-organizational-chartのTreeNodeを使います。
  const renderOrganizationItem = (item: OrganizationItem) => {
    // 子要素からメンバーと副主任を抽出。
    // なぜ必要か: メンバーを特別扱い（縦並び表示）するため。フィルターで分類し、後で描画に使います。
    const members = item.children.filter(
      (child) => child.title === "メンバー" || child.title === "副主任"
    );
    // 子要素から下位組織（主任や係など）を抽出。
    // なぜ必要か: 再帰的に下位階層を描画するため。メンバー以外を分離します。
    const subOrganizations = item.children.filter(
      (child) => child.title !== "メンバー" && child.title !== "副主任"
    );

    // 下位組織から主任を抽出。
    // なぜ必要か: 主任をグループ化して表示するため（複数いる場合点線枠でまとめる）。
    const shunins = subOrganizations.filter((child) => child.title === "主任");
    // 主任以外の下位組織を抽出。
    // なぜ必要か: 主任とそれ以外を分けて処理するため。柔軟なレイアウトを実現します。
    const others = subOrganizations.filter((child) => child.title !== "主任");

    // 現在のアイテムのラベル（ボックス）を作成。
    // なぜ必要か: TreeNodeのlabelとして使用。名前とメンバーを含めて表示します。
    const label = (
      <Box sx={getBoxStyle(item)}>
        {item.title ? `${item.title} ${item.name}` : item.name}
        {item.title !== "係" && members.length > 0 && renderMembers(members)}
      </Box>
    );

    // 末端ノードの場合の処理。
    // なぜ必要か: 不要な線を防ぎ、シンプルに表示するため。子がいない場合に子ノードを追加しない。
    if (shunins.length === 0 && others.length === 0) {
      if (item.title === "係" && members.length > 0) {
        return (
          <TreeNode key={item.id} label={label}>
            <TreeNode
              label={
                <Box sx={getBoxStyle({ ...item, name: "", title: "" })}>
                  {renderMembers(members)}
                </Box>
              }
            />
          </TreeNode>
        );
      }
      return <TreeNode key={item.id} label={label} />;
    }

    // 下位組織がある場合のツリーノード。
    // なぜ必要か: 階層構造を構築するため。主任をグループ化し、再帰で下位を描画します。
    return (
      <TreeNode key={item.id} label={label}>
        {shunins.length > 1 ? (
          <TreeNode
            label={
              <Box
                sx={{
                  border: "2px dashed #1976d2",
                  borderRadius: 1,
                  padding: 1,
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(shunins.length, 3)}, 1fr)`,
                  gap: 1,
                }}
              >
                {shunins.map((shunin) => (
                  <Box key={shunin.id} sx={getBoxStyle(shunin)}>
                    {shunin.title} {shunin.name}
                    {shunin.children.length > 0 && renderMembers(shunin.children)}
                  </Box>
                ))}
              </Box>
            }
          />
        ) : (
          shunins.map((shunin) => renderOrganizationItem(shunin))
        )}
        {others.map((sub) => renderOrganizationItem(sub))}
      </TreeNode>
    );
  };

  // JSXで画面を描画。
  // なぜ必要か: Reactのreturn文でUIを定義。タイトル、ユーザー追加フォーム、組織図を表示します。
  return (
    <Box sx={{ padding: 2, overflow: "hidden" }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        営業部 組織図
      </Typography>

      <Box sx={{ mb: 4 }}>
        <CreateSalesUserAccordion onCreate={handleCreateUser} organizationData={organizationData}/>
      </Box>

      <Box ref={containerRef} sx={{ width: "100%", overflowX: "auto", overflowY: "hidden" }}>
        <Box
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            display: "inline-block",
            minWidth: "100%",
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
            {organizationData.map((department) =>
              renderOrganizationItem(department)
            )}
          </Tree>
        </Box>
      </Box>
    </Box>
  );
}