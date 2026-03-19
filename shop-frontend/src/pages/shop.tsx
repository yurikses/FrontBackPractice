import "../App.css";
import { CardWrapper } from "../components/cards-wrapper";
import { Dialog } from "../components/dialog";
import { useEffect, useState } from "react";
import { GoodsApi, type Good, type User } from "../lib/goods-api";
import { AuthDialog } from "../components/auth-dialog";
import { auth } from "../lib/auth";
import { Link } from "react-router-dom";

export function Storefront() {
  const [goods, setGoods] = useState<Good[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [session, setSession] = useState<boolean>(auth.isAuthenticated());

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    if (session) {
      Promise.all([GoodsApi.list(), GoodsApi.me()])
        .then(([goodsData, userData]) => {
          if (mounted) {
            setGoods(goodsData);
            setUser(userData || null);
            setError(null);
          }
        })
        .catch((err) => {
          if (mounted) {
            auth.clear();
            setSession(false);
            setUser(null);
            setError(err.message || "Ошибка сессии, войдите заново");
          }
        })
        .finally(() => mounted && setLoading(false));
    } else {
      setGoods([]);
      setUser(null);
      setError("Войдите в систему для просмотра товаров");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [session]);

  const handleAuth = async (
    e: React.FormEvent<HTMLFormElement>,
    isLogin: boolean,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Если это регистрация, сначала создаем аккаунт
      if (!isLogin) {
        const first_name = formData.get("first_name") as string;
        const last_name = formData.get("last_name") as string;
        await GoodsApi.register(first_name, last_name, email, password);
      }

      // Логинимся (либо сразу после регистрации, либо обычный вход)
      const { access_token, refresh_token } = await GoodsApi.login(
        email,
        password,
      );
      auth.setTokens(access_token, refresh_token);

      setSession(true);
      setAuthDialogOpen(false);
    } catch (err: unknown) {
      alert((err as Error).message || "Ошибка авторизации");
    }
  };

  const deleteGood = (goodId: number) =>
    setGoods((prev) => prev.filter((p) => p.id !== goodId));
  const addCreatedGood = (good: Good) => setGoods((prev) => [...prev, good]);
  const updateGood = (goodId: number, newData: Good) => {
    setGoods((prev) =>
      prev.map((good) => (good.id === goodId ? newData : good)),
    );
  };

  return (
    <div className="h-screen w-screen overflow-x-hidden flex flex-col p-2">
      <header className="bg-white/25 p-2 rounded-md w-full flex justify-between items-center">
        <h2 className="text-lg font-semibold">Магазин Тёмная Зина</h2>
        <div className="flex gap-2 items-center">
          {session && user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="bg-blue-600 rounded-md p-1 px-3 hover:bg-blue-500 cursor-pointer flex items-center transition-colors"
                >
                  Админка
                </Link>
              )}

              {(user.role === "admin" || user.role === "seller") && (
                <button
                  className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer transition-colors"
                  onClick={() => setDialogOpen(true)}
                >
                  Добавить товар
                </button>
              )}

              <span className="text-sm text-gray-300 ml-2 mr-2">
                {user.first_name} {user.last_name}
              </span>

              <button
                className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer transition-colors"
                onClick={() => {
                  auth.clear();
                  setSession(false);
                  setUser(null);
                }}
              >
                Выйти
              </button>
            </>
          ) : (
            <button
              className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer transition-colors"
              onClick={() => setAuthDialogOpen(true)}
            >
              Войти
            </button>
          )}
        </div>
      </header>
      <main className="relative w-full h-full">
        <CardWrapper
          goods={goods}
          updateGood={updateGood}
          deleteGood={deleteGood}
          loading={loading}
          error={error}
          userRole={user?.role}
        />
        <AuthDialog
          isOpen={isAuthDialogOpen}
          handleAuth={handleAuth}
          onClose={() => setAuthDialogOpen(false)}
        />
        <Dialog
          addCreatedGood={addCreatedGood}
          isOpen={isDialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </main>
    </div>
  );
}
