// frontend/src/base/Base.tsx
import React, { useState } from "react";
import SalesPage from "../pages/SalesPage";
import ManagementPage from "../pages/ManagementPage";
import EngineerPage from "../pages/EngineerPage";

// 環境変数からAPIのベースURLを取得
export const API_URL = process.env.REACT_APP_API_URL as string;

function Base() {
  const [page, setPage] = useState<"sales" | "management" | "engineer">("sales");

  const renderPage = () => {
    switch (page) {
      case "sales":
        return <SalesPage />;
      case "management":
        return <ManagementPage />;
      case "engineer":
        return <EngineerPage />;
      default:
        return <SalesPage />;
    }
  };

  return (
    <div>
      <header>
        <h1>所属管理アプリ</h1>
        <nav>
          <button onClick={() => setPage("sales")}>営業</button>
          <button onClick={() => setPage("management")}>管理</button>
          <button onClick={() => setPage("engineer")}>エンジニア</button>
        </nav>
      </header>
      <main>{renderPage()}</main>
    </div>
  );
}

export default Base;
