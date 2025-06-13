import express from "express";
import bodyParser from "body-parser";
import { Pool } from "pg";
import dotenv from "dotenv";

// Setup
dotenv.config();
const app = express();

// Use Express middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Quiz logic
let quiz = [];
let currentQuestion = {};
let totalCorrect = 0;

async function getQuizData() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM capitals");
    quiz = result.rows;
  } catch (error) {
    console.error("Error fetching quiz data:", error);
  } finally {
    client.release();
  }
}
await getQuizData();

function nextQuestion() {
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];
  currentQuestion = randomCountry;
}

app.get("/", async (req, res) => {
  totalCorrect = 0;
  nextQuestion();
  res.send(currentQuestion); // For JSON response
});

app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  nextQuestion();
  res.send({
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Export Express app as a Vercel function
export default app;
