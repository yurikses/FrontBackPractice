# Этап сборки (build)
FROM node:18-alpine AS builder

WORKDIR /app

# Устанавливаем pnpm (так как в проекте используется pnpm-lock.yaml)
RUN npm install -g pnpm

# Копируем манифесты зависимостей
COPY package.json pnpm-lock.yaml ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем остальной код и собираем приложение
COPY . .
RUN pnpm run build

# Этап раздачи статики (serve)
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа в директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Прокидываем 80 порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
