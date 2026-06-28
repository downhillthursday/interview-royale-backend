import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from 'express';

const getRateLimitKey = (req: Request): string => {
  return (
    req.user?.uid ??
    ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? "anonymous")
  );
};

export const groqRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many AI requests. Please try again later.',
    });
  },
});
