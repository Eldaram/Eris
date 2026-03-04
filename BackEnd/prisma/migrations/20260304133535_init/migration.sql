-- CreateTable
CREATE TABLE "Postgres_Users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postgres_User_Alias" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "alias" TEXT NOT NULL,

    CONSTRAINT "Postgres_User_Alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postgres_Serveurs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_Serveurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postgres_User_Per_Server" (
    "user_id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_User_Per_Server_pkey" PRIMARY KEY ("user_id","server_id")
);

-- CreateTable
CREATE TABLE "Postgres_Server_Invites" (
    "id" UUID NOT NULL,
    "server_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_Server_Invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postgres_Rooms" (
    "id" UUID NOT NULL,
    "server_id" UUID,
    "name" TEXT,
    "is_dm" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postgres_Room_Participants" (
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Postgres_Room_Participants_pkey" PRIMARY KEY ("room_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Postgres_Server_Invites_code_key" ON "Postgres_Server_Invites"("code");

-- AddForeignKey
ALTER TABLE "Postgres_User_Alias" ADD CONSTRAINT "Postgres_User_Alias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Postgres_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_User_Alias" ADD CONSTRAINT "Postgres_User_Alias_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Postgres_Serveurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Serveurs" ADD CONSTRAINT "Postgres_Serveurs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Postgres_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_User_Per_Server" ADD CONSTRAINT "Postgres_User_Per_Server_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Postgres_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_User_Per_Server" ADD CONSTRAINT "Postgres_User_Per_Server_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Postgres_Serveurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Server_Invites" ADD CONSTRAINT "Postgres_Server_Invites_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Postgres_Serveurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Server_Invites" ADD CONSTRAINT "Postgres_Server_Invites_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Postgres_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Rooms" ADD CONSTRAINT "Postgres_Rooms_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "Postgres_Serveurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Room_Participants" ADD CONSTRAINT "Postgres_Room_Participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Postgres_Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Postgres_Room_Participants" ADD CONSTRAINT "Postgres_Room_Participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Postgres_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
