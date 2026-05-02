const prisma = require("../lib/prisma");

async function isOwner(req, res, next) {
    const QuestionId = Number(req.params.questionid);
    const question = await prisma.question.findUnique({
         where: {id: QuestionId},
        include: {keywords: true}
    });
    if (!question) {
        return res.status(404).json({ message: "Question not found" });
    }
    if (question.userId !== req.user.id) {
        return res.status(403).json({ error: "You can only modify your own questions" });
    }

    req.question = question;
    next();
}
        
module.exports = isOwner;

