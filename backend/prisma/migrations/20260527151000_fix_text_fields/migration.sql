-- AlterTable
ALTER TABLE `album` MODIFY `coverUrl` TEXT NULL,
    ALTER COLUMN `source` DROP DEFAULT;

-- AlterTable
ALTER TABLE `artist` MODIFY `bio` TEXT NULL,
    MODIFY `avatarUrl` TEXT NULL,
    ALTER COLUMN `source` DROP DEFAULT;

-- AlterTable
ALTER TABLE `likedmusic` ALTER COLUMN `title` DROP DEFAULT,
    ALTER COLUMN `artist` DROP DEFAULT,
    ALTER COLUMN `album` DROP DEFAULT,
    MODIFY `coverUrl` TEXT NULL,
    ALTER COLUMN `source` DROP DEFAULT;

-- AlterTable
ALTER TABLE `lyrics` MODIFY `content` TEXT NOT NULL,
    MODIFY `translated` TEXT NULL,
    ALTER COLUMN `format` DROP DEFAULT,
    MODIFY `timestamps` TEXT NULL,
    ALTER COLUMN `source` DROP DEFAULT;

-- AlterTable
ALTER TABLE `music` MODIFY `coverUrl` TEXT NULL,
    MODIFY `audioUrl` TEXT NULL,
    ALTER COLUMN `source` DROP DEFAULT,
    MODIFY `filePath` TEXT NULL,
    ALTER COLUMN `mimeType` DROP DEFAULT;

-- AlterTable
ALTER TABLE `playlist` MODIFY `description` TEXT NULL,
    MODIFY `coverUrl` TEXT NULL;

-- AlterTable
ALTER TABLE `systemconfig` MODIFY `value` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `password` TEXT NOT NULL,
    ALTER COLUMN `role` DROP DEFAULT,
    MODIFY `avatar` TEXT NULL,
    MODIFY `refreshToken` TEXT NULL;
