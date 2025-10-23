import { v4 as uuidv4, validate as isUuid } from "uuid";
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// === messages ===

export default router