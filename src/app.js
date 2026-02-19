const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use((req, res, next) => {
  res.on('finish', () => { 
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') { 
      console.log('Body: ', req.body)
    }
  })
  next();
})



app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});


const goods = [
  { id: 1, name: "Товар 1", price: 100, category: "Инструмент", desc: "Описание товара 1", count: 10 },
  { id: 2, name: "Товар 2", price: 200, category: "Инструмент", desc: "Описание товара 2", count: 8 },
  { id: 3, name: "Товар 3", price: 300, category: "Инструмент", desc: "Описание товара 3", count: 12 },
  { id: 4, name: "Товар 4", price: 150, category: "Электроника", desc: "Описание товара 4", count: 6 },
  { id: 5, name: "Товар 5", price: 450, category: "Электроника", desc: "Описание товара 5", count: 4 },
  { id: 6, name: "Товар 6", price: 90, category: "Расходники", desc: "Описание товара 6", count: 25 },
  { id: 7, name: "Товар 7", price: 600, category: "Мебель", desc: "Описание товара 7", count: 2 },
  { id: 8, name: "Товар 8", price: 75, category: "Расходники", desc: "Описание товара 8", count: 30 },
  { id: 9, name: "Товар 9", price: 320, category: "Инструмент", desc: "Описание товара 9", count: 7 },
  { id: 10, name: "Товар 10", price: 250, category: "Электроника", desc: "Описание товара 10", count: 5 }
];



app.get("/", (req, res) => {
  res.send("Главная страница");
});

// Endpoint для получения всех товаров 
app.get('/api/goods', (req, res) => {
  res.json(goods);
});

// Endpoint для получения товара по ID
app.get('/api/goods/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const good = goods.find(g => g.id === id);
  if (good) {
    res.json(good);
  } else {
    res.status(404).json({ message: 'Товар не найден' });
  }
});
// Endpoint для добавления нового товара
app.post('/api/goods', (req, res) => {
  const { name, price, desc, count, category } = req.body;
  if (!name || !price || !count || !category || !desc || typeof price !== 'number' || typeof count !== 'number') { 
    res.status(404).json({"message":"Неверные данные для добавления товара"});
  }
  
  const newGood = {
    id: goods.length + 1,
    name,
    price,
    desc, 
    count,
    category
  }
  
  goods.push(newGood);
  res.status(201).json({"message": `Товар ${name} добавлен с ценой ${price}`});
});
// Endpoint для обновления товара по ID
app.patch('/api/goods/:id', (req, res) => {
  const { name, price, desc, category, count } = req.body;
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(404).json({"message": "Укажите идентификатор товара"})
  }
  const good = goods.find(g => g.id === id);
  if (!good) {
    return res.status(404).json({"message": "Товар не найден"});
  }
  
  if (name || price) {
    if (price && typeof price !== 'number') {
      return res.status(404).json({"message": "Цена должна быть числом"});
    }
    
    good.name = name || good.name;
    good.price = typeof price == 'number' ? price : good.price;
    good.desc = desc || good.desc;
    good.category = category || good.category;
    good.count = count || good.count;
    goods[goods.findIndex(g => g.id === id)] = good;
    return res.json({"message": `Товар с id ${id} обновлен`});
  }
  return res.status(404).json({"message": "Неверные данные для обновления товара"});
});


// Endpoint для удаления товара по ID
app.delete('/api/goods/:id', (req, res) => { 
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(404).json({"message": "Укажите идентификатор товара"})
  }
  const goodIndex = goods.findIndex(g => g.id === id);
  if (goodIndex === -1) {
    return res.status(404).json({"message": "Товар не найден"});
  }
  
  goods.splice(goodIndex, 1);
  return res.json({"message": `Товар с id ${id} удален`});  
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

