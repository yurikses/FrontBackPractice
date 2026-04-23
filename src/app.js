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

const { createClient } = require("redis");

const { authMiddleware, rolesMiddleware } = require("./middleware.js");
const { hash } = require("bcrypt");

require("dotenv").config();

const PORT = 3000;
// auth token secret keys and expiration times
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY || "some_secret_code";
const REFRESH_TOKEN_SECRET = "some_refresh_secret_code";
const TOKEN_EXPIRE_TIME = "10m";
const REFRESH_EXPIRE_TIME = "30m";
// TTL for cache (in seconds)
const USERS_CACHE_TTL = 60; // 1 минута
const PRODUCTS_CACHE_TTL = 600; // 10 минут
const users = [
  {
    id: 1,
    first_name: "Иван",
    last_name: "Иванов",
    email: "test@gmail.com",
    password: "$2a$12$fignXLre7b5lB3If8NYaKuyWYafdF7AvZjH/LB54WmPCCgo85bELS",
    role: "admin",
    isBlocked: false,
  },
];

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

const redisClient = createClient({
  url: "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

async function initRedis() {
  await redisClient.connect();
  console.log("Connected to Redis");
}

function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const cacheKey = keyBuilder(req);
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log(`Cache hit for key: ${cacheKey}`);
        return res.json({
          source: "cache",
          data: JSON.parse(cachedData),
        });
      }

      req.cacheKey = cacheKey;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error("Cache read error:", err);
      next();
    }
  };
}

async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error("Cache write error:", err);
  }
}

async function invalidateUsersCache(uderId = null) {
  try {
    await redisClient.del("users:all");
    if (uderId) {
      await redisClient.del(`users:${uderId}`);
    }
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

async function invalidateGoodsCache(goodId = null) {
  try {
    await redisClient.del("goods:all");
    if (goodId) {
      await redisClient.del(`goods:${goodId}`);
    }
  } catch (err) {
    console.error("Goods cache invalidate error:", err);
  }
}

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

  const hashPassword = await createHash(password);

  const newUser = {
    id: users.length + 1,
    last_name,
    first_name,
    email,
    password: hashPassword,
    role: "user",
    isBlocked: false,
  };

  users.push(newUser);
  // Не возвращаем пароль на фронт!
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
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

  if (user.isBlocked) {
    return res.status(403).json({ message: "Ваш аккаунт заблокирован" });
  }

  const isPasswordValid = await verifyHash(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Неверный пароль" });
  }

  const token = createJWT(
    {
      sub: user.id,
      username: user.first_name + " " + user.last_name,
      role: user.role,
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
    const { payload, expired } = verifyJWT(refreshToken, REFRESH_TOKEN_SECRET);
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
// ==========================================
// AUTH ENDPOINTS (ПРОДОЛЖЕНИЕ)
// ==========================================

// GET /api/auth/me (Пользователь)
app.get("/api/auth/me", authMiddleware, (req, res) => {
  // req.user берется из токена. Найдем актуальную инфу в БД.
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ message: "Пользователь не найден" });

  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
});

// ==========================================
// USERS ENDPOINTS (ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА)
// ==========================================

// GET /api/users (Администратор)
app.get(
  "/api/users",
  authMiddleware,
  rolesMiddleware(["admin"]),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
  async (req, res) => {
    const safeUsers = users.map(({ password, ...u }) => u);
    await saveToCache(req.cacheKey, safeUsers, req.cacheTTL);
    res.status(200).json({ source: "server", data: safeUsers });
  },
);

// GET /api/users/:id (Администратор)
app.get(
  "/api/users/:id",
  authMiddleware,
  rolesMiddleware(["admin"]),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    const { password, ...safeUser } = user;
    await saveToCache(req.cacheKey, safeUser, req.cacheTTL);
    res.status(200).json({ source: "server", data: safeUser });
  },
);

// PUT /api/users/:id (Администратор) - Обновление пользователя (вкл. роль)
app.patch(
  "/api/users/:id",
  authMiddleware,
  rolesMiddleware(["admin"]),
  async (req, res) => {
    const { first_name, last_name, email, role } = req.body;
    const user = users.find((u) => u.id === parseInt(req.params.id));

    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (email) user.email = email;
    if (role && ["user", "seller", "admin"].includes(role)) {
      user.role = role;
    }
    await invalidateUsersCache(user.id);
    const { password, ...safeUser } = user;
    res.status(200).json(safeUser);
  },
);

// DELETE /api/users/:id (Администратор) - Блокировка (Soft Delete)
app.delete(
  "/api/users/:id",
  authMiddleware,
  rolesMiddleware(["admin"]),
  async (req, res) => {
    const user = users.find((u) => u.id === parseInt(req.params.id));
    if (!user)
      return res.status(404).json({ message: "Пользователь не найден" });

    user.isBlocked = true;
    await invalidateUsersCache(user.id);
    res
      .status(200)
      .json({ message: `Пользователь ID ${user.id} заблокирован` });
  },
);

// Endpoint для получения всех товаров
app.get(
  "/api/goods",
  authMiddleware,
  cacheMiddleware(() => "goods:all", PRODUCTS_CACHE_TTL),
  async (req, res) => {
    await saveToCache(req.cacheKey, goods, req.cacheTTL);
    res.json({source: "server", data:goods });
  },
);

// Endpoint для получения товара по ID
app.get(
  "/api/goods/:id",
  authMiddleware,
  rolesMiddleware(["user", "seller", "admin"]),
  cacheMiddleware((req) => `goods:${req.params.id}`, PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const id = parseInt(req.params.id);
    const good = goods.find((g) => g.id === id);
    if (good) {
      await saveToCache(req.cacheKey, good, req.cacheTTL);
      res.status(200).json({ source: "server", data: good });
    } else {
      res.status(404).json({ message: "Товар не найден" });
    }
  },
);
// Endpoint для добавления нового товара
app.post(
  "/api/goods",
  authMiddleware,
  rolesMiddleware(["seller", "admin"]),
  async (req, res) => {
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
      res
        .status(404)
        .json({ message: "Неверные данные для добавления товара" });
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
    await invalidateGoodsCache();
    res.status(201).json(newGood);
  },
);
// Endpoint для обновления товара по ID
app.patch(
  "/api/goods/:id",
  authMiddleware,
  rolesMiddleware(["seller", "admin"]),
  async (req, res) => {
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
      
      await invalidateGoodsCache(id);
    
      return res.status(201).json(good);
    }
    return res
      .status(404)
      .json({ message: "Неверные данные для обновления товара" });
  },
);

// Endpoint для удаления товара по ID
app.delete(
  "/api/goods/:id",
  authMiddleware,
  rolesMiddleware(["admin"]),
  async (req, res) => {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(404).json({ message: "Укажите идентификатор товара" });
    }
    const goodIndex = goods.findIndex((g) => g.id === id);
    if (goodIndex === -1) {
      return res.status(404).json({ message: "Товар не найден" });
    }
    await invalidateGoodsCache(id);
    goods.splice(goodIndex, 1);
    return res.json({ message: `Товар с id ${id} удален` });
  },
);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

initRedis().then(() => {
  app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
});
