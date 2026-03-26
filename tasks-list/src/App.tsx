import {  useEffect, useRef, useState } from "react";
import "./App.css";
import { Task } from "./components/task";

function App() {
  const [tasks, setTask] = useState<{ id: number; value: string }[]>(() => {
    return JSON.parse(localStorage.getItem("task-list") || '[]');
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saveToLocalStorage = () => {
      localStorage.setItem("task-list", JSON.stringify(tasks));
    };
    if (tasks != JSON.parse(localStorage.getItem("task-list")!)) {
      saveToLocalStorage();
    }
  }, [tasks]);

  const deleteTask = (id: number) => {
    setTask((prev) => prev.filter((task) => task.id != id));
  };

  const addTask = () => {
    const inputValue = inputRef.current?.value.trim();
    if (inputValue && inputValue.length > 3) {
      setTask((prev) => [...prev, { id: prev.length, value: inputValue }]);
    }
  };

  return (
    <div className="w-fit flex flex-col gap-4 p-4 mx-auto ">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          className="border border-neutral-600 rounded-2xl px-3"
        />
        <button className="bg-sky-600 rounded-md px-3 text-white" onClick={addTask}>Добавить задачу</button>
      </div>
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <Task
              key={task.id}
              task={task.value}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <p> Задач пока нет</p>
      )}
    </div>
  );
}

export default App;
