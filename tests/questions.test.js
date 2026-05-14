const{resetDb, registerAndLogin, request, app, prisma, createQuestion} = require("./helpers");


beforeEach(resetDb);

describe("question tests", () => {


it("returns 401 without token", async () => {
    const res = await request(app).get("/api/questions");
    expect(res.status).toBe(401);
});

it("returns 404 for unknown question", async () => {
    const token = await registerAndLogin();
    const res = await request(app).get("/api/questions/999999")
    .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Question not found");
});

it("returns 400 for invalid question body", async () => {
    const token = await registerAndLogin();
    const res = await request(app)
    .post("/api/questions")
    .set("Authorization", `Bearer ${token}`)
    .send({question: "", answer: "Test answer"});
    expect(res.status).toBe(400);

})

it("correct answer creates correct attempt", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, {
    question: "Capital of Finland?",
    answer: "Helsinki"
    });

    const res = await request(app)
    .post(`/api/questions/${question.id}/play`)
    .set("Authorization", `Bearer ${token}`)
    .send({answer: "Helsinki"});

    expect(res.status).toBe(201);
    expect(res.body.correct).toBe(true);
    

    const attempt = await prisma.attempt.findFirst({
        where: {questionId:question.id}
    });

    expect(attempt.correct).toBe(true);
});

it("correct answer creates correct attempt", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, {
    question: "Capital of Finland?",
    answer: "Helsinki"
    });

    const res = await request(app)
    .post(`/api/questions/${question.id}/play`)
    .set("Authorization", `Bearer ${token}`)
    .send({answer: "Turku"});

    expect(res.status).toBe(201);
    expect(res.body.correct).toBe(false);
    

    const attempt = await prisma.attempt.findFirst({
        where: {questionId:question.id}
    });

    expect(attempt.correct).toBe(false);
});

it("returns 400 when answer empty", async () => {
    const token = await registerAndLogin();
    const question = await createQuestion(token, {
    question: "Capital of Finland?",
    answer: "Helsinki"
    });
    
    const res = await request(app)
    .post(`/api/questions/${question.id}/play`)
    .set("Authorization",`Bearer ${token}`)
    .send({answer:""});

    expect(res.status).toBe(400);
})


});