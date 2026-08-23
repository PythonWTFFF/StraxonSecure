import os
import psycopg2
from pgvector.psycopg2 import register_vector
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Straxon Cortex AI Service")

# Initialize OpenAI Client
client = OpenAI() if os.getenv("OPENAI_API_KEY") else None

def get_db_connection():
    conn_str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/straxon_v2")
    conn = psycopg2.connect(conn_str)
    try:
        register_vector(conn)
    except psycopg2.ProgrammingError:
        # Vector extension might not be created yet, which is fine during early boot
        pass
    return conn

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    answer: str

class SyncRequest(BaseModel):
    sourceType: str
    sourceId: str
    content: str
    organizationId: str

@app.get("/health")
def health_check():
    return {"status": "ok", "ai_enabled": client is not None}

@app.post("/embeddings/sync")
def sync_embedding(request: SyncRequest):
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        # 1. Generate embedding for the text content
        # We use text-embedding-3-small as standard
        response = client.embeddings.create(
            input=request.content,
            model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding

        # 2. Upsert into database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # We use a simple insert. In a real system, you'd handle updates/deletes based on sourceId.
        # But this works for our prototype.
        cursor.execute(
            '''
            INSERT INTO "AIInsight" ("id", "sourceType", "sourceId", "content", "embedding", "organizationId", "createdAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
            ''',
            (request.sourceType, request.sourceId, request.content, embedding, request.organizationId)
        )
        
        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
def handle_query(request: QueryRequest):
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Generate embedding for the user's query
        query_emb_resp = client.embeddings.create(
            input=request.query,
            model="text-embedding-3-small"
        )
        query_emb = query_emb_resp.data[0].embedding

        # Perform semantic search using cosine distance (<=>)
        # Assuming we just search globally for the prototype
        cursor.execute(
            '''
            SELECT "sourceType", "content" 
            FROM "AIInsight" 
            ORDER BY "embedding" <=> %s 
            LIMIT 5
            ''',
            (query_emb,)
        )
        results = cursor.fetchall()

        cursor.close()
        conn.close()

        # Build context from the vector search results
        context_blocks = []
        for row in results:
            context_blocks.append(f"Source: {row[0]}\nContent: {row[1]}")
        
        context_str = "\n\n".join(context_blocks)
        if not context_str:
            context_str = "No specific contextual documents found."

        system_prompt = (
            "You are Straxon Cortex, the AI Copilot for Straxon Labs command center. "
            "You have access to the company's knowledge base via semantic search. "
            "Answer the user's query based ONLY on the context provided below. "
            "If the context does not contain the answer, say you don't know.\n\n"
            f"CONTEXT:\n{context_str}"
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.query}
            ]
        )

        return QueryResponse(answer=response.choices[0].message.content or "")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
