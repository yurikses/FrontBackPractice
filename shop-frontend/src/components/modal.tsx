import { useState } from 'react'
import {GoodsApi, type Good } from '../lib/goods-api'


export function EditModal({ prevPost, isOpen, close, updateEditedGood }: { prevPost: Good | null, isOpen: boolean, close: () => void, updateEditedGood: (goodId: number, good: Good) => void }) {
  const [error, setError] = useState<string | null>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
   if(!prevPost) return null

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const priceRaw = formData.get("price");
    const price = Number(priceRaw);

    const category = String(formData.get("category") ?? "").trim();
    const desc = String(formData.get("desc") ?? "").trim();
    const countRaw = formData.get("count");
    const count = countRaw ? Number(countRaw) : undefined;
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    
    if (!name) {
      setError("Укажите название товара");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Укажите корректную цену");
      return;
    }

    if (count !== undefined && (!Number.isFinite(count) || count < 0)) {
      setError("Укажите корректное количество");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const responce = await GoodsApi.update(prevPost?.id, {
        name,
        price,
        category: category || undefined,
        desc: desc || undefined,
        count: count ?? undefined,
        imageUrl: imageUrl || undefined,
      })
      
      form.reset()
      updateEditedGood(prevPost.id, responce)
      close()
    }
    catch (e: unknown){
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (prevPost == null) {
    return null
  }

  if(!isOpen) return null
  
  return (
    <div className='fixed w-full h-full top-0'>
    <div className=" max-w-md bg-black rounded-md p-4 mx-auto mt-20">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <h3 className="text-lg font-semibold">Добавить товар</h3>

        <label className="flex flex-col gap-1 text-sm">
          Название
          <input
            name="name"
            defaultValue={prevPost.name}
            type="text"
            required
            placeholder="Например: Шуруповёрт"
            className="rounded-md bg-white/5 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Цена
          <input
            name="price"
              type="number"
              defaultValue={prevPost.price}
            min={0}
            step={1}
            required
            placeholder="0"
            className="rounded-md bg-white/5 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Категория
          <input
              name="category"
              defaultValue={prevPost.category}
            type="text"
            required
            placeholder="Инструменты"
            className="rounded-md bg-white/5 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Описание
          <textarea
              name="desc"
              defaultValue={prevPost.desc}
            rows={3}
            placeholder="Короткое описание товара"
            required
            className="rounded-md bg-white/5 p-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Количество
          <input
            name="count"
              type="number"
              defaultValue={prevPost.count}
            min={0}
            step={1}
            required
            placeholder="0"
            className="rounded-md bg-white/5 p-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ссылка на фото
          <input
              name="imageUrl"
              defaultValue={prevPost.imageUrl}
            type="url"
            placeholder="..."
            className="rounded-md bg-white/5 p-2"
          />
        </label>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-white/20 px-3 py-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            type="button"
            className="rounded-md bg-white/10 px-3 py-2"
            onClick={() => close()}
          >
            Отмена
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}
