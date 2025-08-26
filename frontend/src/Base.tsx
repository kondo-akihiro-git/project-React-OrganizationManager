import React from "react";

// 環境変数からAPIのベースURLを取得
export const API_URL = process.env.REACT_APP_API_URL as string;

type BaseProps = {
  children: React.ReactNode;
};

function Base({ children }: BaseProps) {
  return (
    <div>
      <header>
        <h1>所属管理アプリ</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Base;
