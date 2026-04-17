// Initializes and exports the singleton Prisma client used across all
// database modules.  Uses the pg adapter so Prisma connects through a
// connection pool rather than a single long-lived connection.

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";

// CONN_STRING must be set in the environment (see server/.env.example)
const connectionString: string = process.env.CONN_STRING!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
