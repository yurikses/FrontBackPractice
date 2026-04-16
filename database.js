const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("mydatabase", "postgres", "password", {
  host: "localhost",
  dialect: "postgres",
  port: 5452,
});

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    age: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const Task = sequelize.define("Task", {
  title: { type: DataTypes.STRING },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
});

User.hasMany(Task);
Task.belongsTo(User);

module.exports = { sequelize, User, Task };
