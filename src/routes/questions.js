const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const isOwner = require("../middleware/isOwner");
const authenticate = require("../middleware/auth");
router.use(authenticate);


// GET /api/questions, /api/questions?keyword=Helsinki
router.get("/", async (req, res) => {

    const keyword = req.query.keyword;

    const where = keyword ?
    { keywords: {some: { name: keyword } } } : {};

    const filteredQuestions = await prisma.question.findMany({
        where,
        include: { keywords: true },
        orderBy: { id: "asc" }
    });

res.json(filteredQuestions);
});

// GET /api/questions/:questionid
router.get("/:questionid", async (req, res) => {
    const questionId = Number(req.params.questionid);
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { keywords: true }
    }); 
    if (!question) {
        return res.status(404).json({ msg: "Question not found" });
    }
    res.json(question);
});


// POST /api/questions
router.post("/", async (req, res) => {
    const { question, answer, keywords } = req.body;
    if(!question || !answer) {
        return res.status(400).json({ msg: "Question and answer are required" });
    }

    const keywordsArray = Array.isArray(keywords) ? keywords : [];

    const newQuestion = await prisma.question.create({
        data: {
            question,
            answer,
            userId: req.user.id,
            keywords: {
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw },
                    create: { name: kw },
                })),
            },
        },
        include: { keywords: true }
    });
    
    res.status(201).json(newQuestion);
});


// PUT /api/questions/:questionid
router.put("/:questionid", isOwner, async (req, res) => {
const questionId = Number(req.params.questionid);
const { question, answer, keywords } = req.body;
    
const existingQuestion = await prisma.question.findUnique({
        where: { id: questionId }
    });

    if (!existingQuestion) {
        return res.status(404).json({ msg: "Question not found" });
    }

    if(!question || !answer) {
        return res.status(400).json({ msg: "Question and answer are required" });
    }
   
const keywordsArray = Array.isArray(keywords) ? keywords : [];

const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
        question, answer, keywords: {
            set: [],
            connectOrCreate: keywordsArray.map((kw) => ({
                where: { name: kw },
                create: { name: kw },
            })),
        },
    },
    include: { keywords: true }

});
res.json(updatedQuestion);
});

// DELETE /api/questions/:questionid
router.delete("/:questionid", isOwner, async (req, res) => {
    const questionId = Number(req.params.questionid);
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { keywords: true },
    });
   
    if (!question) {
        return res.status(404).json({ msg: "Question not found" });
    }
    
    await prisma.question.delete({
        where: { id: questionId },
        include: { keywords: true },
    });

    res.json({"msg": "Question deleted succesfully",
        question: question
    });
});


module.exports = router;