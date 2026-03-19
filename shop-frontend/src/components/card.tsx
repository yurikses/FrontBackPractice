import { type Good, GoodsApi } from "../lib/goods-api";

interface CardProps {
  good: Good;
  deleteGood: (goodId: number) => void;
  openChange: () => void;
  userRole?: string;
}

export function Card({ good, deleteGood, openChange, userRole }: CardProps) {
  const handleDelete = async () => {
    try {
      await GoodsApi.remove(good.id);
      alert("Товар удален");
      deleteGood(good.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления товара");
    }
  };

  const canEdit = userRole === "admin" || userRole === "seller";
  const canDelete = userRole === "admin";

  return (
    <article className="rounded-lg bg-transparent border p-4 hover:scale-102 select-none cursor-pointer transition-all duration-200 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white">{good.name}</h3>
      </div>
      <div className="h-30 w-full flex mb-2">
        <img
          className="h-full w-full object-contain"
          src={good.imageUrl}
          alt="Изображение товара"
        />
      </div>

      <p className="text-sm text-gray-400 flex-grow">{good.desc}</p>
      <p className="mt-2 text-xl font-bold">{good.price} ₽</p>
      <p className="text-xs uppercase text-gray-500">{good.category}</p>
      <p className="text-xs text-gray-500 mb-4">Остаток: {good.count}</p>

      {(canEdit || canDelete) && (
        <div className="flex items-center justify-center mt-auto">
          {canDelete && (
            <button
              className={`bg-red-500 px-2 py-1 hover:bg-red-500/25 cursor-pointer transition-all duration-200 border border-red-600 ${
                canEdit ? "rounded-l-full" : "rounded-full px-4"
              }`}
              onClick={handleDelete}
            >
              Удалить
            </button>
          )}
          {canEdit && (
            <button
              className={`bg-neutral-500 px-2 py-1 hover:bg-neutral-500/25 cursor-pointer transition-all duration-200 border border-neutral-600 ${
                canDelete ? "rounded-r-full" : "rounded-full px-4"
              }`}
              onClick={openChange}
            >
              Редактировать
            </button>
          )}
        </div>
      )}
    </article>
  );
}
