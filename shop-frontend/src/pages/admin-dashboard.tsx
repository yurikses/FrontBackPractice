import { Link, Navigate } from "react-router-dom";
import { auth } from "../lib/auth";
import { UserList } from "../components/user-list";

export function AdminDashboard() {
  // Простая защита роута — если нет токена, редирект на главную
  if (!auth.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-4 flex flex-col gap-4 w-screen">
      <header className="flex justify-between items-center bg-white/10 p-4 rounded-md">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <Link
          to="/"
          className="bg-neutral-800 px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
        >
          Вернуться в магазин
        </Link>
      </header>

      <UserList />
    </div>
  );
}
