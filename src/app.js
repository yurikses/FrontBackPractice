const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

const goods = [
  { id: 1, name: "Товар 1", price: 100 },
  { id: 2, name: "Товар 2", price: 200 },
  { id: 3, name: "Товар 3", price: 300 },
];

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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
  const { name, cost } = req.body;
  if (!name || !cost || typeof cost !== 'number') { 
    res.status(404).json({"message":"Неверные данные для добавления товара"});
  }
  
  const newGood = {
    id: goods.length + 1,
    name,
    cost
  }
  
  goods.push(newGood);
  res.status(201).json({"message": `Товар ${name} добавлен с ценой ${cost}`});
});
// Endpoint для обновления товара по ID
app.patch('/api/goods/:id', (req, res) => {
  const { name, cost } = req.body;
  const id = parseInt(req.params.id);
  if (!id) {
    return res.status(404).json({"message": "Укажите идентификатор товара"})
  }
  const good = goods.find(g => g.id === id);
  if (!good) {
    return res.status(404).json({"message": "Товар не найден"});
  }
  
  if (name || cost) {
    if (cost && typeof cost !== 'number') {
      return res.status(404).json({"message": "Цена должна быть числом"});
    }
    
    good.name = name || good.name;
    good.price = typeof cost == 'number' ? cost : good.price;
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
