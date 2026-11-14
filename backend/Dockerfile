FROM node:20-alpine

WORKDIR /app

# Copia manifestos de dependência
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
