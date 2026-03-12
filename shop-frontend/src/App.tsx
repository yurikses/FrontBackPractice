import "./App.css";
import { CardWrapper } from "./components/cards-wrapper";
import { Dialog } from "./components/dialog";
import { useEffect, useState } from "react";
import { GoodsApi, type Good } from "./lib/goods-api";
import { AuthDialog } from "./components/auth-dialog";
import { auth } from "./lib/auth";

function App() {
  const [goods, setGoods] = useState<Good[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [session, setSession] = useState<boolean>(auth.isAuthenticated());

  useEffect(() => {
    let mounted = true;

    GoodsApi.list()
      .then((data) => {
        if (mounted) {
          setGoods(data);
          setError(null);
        }
      })
      .catch(
        (err) => mounted && setError(err.message || "Ошибка загрузки товаров"),
      )
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      const { access_token, refresh_token } = await GoodsApi.login(
        email,
        password,
      );
      alert(access_token);
      auth.setTokens(access_token, refresh_token);
      setAuthDialogOpen(false);
      setSession(true);
    } catch (err: unknown) {
      alert((err as Error).message || "Ошибка авторизации");
    }
  };

  const deleteGood = (goodId: number) => {
    setGoods((prev) => prev.filter((p) => p.id !== goodId));
  };
  const addCreatedGood = (good: Good) => {
    setGoods((prev) => [...prev, good]);
  };
  const updateGood = (goodId: number, newData: Good) => {
    setGoods((prev) => {
      return prev.map((good) => {
        if (good.id == goodId) {
          return newData;
        }
        return good;
      });
    });
  };

  return (
    <div className="h-screen w-screen overflow-x-hidden flex flex-col p-2">
      <header className=" bg-white/25 p-2 rounded-md w-full flex justify-between items-center ">
        <h2 className="text-lg font-semibold">Магазин Тёмная Зина</h2>
        {session ? (
          <>
            <button
              className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer"
              onClick={() => {
                setDialogOpen(true);
              }}
            >
              Добавить товар
            </button>
            <button
              className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer"
              onClick={() => {
                auth.clear();
                setSession(false);
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <button
            className="bg-black rounded-md p-1 px-2 hover:bg-neutral-700 cursor-pointer"
            onClick={() => setAuthDialogOpen(true)}
          >
            Войти
          </button>
        )}
      </header>
      <main className="relative w-full h-full">
        <CardWrapper
          goods={goods}
          updateGood={updateGood}
          deleteGood={deleteGood}
          loading={loading}
          error={error}
        />
        <AuthDialog
          isOpen={isAuthDialogOpen}
          handleAuth={handleLogin}
          onClose={() => setAuthDialogOpen(false)}
        ></AuthDialog>
        <Dialog
          addCreatedGood={addCreatedGood}
          isOpen={isDialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </main>
    </div>
  );
}

export default App;
