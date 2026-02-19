import { type Good, GoodsApi } from "../lib/goods-api";

interface CardProps {
  good: Good;
}

export function Card({ good }: CardProps) {
  
  const handleDelete = async () => { 
    try {
      await GoodsApi.remove(good.id);
      alert("Товар удален");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления товара");
    }
  }
  
  return (
    <article className="rounded-lg bg-transparent border p-4 hover:scale-102 select-none cursor-pointer transition-all duration-200">
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-white">{good.name}</h3>
        <button className="bg-red-500 px-2 py-1 hover:bg-red-500/25 cursor-pointer transition-all duration-200  rounded-full border border-red-600" onClick={handleDelete}>Удалить</button>
  
      </div>
      <p className="text-sm text-gray-400">{good.desc}</p>
      <p className="mt-2 text-xl font-bold">{good.price} ₽</p>
      <p className="text-xs uppercase text-gray-500">{good.category}</p>
      <p className="text-xs text-gray-500">Остаток: {good.count}</p>
      </article>
  );
}