import { type Good, GoodsApi } from "../lib/goods-api";

interface CardProps {
  good: Good;
  deleteGood: (goodId: number) => void;
  openChange: () => void;
}

export function Card({ good, deleteGood, openChange }: CardProps) {
  const handleDelete = async () => {
    try {
      await GoodsApi.remove(good.id);
      alert("Товар удален");
      deleteGood(good.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления товара");
    }
  };

  return (
    <article className="rounded-lg bg-transparent border p-4 hover:scale-102 select-none cursor-pointer transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white">{good.name}</h3>
      </div>
      <div className="h-30 w-full flex">
        <img
          className="h-full w-full object-contain"
          src={good.imageUrl}
          alt="Изображение товара"
        />
      </div>

      <p className="text-sm text-gray-400">{good.desc}</p>
      <p className="mt-2 text-xl font-bold">{good.price} ₽</p>
      <p className="text-xs uppercase text-gray-500">{good.category}</p>
      <p className="text-xs text-gray-500">Остаток: {good.count}</p>
      <div className="flex items-center justify-center">
        <button
          className="bg-red-500 px-2 py-1 hover:bg-red-500/25 cursor-pointer transition-all duration-200  rounded-l-full border border-red-600"
          onClick={handleDelete}
        >
          Удалить
        </button>
        <button
          className="bg-neutral-500 px-2 py-1 hover:bg-neutral-500/25 cursor-pointer transition-all duration-200  rounded-r-full border border-neutral-600"
          onClick={openChange}
        >
          Редактировать
        </button>
      </div>
    </article>
  );
}
