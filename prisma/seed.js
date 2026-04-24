const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");



  
    const seedQuestions = [
  {
    id: 1,
    question: "Capital of Finland?",
    answer: "Helsinki",
    keywords: ["Helsinki"]
    
  },
  {
    id: 2,
    question: "Height of basketball hoop?",
    answer: "3.05 meters",
    keywords: ["basketball"]
  },
];

async function main() {
  await prisma.question.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.user.deleteMany();


const hashedPassword = await bcrypt.hashSync("1234", 10);

  const user = await prisma.user.create({
    data: {
      email: "example@example.org",
      password: hashedPassword,
      name: "Example User",
    },
  });
  console.log("Created user:", user);


  for (const question of seedQuestions) {
    await prisma.question.create({
      data: {
        question: question.question,
        answer: question.answer,
        userId: user.id,
        
        keywords: {
          connectOrCreate: question.keywords.map((kw) => ({
            where: { name: kw },
            create: { name: kw },
          })),
        },
      },
    });
  }

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
