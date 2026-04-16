const { Pool } = require("pg");
const express = require("express");
const { sequelize, User, Task } = require("./database");

const app = express();
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mydatabase",
  password: "password",
  port: 5452,
});

app.use(express.json());

sequelize
  .authenticate()
  .then(() => {
    console.log(
      "Connection to the database has been established successfully.",
    );
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

sequelize.sync({ force: true });

app.post("/api/users", async (req, res) => {
  try {
    const { first_name, last_name, age } = req.body;
    const newUser = await User.create({ first_name, last_name, age });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/users/:id", async (req, res) => { 
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) { 
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
  
  
    const updatedUser = await user.update(req.body, {
      returning: true,
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  
});

app.delete("/api/users/:id", async (req, res) => {
  
  try {
    const deleted = await User.destroy({
      where: { id: req.params.id },
    });
    
    if (deleted) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on  http://localhost:3000");
});
