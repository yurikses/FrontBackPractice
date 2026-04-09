import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { Task } from "./components/task";
import { socket } from "../utils/socket";

// Замените на публичный VAPID-ключ из шага 1.1 методички
const VAPID_PUBLIC_KEY =
  "BCgMjLqi-AsKvE8Sdg85buXqvxZpViaQp2lJP2808quIUH74I7UI_HYXW480fbG6wdIr7yNasVjVm3RmjYa0BS8";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function App() {
  const [tasks, setTask] = useState<
    { id: string; value: string; reminder?: number }[]
  >(() => JSON.parse(localStorage.getItem("task-list") || "[]"));

  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushMessage, setPushMessage] = useState(false);

  const inputValueRef = useRef<HTMLInputElement>(null);
  const inputDateRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef(0);

  useEffect(() => {
    localStorage.setItem("task-list", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const onTaskAdded = (task: { text: string; reminder?: number }) => {
      if (isPushEnabled) {
        setPushMessage(true);
      }
      setTask((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          value: task.text,
          reminder: task.reminder,
        },
      ]);
      console.log("Получена задача с сервера:", task);
    };

    socket.on("taskAdded", onTaskAdded);

    // Очистка слушателя при размонтировании
    return () => {
      socket.off("taskAdded", onTaskAdded);
    };
  }, [isPushEnabled]);

  useEffect(() => {
    if (pushMessage) {
      timeoutRef.current = window.setTimeout(() => {
        setPushMessage(false);
      }, 3000); // 3 секунды
    }
    // Очистка таймаута при размонтировании или повторном показе
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pushMessage]);

  // Проверка текущей подписки
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsPushEnabled(!!sub);
      });
    }
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Ваш браузер не поддерживает Push-уведомления");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        alert("Вы запретили уведомления в браузере!");
        return;
      }

      const reg = await navigator.serviceWorker.ready;

      // Пробуем получить существующую подписку или создать новую
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Отправляем на сервер (всегда, чтобы сервер точно знал о нас)
      const response = await fetch("http://localhost:3001/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (response.ok) {
        setIsPushEnabled(true);
      } else {
        throw new Error("Сервер отклонил подписку");
      }
    } catch (err) {
      console.error("Ошибка подписки:", err);
      alert("Не удалось подписаться на уведомления. Подробности в консоли.");
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Сначала удаляем с сервера
        await fetch("http://localhost:3001/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });

        // Потом отписываемся в браузере
        await sub.unsubscribe();
      }
      setIsPushEnabled(false);
    } catch (err) {
      console.error("Ошибка отписки:", err);
      // Даже если сервер упал, локально мы считаем себя отписанными
      setIsPushEnabled(false);
    }
  }, []);

  const deleteTask = (id: string) =>
    setTask((prev) => prev.filter((t) => t.id !== id));

  const addTask = () => {
    const value = inputValueRef.current?.value.trim();
    const dateValue = inputDateRef.current?.value;
    const reminder = dateValue ? new Date(dateValue).getTime() : undefined;

    if (value && value.length > 3) {
      socket?.emit("newTask", { text: value, reminder });
      if (inputValueRef.current) inputValueRef.current.value = "";
      if (inputDateRef.current) inputDateRef.current.value = "";
    }
  };

  return (
    <div className="relative w-fit flex flex-col gap-4 p-4 mx-auto">
      {pushMessage && (
        <div
          className="absolute top-4 right-4 bg-white shadow-lg border border-neutral-300 rounded-md p-3 z-50
                        animate-[fadeInSlide_0.3s_ease-out]"
        >
          <p className="text-sm">✨ Новая задача добавлена</p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputValueRef}
          type="text"
          placeholder="Название задачи"
          className="border border-neutral-600 rounded-md p-1"
        />
        <input
          ref={inputDateRef}
          className="border border-neutral-600 rounded-md p-1"
          type="datetime-local"
          name="push-date"
        />
        <button
          className="bg-sky-600 rounded-md px-3 text-white"
          onClick={addTask}
        >
          Добавить задачу
        </button>
      </div>

      <button
        className={`px-3 py-1 rounded-md hover:opacity-75 text-white ${isPushEnabled ? "bg-red-500" : "bg-green-500"}`}
        onClick={isPushEnabled ? unsubscribeFromPush : subscribeToPush}
      >
        {isPushEnabled ? "Отключить уведомления" : "Включить уведомления"}
      </button>
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <Task
              key={task.id}
              task={
                task.reminder
                  ? `${task.value} (Напоминание: ${new Date(task.reminder).toLocaleString()})`
                  : task.value
              }
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <p>Задач пока нет</p>
      )}
    </div>
  );
}

export default App;
