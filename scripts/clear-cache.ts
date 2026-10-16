import { db } from "@/lib/db";

async function main() {
  const deleted = await db.analysisCache.deleteMany({});
  console.log(`Deleted ${deleted.count} cached entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
