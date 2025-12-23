FROM oven/bun:1

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends git \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json bun.lockb ./
COPY prisma ./prisma
RUN bun install
RUN bunx prisma generate

COPY . .

CMD ["sh", "-c", "bunx prisma db push && bun run prod"]
