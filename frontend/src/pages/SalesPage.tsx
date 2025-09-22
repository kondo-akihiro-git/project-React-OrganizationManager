// ========== 必要なものをインポート ========== //
// - Reactの機能（状態管理やDOM参照）とMUIコンポーネント（Box, Typography）を使う
// - react-organizational-chartでツリー構造を描画
// - APIからデータを取得するための関数と型をインポート
import { useEffect, useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { Tree, TreeNode } from "react-organizational-chart";
import { getSalesAssignment, OrganizationItem } from "../network/getSalesAssignment";

// ========== メインのコンポーネント ========== //
// SalesPage: 営業部の組織図を表示する画面
export default function SalesPage() {
  // ========== 状態と参照の定義 ========== //
  // - data: APIから取得した組織データを保持（初期値は空配列）
  // - scale: 組織図の拡大/縮小率（初期値は1で等倍）
  // - containerRef: 組織図の幅を測定するための参照
  const [data, setData] = useState<OrganizationItem[]>([]);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // ========== データ取得 ========== //
  // - ページが読み込まれた時にAPIから組織データを取得
  // - useEffectで初回のみ実行（依存配列[]で再実行を防止）
  useEffect(() => {
    getSalesAssignment().then(setData);
  }, []);

  // ========== 画面サイズに合わせて縮小率を調整 ========== //
  // - 組織図が画面に収まらない場合、自動で縮小して全体が見えるようにする
  // - containerRefで組織図のコンテナの幅を測定
  // - 画面幅より組織図が大きければ、縮小率（scale）を計算して適用
  // - ウィンドウサイズが変わるたびに再計算
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth; // 画面の幅
        const scrollWidth = containerRef.current.scrollWidth; // 組織図の幅
        setScale(scrollWidth > parentWidth ? parentWidth / scrollWidth : 1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  // ========== ボックスのスタイルを定義する関数 ========== //
  // - 組織図の各ボックス（課、課長など）の見た目を定義
  // - 役職が「メンバー」や「副主任」なら薄い青、それ以外は濃い青の背景
  // - 枠線、角丸、文字サイズなどを設定
  const getBoxStyle = (item: OrganizationItem) => ({
    padding: 1,
    border: "1px solid #1976d2",
    borderRadius: 1,
    backgroundColor: item.title === "メンバー" || item.title === "副主任" ? "#e3f2fd" : "#bbdefb",
    textAlign: "center" as const,
    fontSize: "0.75rem",
  });

  // ========== テキストカラーを定義する関数 ========== //
  // - 存在しない役職（課長、係、係長、主任でexists: false）はグレー文字
  // - それ以外（メンバー、副主任、存在する役職）は黒文字
  const getTextColor = (item: OrganizationItem) => ({
    color: item.exists === false && ["課長", "係", "係長", "主任"].includes(item.title) ? "#757575" : "#000000",
  });

  // ========== ルート（営業部）のスタイルを定義する関数 ========== //
  // - 組織図のトップ（「営業部」）のボックススタイルを定義
  // - 他のボックスと異なる濃い青の背景と太い枠線
  const getRootBoxStyle = () => ({
    padding: 1,
    border: "2px solid #1976d2",
    borderRadius: 1,
    backgroundColor: "#90caf9",
    textAlign: "center" as const,
  });

  // ========== 複数リーダーのグリッドスタイルを定義する関数 ========== //
  // - 主任が複数いる場合、点線枠でまとめてグリッド表示するスタイル
  // - 最大3列のグリッドで、主任のボックスを並べる
  const getLeadersGridStyle = (count: number) => ({
    border: "2px dashed #1976d2",
    borderRadius: 1,
    padding: 1,
    display: "grid",
    gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`,
    gap: 1,
  });

  // ========== メンバーと副主任を縦に並べて表示する関数 ========== //
  // - メンバーや副主任を縦に並べて表示（主任の下など）
  // - 各メンバーを小さなボックスで表示、名前のみ表示（役職は非表示）
  // - メンバーと副主任は常に黒文字で表示
  const renderMembers = (members: OrganizationItem[]) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
      {members.map((member) => (
        <Box key={member.id} sx={{ ...getBoxStyle(member), ...getTextColor(member), padding: "2px 4px" }}>
          {member.name}
        </Box>
      ))}
    </Box>
  );

  // ========== 組織図の各アイテムを描画する関数 ========== //
  // - 組織の階層（課、課長、係など）を再帰的にツリー構造で描画
  const renderItem = (item: OrganizationItem) => {
    // - 子要素を「メンバー/副主任」と「それ以外」に分ける
    // - members: メンバーと副主任（縦に並べて表示）
    // - subItems: メンバーと副主任以外（課長、係、主任など）
    // - leaders: 主任のみ抽出
    // - nonLeaders: 主任以外（課長、係など）
    const members = item.children.filter((child) => child.title === "メンバー" || child.title === "副主任");
    const subItems = item.children.filter((child) => child.title !== "メンバー" && child.title !== "副主任");
    const leaders = subItems.filter((child) => child.title === "主任");
    const nonLeaders = subItems.filter((child) => child.title !== "主任");

    // - 現在のアイテムのボックスを作成
    // - 課長、係、係長、主任で存在しない場合（exists: false）は「〜なし」を表示
    // - 課長、係長、主任の場合のみ役職を表示
    // - メンバーがいれば縦に並べて表示（係の場合は除く）
    // - 存在しない場合はグレー文字、存在する場合は黒文字
    const labelText =
      item.exists === false && ["課長", "係", "係長", "主任"].includes(item.title)
        ? `${item.title}なし`
        : ["課長", "係長", "主任"].includes(item.title)
        ? `${item.title} ${item.name}`
        : item.name;

    const label = (
      <Box sx={{ ...getBoxStyle(item), ...getTextColor(item) }}>
        {labelText}
        {item.title !== "係" && members.length > 0 && renderMembers(members)}
      </Box>
    );

    // - 子要素がない場合の描画
    // - 係でメンバーがいる場合、メンバーを別ノードで表示
    // - それ以外は単純なノードとして表示
    if (!leaders.length && !nonLeaders.length) {
      return item.title === "係" && members.length > 0 ? (
        <TreeNode key={item.id} label={label}>
          <TreeNode label={<Box sx={{ ...getBoxStyle(item), ...getTextColor(item) }}>{renderMembers(members)}</Box>} />
        </TreeNode>
      ) : (
        <TreeNode key={item.id} label={label} />
      );
    }

    // - 子要素がある場合の描画
    // - 主任が複数なら点線枠でグリッド表示
    // - 主任が1人なら通常のツリー表示
    // - nonLeaders（課長や係など）を再帰的に描画
    return (
      <TreeNode key={item.id} label={label}>
        {leaders.length > 1 ? (
          <TreeNode
            label={
              <Box sx={getLeadersGridStyle(leaders.length)}>
                {leaders.map((leader) => (
                  <Box key={leader.id} sx={{ ...getBoxStyle(leader), ...getTextColor(leader) }}>
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

  // ========== 画面全体の描画 ========== //
  // - タイトル「営業部 組織図」を表示
  // - 組織図をスケール調整して表示
  // - ルートノード（営業部）からツリーを描画
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        営業部 組織図
      </Typography>
      <Box ref={containerRef} sx={{ overflowX: "auto" }}>
        <Box sx={{ transform: `scale(${scale})`, transformOrigin: "top left", minWidth: "100%" }}>
          <Tree label={<Box sx={getRootBoxStyle()}>営業部</Box>}>
            {data.map(renderItem)}
          </Tree>
        </Box>
      </Box>
    </Box>
  );
}