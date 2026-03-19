import { Card } from "./card";
import { type Good } from "../lib/goods-api";
import { EditModal } from "./modal";
import { useState } from "react";

export function CardWrapper({
  loading,
  error,
  goods,
  deleteGood,
  updateGood,
  userRole,
}: {
  loading: boolean;
  error: string | null;
  goods: Good[];
  deleteGood: (goodId: number) => void;
  updateGood: (goodId: number, newData: Good) => void;
  userRole?: string;
}) {
  const [goodForEdit, setGoodForEdit] = useState<Good | null>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);

  const openEditModal = (good: Good) => {
    setGoodForEdit(good);
    setEditOpen(true);
  };

  if (loading) {
    return <p>Загрузка товаров...</p>;
  }

  if (error) {
    return <p className="text-red-500">Ошибка: {error}</p>;
  }

  return (
    <div className="grid grid-cols-4 w-full gap-2 p-2">
      {goods.map((good) => (
        <Card
          openChange={() => openEditModal(good)}
          deleteGood={deleteGood}
          good={good}
          key={good.id}
          userRole={userRole}
        />
      ))}
      <EditModal
        updateEditedGood={updateGood}
        close={() => setEditOpen(false)}
        isOpen={editOpen}
        prevPost={goodForEdit ? goodForEdit : null}
      />
    </div>
  );
}
