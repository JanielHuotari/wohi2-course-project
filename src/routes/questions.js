const express = require("express");
const router = express.Router();
const questions = require("../data/questions");

// GET /api/questions, /api/questions?keyword=Helsinki
router.get("/", (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword) {
    return res.json(questions);
    }
    const filteredQuestions = questions.filter(q =>q.keywords.includes(keyword));
    res.json(filteredQuestions);
});

// GET /api/questions/:questionid
router.get("/:questionid", (req, res) => {
    const questionId = Number(req.params.questionid);
    const question = questions.find(q => q.id === questionId);
    if (!question) {
        return res.status(404).json({ msg: "Question not found" });
    }
    res.json(question);
});

router.post("/", (req, res) => {
    const { question, answer, keywords } = req.body;
    if(!question || !answer) {
        return res.status(400).json({ msg: "Question and answer are required" });
    }

    const existingQuestionId = questions.map(q => q.id);
    const maxQuestionId = Math.max(...existingQuestionId);
    const newQuestion = {
        id:questions.length ? maxQuestionId + 1 : 1,
        question,answer, keywords,
        keywords: Array.isArray(keywords) ? keywords : []
    };
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
});


// PUT /api/questions/:questionid
router.put("/:questionid", (req, res) => {

const questionId = Number(req.params.questionid);
    const existingQuestion = questions.find(q => q.id === questionId);
    if (!existingQuestion) {
        return res.status(404).json({ msg: "Question not found" });
    }

    const { question, answer, keywords } = req.body;
    if(!question || !answer) {
        return res.status(400).json({ msg: "Question and answer are required" });
    }
    existingQuestion.question = question;
    existingQuestion.answer = answer;
    existingQuestion.keywords = Array.isArray(keywords) ? keywords : [];
    res.json(existingQuestion);
});

// DELETE /api/questions/:questionid
router.delete("/:questionid", (req, res) => {
    const questionId = Number(req.params.questionid);
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
        return res.status(404).json({ msg: "Question not found" });
    }
    const deletedQuestion = questions.splice(questionIndex, 1);
    res.json({"msg": "Question deleted succesfully",
        question: deletedQuestion
    });
});


module.exports = router;