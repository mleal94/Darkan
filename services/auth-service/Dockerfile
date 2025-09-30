FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer puertos
EXPOSE 3001 5001

# Comando de inicio
CMD ["npm", "run", "start:prod"]
