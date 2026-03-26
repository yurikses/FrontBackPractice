export function Task({ task, onDelete }: {task: string, onDelete: ()=>void}) {
  return (
    <div className="flex gap-2 w-80 justify-between">
      <p className="wrap-break-word w-60">{ task }</p>
      <button className="px-2 bg-red-600 text-white rounded-md" onClick={onDelete}>Удалить</button>
    </div>
  )
}