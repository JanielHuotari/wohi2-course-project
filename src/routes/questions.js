const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const isOwner = require("../middleware/isOwner");
const authenticate = require("../middleware/auth");
router.use(authenticate);
const multer = require("multer");
const {NotFoundError} = require("../lib/errors");
const {z} = require("zod");
const {ValidationError} = require("../lib/errors");
const {CloudinaryStorage} = require("multer-storage-cloudinary");
const cloudinary = require("../lib/cloudinary");


const PostInput = z.object({
    question: z.string().min(1),
    answer: z.string().min(1),
    keywords: z.union([z.string(), z.array(z.string())]).optional()
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "quiz-images",
        allowed_formats: ["jpg", "jpeg", "png"],
    }  
});
 

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image")) {
            cb(null, true);
        } else {
            cb(new Error("Only images allowed"));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

function formatQuestion(question) {
    return {
    ...question,
    keywords: question.keywords.map(k => k.name),
    userName: question.user ? question.user.name : null,
    solved: question.attempt && question.attempt.length >0,
    correctCount: question._count?.attempt ?? 0, 
    user: undefined,
    _count: undefined,
    attempt: undefined
    };
}

// GET /api/questions, /api/questions?keyword=http&page=1&limit=5
router.get("/", async (req, res) => {

    const {keyword} = req.query;

    const where = keyword ?
    { keywords: {some: { name: keyword } } } : {};


    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

    const [filteredQuestions, total] = await Promise.all([ prisma.question.findMany({
        
            where,
            include: { keywords: true,
                 user: true,
                 attempt: {where: {userId: req.user.id}, take: 1},
                 _count: {select: {attempt: true}}
                 },
            orderBy: { id: "asc" },
            skip,
            take: limit
        }), prisma.question.count({where})
    ]);
    

res.json({
    data: filteredQuestions.map(formatQuestion),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),

})
});

// GET /api/questions/:questionid
router.get("/:questionid", async (req, res) => {
    const questionId = Number(req.params.questionid);
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: { keywords: true, user: true }
    }); 
    if (!question) {
        throw new NotFoundError("Question not found");
    }
    res.json(formatQuestion(question));
});


// POST /api/questions
router.post("/", upload.single("image"), async (req, res) => {
    const { question, answer, keywords } = PostInput.parse(req.body);


    const keywordsArray = Array.isArray(keywords) ? keywords : [];

const imageUrl = req.file ? req.file.path : null;

    const newQuestion = await prisma.question.create({
        data: {
            question,
            answer,
            userId: req.user.id,
            imageUrl,
            keywords: {
                connectOrCreate: keywordsArray.map((kw) => ({
                    where: { name: kw },
                    create: { name: kw },
                })),
            },
        },
        include: { keywords: true, user: true }
    });
    
    res.status(201).json(newQuestion);
});


// PUT /api/questions/:questionid
router.put("/:questionid", upload.single("image"), isOwner, async (req, res) => {
const questionId = Number(req.params.questionid);
    const { question, answer, keywords } = PostInput.parse(req.body);
    
const existingQuestion = await prisma.question.findUnique({
        where: { id: questionId }
    });

    if (!existingQuestion) {
        throw new NotFoundError("Question not found");}

    if(!question || !answer) {
        throw new ValidationError("Question and answer are required");
    }
   
    const imageUrl = req.file ? req.file.path : null;

const keywordsArray = Array.isArray(keywords) ? keywords : [];

const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
        question, answer, imageUrl, keywords: {
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
        where: {id: questionId},
        include: {keywords: true, user: true},
    });
   
    if (!question) {
        throw new NotFoundError("Question not found");}

      await prisma.attempt.deleteMany({
    where: { questionId }
  });

   await prisma.question.update({
    where: { id: questionId },
    data: {
      keywords: {
        set: [],
      },
    },
  });
    
    await prisma.question.delete({
        where: {id: questionId},
        include: {keywords: true},
    });

    res.json({"msg": "Question deleted succesfully",
        question: question
    });
});


router.post("/:questionid/play", async (req, res) => {
    const questionId = Number(req.params.questionid);
    const answer = req.body.answer;
    
    if (!answer) {
        throw new ValidationError("Answer is required");
        }
    const question = await prisma.question.findUnique({
        where: {id: questionId},
    });
    if (!question) {
        throw new NotFoundError("Question not found");}

    const correctAnswer = answer === question.answer;

    const attempt = await prisma.attempt.create({
        data: {
            questionId,
            userId: req.user.id,
            userAnswer: answer,
            correct: correctAnswer
        }
    });

    res.status(201).json({
        id: attempt.id,
        questionId,
        correct: correctAnswer,
        submittedAnswer: answer,
        createdAt: attempt.createdAt,
        correctAnswer: question.answer
    });
});



module.exports = router;