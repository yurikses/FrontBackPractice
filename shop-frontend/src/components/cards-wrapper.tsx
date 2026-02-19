import { useEffect, useState } from "react";
import { GoodsApi } from "../lib/goods-api";
import { Card } from "./card";
import { type Good } from "../lib/goods-api";

export function CardWrapper() {
  const [goods, setGoods] = useState<Good[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let mounted = true;

    GoodsApi.list()
      .then((data) => {
        if (mounted) {
          setGoods(data);
          setError(null);
        }
      })
      .catch((err) => mounted && setError(err.message || "Ошибка загрузки товаров"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);
  
  if (loading) {
    return <p>Загрузка товаров...</p>;
  }

  if (error) {
    return <p className="text-red-500">Ошибка: {error}</p>;
  }
  return (
    <div className="grid grid-cols-4 w-full gap-2 p-2">
      {goods.map((good) => (
        <Card good={good} key={good.id}/>
      ))}
    </div>
  );
  
}