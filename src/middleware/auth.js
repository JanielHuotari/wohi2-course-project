const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET
const {UnauthorizedError} = require("../lib/errors");
const { ForbiddenError } = require("../lib/errors");

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError("No token provided");
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = {id: decoded.userId};
        next();
} catch (err) {
    req.log.warn({}, "Error authenticating");
        throw new ForbiddenError("Invalid or expired token");
    }
}

module.exports = authenticate;