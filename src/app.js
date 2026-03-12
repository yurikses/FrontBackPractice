const express = require("express");
const cors = require("cors");
const app = express();
const {
  createHash,
  verifyHash,
  createJWT,
  verifyJWT,
  createToken,
} = require("./utils/authorization");

const { authMiddleware } = require("./middleware.js");

require("dotenv").config();

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY || "some_secret_code";
const REFRESH_TOKEN_SECRET = "some_refresh_secret_code";
const PORT = 3000;
const TOKEN_EXPIRE_TIME = "10s";
const REFRESH_EXPIRE_TIME = "10s";
const users = [];
const refreshTokens = new Set();

const goods = [
  {
    id: 1,
    name: "Ноутбук Acer Aspire 5",
    price: 45000,
    desc: "15.6″, Intel i5, 8GB RAM, 512GB SSD.",
    count: 5,
    category: "Электроника",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6Mwygg4ny-FaMwKqO0s1GFwvhYLKREt1VjQ&s",
  },
  {
    id: 2,
    name: "Смартфон Samsung Galaxy A54",
    price: 32000,
    desc: "6.4″ AMOLED, 128GB, 50MP камера.",
    count: 12,
    category: "Электроника",
    imageUrl:
      "https://hi-stores.ru/upload/iblock/2f3/na4smhogfb3938sk8fqe34wnfe10d4uc.jpg",
  },
  {
    id: 3,
    name: "Наушники Sony WH-CH520",
    price: 4500,
    desc: "Bluetooth, до 50 часов работы.",
    count: 20,
    category: "Аксессуары",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdGDgWqHSsJtg3fhDhF_bKMRR6OZVToT53Dw&s",
  },
  {
    id: 4,
    name: "Кофемашина DeLonghi EC 685",
    price: 14000,
    desc: "Рожковая, давление 15 бар.",
    count: 4,
    category: "Бытовая техника",
    imageUrl: "https://neamazon.ru/d/20039515b.jpg",
  },
  {
    id: 5,
    name: "Игровая мышь Logitech G102",
    price: 1800,
    desc: "RGB, 8000 DPI, проводная.",
    count: 25,
    category: "Аксессуары",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSc28ZQ3E-cmIXHNhD237RwSRPxdJyrFS7f_Q&s",
  },
  {
    id: 6,
    name: "Книга «Чистый код»",
    price: 900,
    desc: "Роберт Мартин, мягкая обложка.",
    count: 15,
    category: "Книги",
    imageUrl: "https://rezised-images.knhbt.cz/1920x1920/55129170.webp",
  },
];

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      console.log("Body: ", req.body);
    }
  });
  next();
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Endpoint для главной страницы
app.get("/", (req, res) => {
  res.send("Главная страница");
});
app.post("/api/auth/register", async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Необходимы имя пользователя, почта и пароль" });
  }
  if(users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Пользователь с таким email уже существует" });
  }

  const hashPassword = await createHash(password);

  const newUser = {
    id: users.length + 1,
    last_name,
    first_name,
    email,
    password: hashPassword,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Необходимы почта и пароль" });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  const isPasswordValid = await verifyHash(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Неверный пароль" });
  }

  const token = createJWT(
    {
      sub: user.id,
      username: user.first_name + " " + user.last_name,
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: TOKEN_EXPIRE_TIME,
    },
  );

  const refresh_token = createJWT(
    {
      sub: user.id,
      username: user.first_name + " " + user.last_name,
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_EXPIRE_TIME,
    },
  );
  refreshTokens.add(refresh_token);
  res.status(200).json({ access_token: token, refresh_token: refresh_token });
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Необходим токен" });
  }
  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({ message: "Неправильный токен" });
  }

  try {
    const { payload, expired} = verifyJWT(refreshToken, REFRESH_TOKEN_SECRET);
    console.log(payload, users);
    const user = users.find((user) => user.id == payload.sub);
    console.log(user);
    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    refreshTokens.delete(refreshToken);
    const newAccessToken = createToken(
      ACCESS_TOKEN_SECRET,
      TOKEN_EXPIRE_TIME,
      user,
    );
    const newRefreshToken = createToken(
      REFRESH_TOKEN_SECRET,
      REFRESH_EXPIRE_TIME,
      user,
    );
    refreshTokens.add(newRefreshToken);
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({ message: "Неправильный токен" });
  }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }
  res.status(200).json({
    id: user.id,
    email: user.email,
    name: user.first_name + " " + user.last_name,
  });
});

// Endpoint для получения всех товаров
app.get("/api/goods", (req, res) => {
  res.json(goods);
});

// Endpoint для получения товара по ID
app.get("/api/goods/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const good = goods.find((g) => g.id === id);
  if (good) {
    res.status(200).json(good);
  } else {
    res.status(404).json({ message: "Товар не найден" });
  }
});
// Endpoint для добавления нового товара
app.post("/api/goods", authMiddleware, (req, res) => {
  const { name, price, desc, count, category, imageUrl } = req.body;
  if (
    !name ||
    !price ||
    !count ||
    !category ||
    !desc ||
    typeof price !== "number" ||
    typeof count !== "number"
  ) {
    res.status(404).json({ message: "Неверные данные для добавления товара" });
  }

  const newGood = {
    id: goods.length + 1,
    name,
    price,
    desc,
    count,
    category,
    imageUrl: imageUrl || "https://placehold.co/300x150",
  };

  goods.push(newGood);
  res.status(201).json(newGood);
});
// Endpoint для обновления товара по ID
app.patch("/api/goods/:id", authMiddleware, (req, res) => {
  const { name, price, desc, category, count, imageUrl } = req.body;
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(404).json({ message: "Укажите идентификатор товара" });
  }
  const good = goods.find((g) => g.id === id);
  if (!good) {
    return res.status(404).json({ message: "Товар не найден" });
  }

  if (name || price) {
    if (price && typeof price !== "number") {
      return res.status(404).json({ message: "Цена должна быть числом" });
    }

    good.name = name || good.name;
    good.price = typeof price == "number" ? price : good.price;
    good.desc = desc || good.desc;
    good.category = category || good.category;
    good.count = count || good.count;
    good.imageUrl = imageUrl || good.imageUrl;
    goods[goods.findIndex((g) => g.id === id)] = good;
    return res.status(201).json(good);
  }
  return res
    .status(404)
    .json({ message: "Неверные данные для обновления товара" });
});

// Endpoint для удаления товара по ID
app.delete("/api/goods/:id", authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(404).json({ message: "Укажите идентификатор товара" });
  }
  const goodIndex = goods.findIndex((g) => g.id === id);
  if (goodIndex === -1) {
    return res.status(404).json({ message: "Товар не найден" });
  }

  goods.splice(goodIndex, 1);
  return res.json({ message: `Товар с id ${id} удален` });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
