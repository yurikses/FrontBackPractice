import { useEffect, useState } from "react";
import { UsersApi, type User } from "../lib/goods-api";

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UsersApi.list();
      setUsers(data);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message || "Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (
    id: number,
    newRole: "user" | "seller" | "admin",
  ) => {
    try {
      await UsersApi.update(id, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)),
      );
    } catch (err: unknown) {
      alert((err as Error).message || "Ошибка обновления роли");
    }
  };

  const handleBlockUser = async (id: number) => {
    if (!confirm("Вы уверены, что хотите заблокировать пользователя?")) return;
    try {
      await UsersApi.block(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isBlocked: true } : u)),
      );
    } catch (err: unknown) {
      alert((err as Error).message || "Ошибка блокировки");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <main className="bg-white/5 p-4 rounded-md min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">Список пользователей</h2>
          <button
            onClick={fetchUsers}
            className="bg-neutral-800 px-3 py-1 rounded-md text-sm hover:bg-neutral-700 transition-colors"
          >
            Обновить список
          </button>
        </div>

        {loading && <p className="text-gray-400">Загрузка...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <UserItem
                key={user.id}
                user={user}
                onUpdateRole={handleUpdateRole}
                onBlock={handleBlockUser}
              />
            ))}
            {users.length === 0 && (
              <p className="text-gray-400">Пользователей пока нет.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

interface UserItemProps {
  user: User;
  onUpdateRole: (id: number, role: "user" | "seller" | "admin") => void;
  onBlock: (id: number) => void;
}

export function UserItem({ user, onUpdateRole, onBlock }: UserItemProps) {
  return (
    <div
      className={`flex justify-between items-center p-3 rounded-md border border-neutral-800 ${
        user.isBlocked ? "bg-red-950/20 opacity-75" : "bg-neutral-900/50"
      }`}
    >
      <div className="flex flex-col">
        <p className="text-lg font-semibold flex items-center gap-2">
          {user.first_name} {user.last_name}
          {user.isBlocked && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
              Заблокирован
            </span>
          )}
        </p>
        <p className="text-sm text-gray-400">{user.email}</p>
        <p className="text-xs text-neutral-500 mt-1">ID: {user.id}</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={user.role}
          onChange={(e) =>
            onUpdateRole(user.id, e.target.value as "user" | "seller" | "admin")
          }
          disabled={user.isBlocked}
          className="bg-neutral-800 text-white border border-neutral-700 rounded-md p-1.5 text-sm cursor-pointer disabled:opacity-50"
        >
          <option value="user">Пользователь</option>
          <option value="seller">Продавец</option>
          <option value="admin">Администратор</option>
        </select>

        <button
          onClick={() => onBlock(user.id)}
          disabled={user.isBlocked}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            user.isBlocked
              ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              : "bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white border border-red-900/50"
          }`}
        >
          {user.isBlocked ? "Заблокирован" : "Заблокировать"}
        </button>
      </div>
    </div>
  );
}
