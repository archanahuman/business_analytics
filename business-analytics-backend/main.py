from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import pandas as pd
import uuid
import hashlib
import os
import requests

# ---------------- CONFIG ----------------
DATABASE_URL = "postgresql://postgres:archana123_05%40@localhost:5432/business_analytics"
engine = create_engine(DATABASE_URL)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- UTILS ----------------
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

def run_sql(query: str):
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [dict(row._mapping) for row in result]

def clean_sql(sql: str) -> str:
    sql = sql.strip()
    if sql.startswith("```"):
        sql = sql.replace("```sql", "").replace("```", "").strip()
    if sql.lower().startswith("sql"):
        sql = sql[3:].strip()
    return sql

def groq_sql_generator(question, table_name, columns):
    prompt = f"""
You are a PostgreSQL expert.

Table name: "{table_name}"

STRICT RULES:
- Use ONLY this table
- ALL column names MUST be wrapped in double quotes
- Use ONLY these columns:
{columns}
- Do NOT explain anything
- Return ONLY valid SQL

User question:
{question}
"""

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0
        }
    )

    raw_sql = response.json()["choices"][0]["message"]["content"]
    return clean_sql(raw_sql)

# ---------------- MODELS ----------------
class UserAuth(BaseModel):
    email: str
    password: str

class AskRequest(BaseModel):
    dataset_id: str
    query: str

# ---------------- AUTH ----------------
@app.post("/signup")
def signup(user: UserAuth):
    try:
        with engine.begin() as conn:
            conn.execute(
                text("INSERT INTO users (email, password) VALUES (:e, :p)"),
                {"e": user.email, "p": hash_password(user.password)}
            )
        return {"message": "Signup successful"}
    except:
        return {"error": "User already exists"}

@app.post("/login")
def login(user: UserAuth):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT email FROM users
                WHERE email = :e AND password = :p
            """),
            {"e": user.email, "p": hash_password(user.password)}
        ).fetchone()

    if result:
        return {"message": "Login successful", "email": result.email}

    return {"error": "Invalid credentials"}

# ---------------- UPLOAD CSV ----------------
@app.post("/upload-csv")
def upload_csv(user_email: str, file: UploadFile = File(...)):
    df = pd.read_csv(file.file)

    # user-friendly name
    dataset_name = file.filename.replace(".csv", "").replace(" ", "_")

    # safe internal table name
    table_name = f"data_{uuid.uuid4().hex[:6]}"

    df.to_sql(table_name, engine, index=False, if_exists="replace")

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO datasets (dataset_id, dataset_name, user_email, columns, rows)
                VALUES (:d, :n, :u, :c, :r)
            """),
            {
                "d": table_name,
                "n": dataset_name,
                "u": user_email,
                "c": df.columns.tolist(),
                "r": len(df)
            }
        )

    return {
        "dataset_id": table_name,
        "dataset_name": dataset_name,
        "rows": len(df)
    }

# ---------------- GET DATASETS ----------------
@app.get("/datasets")
def get_user_datasets(user_email: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT dataset_id, dataset_name, rows, created_at
                FROM datasets
                WHERE user_email = :u
                ORDER BY created_at DESC
            """),
            {"u": user_email}
        )
        return [dict(row._mapping) for row in result]

# ---------------- ASK QUESTION ----------------
@app.post("/ask")
def ask_question(req: AskRequest):
    df_sample = pd.read_sql(
        f'SELECT * FROM "{req.dataset_id}" LIMIT 1',
        engine
    )
    columns = df_sample.columns.tolist()

    sql = groq_sql_generator(req.query, req.dataset_id, columns)
    result = run_sql(sql)

    if not result:
        return {"answer_text": "No data found.", "data": [], "chart": None}

    df = pd.DataFrame(result)

    num_cols = df.select_dtypes(include="number").columns
    cat_cols = df.select_dtypes(include="object").columns

    chart = None
    if len(num_cols) >= 1 and len(cat_cols) >= 1:
        chart = {"x": cat_cols[0], "y": num_cols[0]}

    return {
        "answer_text": f"The result contains {len(df)} records.",
        "data": result,
        "chart": chart
    }
