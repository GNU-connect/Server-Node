/**
 * ! Executing this script will delete all data in your database and seed it with 10 users.
 * ! Make sure to adjust the script to your needs.
 * Use any TypeScript runner to run this script, for example: `npx tsx seed.ts`
 * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
 */
import { createSeedClient } from "@snaplet/seed";
import { faker } from '@snaplet/copycat';

const main = async () => {
  const seed = await createSeedClient();

  // Truncate all tables in the database
  await seed.$resetDatabase();

  // 카카오 사용자
  await seed.kakaoUsers((x) => x(10));

  // 식단 메뉴
  await seed.cafeteriaDiets((x) => x(10, {
    date: () => faker.date.soon({days: 2})
  }));

  // 학사 일정
  await seed.academicCalendars((x) =>
    x(10, {
      calendarType: () => faker.number.int({ min: 1, max: 2 }),
      startDate: () => faker.date.recent(),
      endDate: () => faker.date.future({ years: 1 }),
    })
  );
  
  console.log("Database seeded successfully!");

  process.exit();
};

main();