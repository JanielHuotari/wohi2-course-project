/*
  Warnings:

  - You are about to drop the column `content` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `questions` table. All the data in the column will be lost.
  - Added the required column `answer` to the `questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `questions` DROP COLUMN `content`,
    DROP COLUMN `date`,
    ADD COLUMN `answer` TEXT NOT NULL;
