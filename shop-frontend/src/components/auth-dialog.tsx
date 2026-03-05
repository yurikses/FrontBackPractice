export function AuthDialog({
  isOpen,
  onClose,
  handleAuth,
}: {
  isOpen: boolean;
  onClose: () => void;
  handleAuth: (e: React.SubmitEvent<HTMLFormElement>) => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
      <div className="bg-black p-4 rounded-md w-[400px]">
        <h2 className="text-xl font-semibold mb-4">Авторизация</h2>
        <form className="flex flex-col gap-4" onSubmit={handleAuth}>
          <input
            type="text"
            name="email"
            placeholder="Электронная почта"
            className="border border-gray-300 rounded-md p-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            className="border border-gray-300 rounded-md p-2"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 rounded-md px-4 py-2 hover:bg-gray-400"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Войти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
