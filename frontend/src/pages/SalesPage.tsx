// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";

// ==========================
// API の URL
// ==========================
// ここではローカルの FastAPI サーバーからデータを取る想定です。
// もしサーバーのポート番号やエンドポイントが違えば書き換えてください。
const API_URL = "http://localhost:8000";

// ==========================
// データの型定義（OrganizationItem）
// ==========================
// API から返ってくる「組織の1つの要素」を表す型です。
// 「課」や「主任」や「メンバー」などがすべてこの形で表現されます。
type OrganizationItem = {
  id: number;                  // 識別用のID
  name: string;                // 名前（例: 山田太郎, 第1課）
  title?: string;              // 役職（例: 主任、副主任、メンバー）
  children: OrganizationItem[]; // 子要素（例: 課の中のチーム、主任の下のメンバー）
};

// ==========================
// メインの画面コンポーネント
// ==========================
export default function SalesPage() {
  // --------------------------
  // state（アプリ内の変数のようなもの）
  // --------------------------
  // 組織データ（最初は空の配列）
  const [organizationData, setOrganizationData] = useState<OrganizationItem[]>([]);

  // 画面の幅を計算するために「どこの領域に表示するか」を覚えておく
  const containerRef = useRef<HTMLDivElement>(null);

  // 縮小率（scale）。画面に収まらないときに自動で縮めます。
  const [scale, setScale] = useState(1);

  // --------------------------
  // APIからデータを取得する処理
  // --------------------------
  // useEffect は「最初に画面を表示するときに1回だけ実行する」処理を置く場所です。
  useEffect(() => {
    // 非同期関数（async function）でデータを取りにいく
    const fetchData = async () => {
      const response = await fetch(`${API_URL}/sales_assignment`); // API呼び出し
      const json = await response.json(); // JSONに変換
      setOrganizationData(json);          // stateに保存 → これで画面が更新される
    };
    fetchData();
  }, []); // ← [] が「初回だけ実行」を意味します

  // --------------------------
  // 画面サイズに応じた縮小処理
  // --------------------------
  // useLayoutEffect は「描画後にサイズを見て調整したい」ときに使います。
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return; // DOMがまだなければ何もしない

      const parentWidth = containerRef.current.offsetWidth;  // 親要素の幅
      const scrollWidth = containerRef.current.scrollWidth;  // 中身の幅（実際のサイズ）

      // 中身がはみ出していたら縮小する
      if (scrollWidth > parentWidth) {
        setScale(parentWidth / scrollWidth); // 割合を計算
      } else {
        setScale(1); // はみ出してなければそのまま
      }
    };

    handleResize(); // 最初に1回実行
    window.addEventListener("resize", handleResize); // ウィンドウがリサイズされたら実行
    return () => window.removeEventListener("resize", handleResize); // 後始末
  }, [organizationData]); // 組織データが変わったら再計算

  // --------------------------
  // ボックスの見た目（役職ごとに色分け）
  // --------------------------
  const getBoxStyle = (item: OrganizationItem) => {
    // デフォルトは薄い青
    let bgColor = "#e3f2fd";

    if (item.title === "副主任") {
      bgColor = "#c8e6c9"; // 副主任 → 緑
    } else if (item.title === "メンバー") {
      bgColor = "#e3f2fd"; // メンバー → 薄い青
    } else {
      bgColor = "#bbdefb"; // 課や主任など → 濃いめの青
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

  // --------------------------
  // メンバーリストを縦に並べる
  // --------------------------
  const renderMembers = (members: OrganizationItem[]) => {
    return (
      <Box
        sx={{
          fontSize: "0.7rem",
          marginTop: 0.5,
          display: "flex",
          flexDirection: "column", // 縦並び
          gap: 0.5, // 行間
        }}
      >
        {members.map((member) => (
          <Box
            key={member.id}
            sx={{
              backgroundColor:
                member.title === "副主任" ? "#c8e6c9" : "#e3f2fd",
              borderRadius: 0.5,
              padding: "1px 4px",
            }}
          >
            {/* 名前の前に役職があれば付ける */}
            {member.title ? `${member.title} ${member.name}` : member.name}
          </Box>
        ))}
      </Box>
    );
  };

    // --------------------------
  // 課・主任・チームなどの組織を描画する関数
  // --------------------------
  // ここが「木構造（ツリー構造）」を画面に変換する一番大事な部分です。
  // 難しく見えるかもしれませんが、やっていることはシンプルに
  // 1. 自分自身のボックスを作る
  // 2. メンバーを下に並べる
  // 3. 子供の課やチームがあれば、また同じように描画する
  // この3つだけです！
  const renderOrganizationItem = (item: OrganizationItem) => {
    // -------------------------------------------------
    // ステップ1: 子供の中から「メンバーと副主任」だけを取り出す
    // -------------------------------------------------
    // item.children の中には「課」「主任」「メンバー」などいろいろ入っているので、
    // その中から「メンバー」または「副主任」だけを選びます。
    const members = item.children.filter((child) => {
      return child.title === "メンバー" || child.title === "副主任";
    });

    // -------------------------------------------------
    // ステップ2: 子供の中から「課やチームなど（メンバー以外）」を取り出す
    // -------------------------------------------------
    // 「課」や「チーム」や「主任」などはここに分類されます。
    const subOrganizations = item.children.filter((child) => {
      return child.title !== "メンバー" && child.title !== "副主任";
    });

    // -------------------------------------------------
    // ステップ3: 自分自身の見た目（ボックス）を作る
    // -------------------------------------------------
    // 役職（title）があれば「主任 山田太郎」のように役職＋名前を表示。
    // なければ「第1課」のように名前だけを表示します。
    const label = (
      <Box sx={getBoxStyle(item)}>
        {/* 自分自身の肩書きと名前 */}
        {item.title ? `${item.title} ${item.name}` : item.name}

        {/* メンバーがいたらその下に表示する */}
        {members.length > 0 && renderMembers(members)}
      </Box>
    );

    // -------------------------------------------------
    // ステップ4: TreeNode に変換する
    // -------------------------------------------------
    // react-organizational-chart の TreeNode を使って
    // 「自分自身のボックス（label）」をラベルにして、
    // さらに子供の subOrganizations を map で同じ処理にかけます。
    //
    // ポイント: ここで再び renderOrganizationItem(sub) を呼んでいるので、
    //            子供の課やチームも「同じ手順」で描画されます。
    //            つまり入れ子構造が自然に作られます。
    return (
      <TreeNode key={item.id} label={label}>
        {/* 子供の課やチームをひとつずつ処理する */}
        {subOrganizations.map((sub) => {
          return renderOrganizationItem(sub);
        })}
      </TreeNode>
    );
  };


  // --------------------------
  // 実際の画面描画
  // --------------------------
  return (
    <Box sx={{ padding: 2, overflow: "hidden" }}>
      {/* タイトル */}
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        営業部 組織図
      </Typography>

      {/* 縮小用の枠 */}
      <Box ref={containerRef} sx={{ width: "100%", overflow: "hidden" }}>
        <Box
          sx={{
            transform: `scale(${scale})`,       // 縮小率を適用
            transformOrigin: "top left",        // 左上基準で縮小
            display: "inline-block",            // はみ出さないように
          }}
        >
          {/* 営業部（最上位のボックス） */}
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
            {/* 最上位の課を並べる */}
            {organizationData.map((department) =>
              renderOrganizationItem(department)
            )}
          </Tree>
        </Box>
      </Box>
    </Box>
  );
}
