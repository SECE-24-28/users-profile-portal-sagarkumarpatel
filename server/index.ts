import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// 1. Import Prisma Postgres specific driver adapter requirements
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client";

// Initialize environment configurations
dotenv.config();

const PORT = 5000;
const app = express();

// 2. Setup Driver Adapter instead of raw instantiation 
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-student-token-key-2026";

// GraphQL Schema
const typeDefs = `#graphql
  type Student {
    id: ID!
    email: String!
    name: String!
    profile: Profile
  }

  type Profile {
    id: ID!
    avatarUrl: String
    bio: String
    phone: String
  }

  type Query {
    students: [Student!]!
    student(id: ID!): Student
  }

  type Mutation {
    addStudent(email: String!, name: String!, avatarUrl: String, bio: String, phone: String): Student!
    updateStudent(id: ID!, name: String, avatarUrl: String, bio: String, phone: String): Student!
    deleteStudent(id: ID!): String!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    students: async () => {
      return await prisma.student.findMany({
        include: { profile: true },
      });
    },
    student: async (_: any, { id }: { id: string }) => {
      return await prisma.student.findUnique({
        where: { id },
        include: { profile: true },
      });
    },
  },

  Mutation: {
    addStudent: async (_: any, args: any) => {
      const { email, name, avatarUrl, bio, phone } = args;
      return await prisma.student.create({
        data: {
          email,
          name,
          password: "hashed_default_password",
          profile: {
            create: { avatarUrl, bio, phone },
          },
        },
        include: { profile: true },
      });
    },

    updateStudent: async (_: any, args: any) => {
      const { id, name, avatarUrl, bio, phone } = args;
      return await prisma.student.update({
        where: { id },
        data: {
          ...(name && { name }),
          profile: {
            upsert: {
              create: { avatarUrl, bio, phone },
              update: { avatarUrl, bio, phone },
            },
          },
        },
        include: { profile: true },
      });
    },

    deleteStudent: async (_: any, { id }: { id: string }) => {
      await prisma.student.delete({ where: { id } });
      return `Student with ID ${id} deleted successfully.`;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  app.use(cors());
  app.use(express.json());

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization?.split(" ")[1] || "";
        let loggedInUser = null;
        if (token) {
          try {
            loggedInUser = jwt.verify(token, JWT_SECRET);
          } catch (err) {
            console.warn("Invalid token");
          }
        }
        return { prisma, loggedInUser };
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 GraphQL backend running at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((err) => console.error(err));