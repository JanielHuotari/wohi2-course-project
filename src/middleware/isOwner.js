const prisma = require("../lib/prisma");

const {NotFoundError} = require("../lib/errors");

const {ForbiddenError} = require("../lib/errors");

async function isOwner(req, res, next) {
    const QuestionId = Number(req.params.questionid);
    const question = await prisma.question.findUnique({
         where: {id: QuestionId},
        include: {keywords: true}
    });
    if (!question) {
        throw new NotFoundError("Question not found");
    }
    if (question.userId !== req.user.id) {
        throw new ForbiddenError("You can only modify your own questions");
    }

    req.question = question;
    next();
}
        
module.exports = isOwner;

