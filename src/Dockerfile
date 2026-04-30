FROM node:18-alpine

WORKDIR /app

# Копируем файлы зависимостей
# Предполагается, что сборка будет запускаться из корня проекта:
# docker build -f src/Dockerfile -t my-backend .
COPY package*.json ./

# Устанавливаем зависимости (только production, если не нужны devDependencies)
RUN npm install

# Копируем папку src в контейнер
COPY src ./src

# Если используются файлы окружения, их тоже можно скопировать (например .env.example)
# COPY .env.example ./

EXPOSE 3000

# Запускаем приложение
CMD ["node", "src/app.js"]
