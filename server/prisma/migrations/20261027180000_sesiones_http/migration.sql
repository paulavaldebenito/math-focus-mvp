-- CreateTable
CREATE TABLE "http_session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "http_session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "http_session_expire_idx" ON "http_session"("expire");

