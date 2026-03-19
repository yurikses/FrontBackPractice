import { useState } from "react";

export function AuthDialog({
  isOpen,
  onClose,
  handleAuth,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleAuth: (e: React.FormEvent<HTMLFormElement>, isLogin: boolean) => void;
}) {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-black p-6 rounded-md w-[400px] border border-gray-800 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 text-white">
          {isLogin ? "Авторизация" : "Регистрация"}
        </h2>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => handleAuth(e, isLogin)}
        >
          {!isLogin && (
            <>
              <input
                type="text"
                name="first_name"
                required
                placeholder="Имя"
                className="border border-gray-700 bg-transparent text-white rounded-md p-2"
              />
              <input
                type="text"
                name="last_name"
                required
                placeholder="Фамилия"
                className="border border-gray-700 bg-transparent text-white rounded-md p-2"
              />
            </>
          )}
          <input
            type="email"
            name="email"
            required
            placeholder="Электронная почта"
            className="border border-gray-700 bg-transparent text-white rounded-md p-2"
          />
          <input
            type="password"
            name="password"
            required
            placeholder="Пароль"
            className="border border-gray-700 bg-transparent text-white rounded-md p-2"
          />
          <div className="flex justify-between items-center mt-2">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-400 hover:text-blue-500 transition-colors"
            >
              {isLogin ? "Создать аккаунт" : "Уже есть аккаунт? Войти"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-black rounded-md px-4 py-2 hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                {isLogin ? "Войти" : "Регистрация"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
