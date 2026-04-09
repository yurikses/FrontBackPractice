const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const vapidKeys = {
  publicKey:
    "BCgMjLqi-AsKvE8Sdg85buXqvxZpViaQp2lJP2808quIUH74I7UI_HYXW480fbG6wdIr7yNasVjVm3RmjYa0BS8",
  privateKey: "j7gzfNfEUpvp3KR_4Io3lONXgneEhRNJfZsjI5ETFmA",
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "./")));
let subscriptions = [];
const activeTimers = new Map();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
io.on("connection", (socket) => {
  console.log("Клиент подключён:", socket.id);
  socket.on("newTask", (task) => {
    io.emit("taskAdded", task);
    console.log("taskAdded");
    const taskId = task.id || Date.now().toString();
    const payload = JSON.stringify({
      title: "Напоминание о задаче",
      body: task.text,
      taskId: taskId,
    });

    if (task.reminder && task.reminder > Date.now()) {
      const delay = task.reminder - Date.now();
      subscriptions.forEach((sub) => {
        const timerId = `${sub.endpoint}-${taskId}`;
        const timer = setTimeout(() => {
          webpush
            .sendNotification(sub, payload)
            .catch((err) => console.error("Push error:", err));
          activeTimers.delete(timerId);
        }, delay);
        activeTimers.set(timerId, timer);
      });
    } else {
      subscriptions.forEach((sub) => {
        webpush
          .sendNotification(sub, payload)
          .catch((err) => console.error("Push error:", err));
      });
    }
  });
  socket.on("disconnect", () => {
    console.log("Клиент отключён:", socket.id);
  });
});

app.post("/subscribe", (req, res) => {
  const newSub = req.body;
  subscriptions = subscriptions.filter(
    (sub) => sub.endpoint !== newSub.endpoint,
  );
  subscriptions.push(newSub);
  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/snooze", (req, res) => {
  const { endpoint, task } = req.body;
  const sub = subscriptions.find((s) => s.endpoint === endpoint);

  if (!sub) {
    return res.status(404).json({ message: "Подписка не найдена" });
  }

  // Создаем уникальный ID таймера для этой подписки и задачи
  const timerId = `${endpoint}-${task.taskId}`;
  if (activeTimers.has(timerId)) {
    clearTimeout(activeTimers.get(timerId));
  }

  // Откладываем на 5 минут (300000 мс)
  const delay = 5 * 4;
  const timer = setTimeout(() => {
    const payload = JSON.stringify({
      title: "Напоминание (отложено)",
      body: task.body || "Пора выполнить отложенную задачу!",
      taskId: task.taskId,
    });

    webpush
      .sendNotification(sub, payload)
      .catch((err) => console.error("Push error:", err));

    activeTimers.delete(timerId);
  }, delay);

  activeTimers.set(timerId, timer);
  res.status(200).json({ message: "Напоминание отложено на 5 минут" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  res.status(200).json({ message: "Подписка удалена" });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
