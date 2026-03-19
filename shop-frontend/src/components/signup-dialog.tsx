import { GoodsApi } from "../lib/goods-api";

export function SignupDialog({ isOpen, close }: { isOpen: boolean, close: () => void }) {
  if (!isOpen) {
    return null;
  }
  
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    // Здесь можно добавить логику отправки данных на сервер для регистрации
    // Например, собрать данные из формы и вызвать API для регистрации
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    // Валидация данных (можно расширить по необходимости)
    if (!firstName || !lastName || !email || !password) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    // Здесь можно вызвать API для регистрации пользователя
    // Например:
    await GoodsApi.register(firstName, lastName, email, password)
      .then(() => {
        alert("Регистрация успешна!");
        close();
      })
      .catch((err: unknown) => {
        alert((err as Error).message || "Ошибка регистрации");
      });

    alert("Регистрация успешна!"); // Удалите это после добавления реальной логики регистрации
    close(); // Закрыть диалог после успешной регистрации
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
      <div className="bg-black p-4 rounded-md w-[400px]">
        <h2 className="text-xl font-semibold mb-4">Регистрация</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="first_name"
            placeholder="Имя"
            className="border border-gray-300 rounded-md p-2"
          />
          <input
            type="text"
            name="last_name"
            placeholder="Фамилия"
            className="border border-gray-300 rounded-md p-2"
          />
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
              onClick={close}
              className="bg-gray-300 rounded-md px-4 py-2 hover:bg-gray-400"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white rounded-md px-4 py-2 hover:bg-green-700"
            >
              Зарегистрироваться
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}