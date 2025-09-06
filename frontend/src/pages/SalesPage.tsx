// frontend/src/pages/SalesPage.tsx
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Tree, TreeNode } from "react-organizational-chart";
import { getSalesAssignment, OrganizationItem } from "../network/getSalesAssignment";

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
  // APIからデータを取得
  // --------------------------
  useEffect(() => {
    const fetchData = async () => {
      const data = await getSalesAssignment();
      setOrganizationData(data);
    };
    fetchData();
  }, []);


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
      bgColor = "#e3f2fd"; // 副主任 → 緑
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
                member.title === "副主任" ? "#e3f2fd" : "#e3f2fd",
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
// 再帰をやめた「冗長な」組織描画
// --------------------------
// const renderOrganizationItem = (item: OrganizationItem) => {
//   // メンバー or 副主任を描画
//   const members = item.children.filter(
//     (c) => c.title === "メンバー" || c.title === "副主任"
//   );
//   const subOrgs1 = item.children.filter(
//     (c) => c.title !== "メンバー" && c.title !== "副主任"
//   );

//   const label1 = (
//     <Box sx={getBoxStyle(item)}>
//       {item.title ? `${item.title} ${item.name}` : item.name}
//       {members.length > 0 && renderMembers(members)}
//     </Box>
//   );

//   return (
//     <TreeNode key={item.id} label={label1}>
//       {subOrgs1.map((child1) => {
//         // ---- 第2階層 ----
//         const members1 = child1.children.filter(
//           (c) => c.title === "メンバー" || c.title === "副主任"
//         );
//         const subOrgs2 = child1.children.filter(
//           (c) => c.title !== "メンバー" && c.title !== "副主任"
//         );

//         const label2 = (
//           <Box sx={getBoxStyle(child1)}>
//             {child1.title ? `${child1.title} ${child1.name}` : child1.name}
//             {members1.length > 0 && renderMembers(members1)}
//           </Box>
//         );

//         return (
//           <TreeNode key={child1.id} label={label2}>
//             {subOrgs2.map((child2) => {
//               // ---- 第3階層 ----
//               const members2 = child2.children.filter(
//                 (c) => c.title === "メンバー" || c.title === "副主任"
//               );
//               const subOrgs3 = child2.children.filter(
//                 (c) => c.title !== "メンバー" && c.title !== "副主任"
//               );

//               const label3 = (
//                 <Box sx={getBoxStyle(child2)}>
//                   {child2.title ? `${child2.title} ${child2.name}` : child2.name}
//                   {members2.length > 0 && renderMembers(members2)}
//                 </Box>
//               );

//               return (
//                 <TreeNode key={child2.id} label={label3}>
//                   {subOrgs3.map((child3) => {
//                     // ---- 第4階層 ----
//                     const members3 = child3.children.filter(
//                       (c) => c.title === "メンバー" || c.title === "副主任"
//                     );
//                     const subOrgs4 = child3.children.filter(
//                       (c) => c.title !== "メンバー" && c.title !== "副主任"
//                     );

//                     const label4 = (
//                       <Box sx={getBoxStyle(child3)}>
//                         {child3.title
//                           ? `${child3.title} ${child3.name}`
//                           : child3.name}
//                         {members3.length > 0 && renderMembers(members3)}
//                       </Box>
//                     );

//                     return (
//                       <TreeNode key={child3.id} label={label4}>
//                         {subOrgs4.map((child4) => {
//                           // ---- 第5階層 ----
//                           const members4 = child4.children.filter(
//                             (c) =>
//                               c.title === "メンバー" || c.title === "副主任"
//                           );
//                           const subOrgs5 = child4.children.filter(
//                             (c) =>
//                               c.title !== "メンバー" &&
//                               c.title !== "副主任"
//                           );

//                           const label5 = (
//                             <Box sx={getBoxStyle(child4)}>
//                               {child4.title
//                                 ? `${child4.title} ${child4.name}`
//                                 : child4.name}
//                               {members4.length > 0 && renderMembers(members4)}
//                             </Box>
//                           );

//                           return (
//                             <TreeNode key={child4.id} label={label5}>
//                               {subOrgs5.map((child5) => {
//                                 // ---- 第6階層 ----
//                                 const members5 = child5.children.filter(
//                                   (c) =>
//                                     c.title === "メンバー" ||
//                                     c.title === "副主任"
//                                 );
//                                 const subOrgs6 = child5.children.filter(
//                                   (c) =>
//                                     c.title !== "メンバー" &&
//                                     c.title !== "副主任"
//                                 );

//                                 const label6 = (
//                                   <Box sx={getBoxStyle(child5)}>
//                                     {child5.title
//                                       ? `${child5.title} ${child5.name}`
//                                       : child5.name}
//                                     {members5.length > 0 &&
//                                       renderMembers(members5)}
//                                   </Box>
//                                 );

//                                 return (
//                                   <TreeNode key={child5.id} label={label6}>
//                                     {subOrgs6.map((child6) => {
//                                       // ---- 第7階層 ----
//                                       const members6 = child6.children.filter(
//                                         (c) =>
//                                           c.title === "メンバー" ||
//                                           c.title === "副主任"
//                                       );
//                                       const subOrgs7 =
//                                         child6.children.filter(
//                                           (c) =>
//                                             c.title !== "メンバー" &&
//                                             c.title !== "副主任"
//                                         );

//                                       const label7 = (
//                                         <Box sx={getBoxStyle(child6)}>
//                                           {child6.title
//                                             ? `${child6.title} ${child6.name}`
//                                             : child6.name}
//                                           {members6.length > 0 &&
//                                             renderMembers(members6)}
//                                         </Box>
//                                       );

//                                       return (
//                                         <TreeNode
//                                           key={child6.id}
//                                           label={label7}
//                                         >
//                                           {subOrgs7.map((child7) => {
//                                             // ---- 第8階層（ここで止める）----
//                                             const members7 =
//                                               child7.children.filter(
//                                                 (c) =>
//                                                   c.title === "メンバー" ||
//                                                   c.title === "副主任"
//                                               );

//                                             const label8 = (
//                                               <Box sx={getBoxStyle(child7)}>
//                                                 {child7.title
//                                                   ? `${child7.title} ${child7.name}`
//                                                   : child7.name}
//                                                 {members7.length > 0 &&
//                                                   renderMembers(members7)}
//                                               </Box>
//                                             );

//                                             return (
//                                               <TreeNode
//                                                 key={child7.id}
//                                                 label={label8}
//                                               />
//                                             );
//                                           })}
//                                         </TreeNode>
//                                       );
//                                     })}
//                                   </TreeNode>
//                                 );
//                               })}
//                             </TreeNode>
//                           );
//                         })}
//                       </TreeNode>
//                     );
//                   })}
//                 </TreeNode>
//               );
//             })}
//           </TreeNode>
//         );
//       })}
//     </TreeNode>
//   );
// };



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
