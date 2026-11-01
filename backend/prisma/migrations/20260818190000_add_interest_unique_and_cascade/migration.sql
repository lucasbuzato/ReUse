-- ReUse! - proteção contra interesses duplicados e exclusão em cascata de interesses ao remover um item.
CREATE UNIQUE INDEX "interests_userId_itemId_key" ON "interests"("userId", "itemId");

ALTER TABLE "interests"
DROP CONSTRAINT IF EXISTS "interests_itemId_fkey";

ALTER TABLE "interests"
ADD CONSTRAINT "interests_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
