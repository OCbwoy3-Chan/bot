FROM oven/bun:1

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lockb ./
COPY prisma ./prisma
RUN bun install
RUN bunx prisma generate

COPY . .

CMD ["sh", "-c", "bunx prisma db push && bun run prod"]
