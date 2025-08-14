"use client";

import Cookies from "js-cookie";
import LoginPage from "./login/page";
import DashboardPage from './dashboard/page';

export default function HomePage() {
  const token = Cookies.get("token");

  if (!token) {
    return <LoginPage />;
  }

  return (
    <main className="p-6">
      <DashboardPage />
    </main>
  );
}
