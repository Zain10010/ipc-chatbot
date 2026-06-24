import os
import re
import shutil
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_groq import ChatGroq

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="IPC Chatbot Backend")

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
vector_store = None
llm = None
chat_history = []

BASE_DIR = os.path.dirname(__file__)
if os.path.basename(BASE_DIR) == "backend":
    PROJECT_ROOT = os.path.dirname(BASE_DIR)
else:
    PROJECT_ROOT = BASE_DIR

DB_PATH = os.path.join(PROJECT_ROOT, "ipc_faiss_db")
PDF_PATH = os.path.join(PROJECT_ROOT, "ipc.pdf")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def initialize_db():
    global vector_store, llm
    
    print("Initializing LLM...")
    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.1-8b-instant"
    )
    
    print("Initializing Embeddings...")
    embeddings = FastEmbedEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    if os.path.exists(DB_PATH):
        print("Loading existing FAISS database...")
        vector_store = FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)
    else:
        print("Creating new FAISS database from PDF...")
        if not os.path.exists(PDF_PATH):
            print(f"Error: PDF not found at {PDF_PATH}")
            return
        
        reader = PdfReader(PDF_PATH)
        text = ""
        for page in reader.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text

        text = text.replace("\n", " ").replace("  ", " ")
        text = re.sub(r'(\d)\s+(\d)\s+(\d)', r'\1\2\3', text)
        text = re.sub(r'\s+', ' ', text)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=1000
        )
        chunks = text_splitter.split_text(text)
        
        vector_store = FAISS.from_texts(chunks, embeddings)
        vector_store.save_local(DB_PATH)
        print("New Database Created Successfully")

@app.on_event("startup")
async def startup_event():
    initialize_db()

class ChatRequest(BaseModel):
    message: str
    mode: str = "ipc_chat"

class ChatResponse(BaseModel):
    response: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    global chat_history
    
    if vector_store is None or llm is None:
        raise HTTPException(status_code=500, detail="Database or LLM not initialized. Is the PDF present in the root folder?")

    user_question = request.message
    mode = request.mode
    
    context = ""
    if mode == "ipc_chat":
        docs = vector_store.similarity_search(
            user_question + " ipc section punishment law legal meaning",
            k=3
        )
        for doc in docs:
            context += doc.page_content + "\n\n"
        
    history_text = ""
    for item in chat_history:
        history_text += f"User: {item['question']}\nAssistant: {item['answer']}\n"
        
    if mode == "summarize":
        final_prompt = f"""
        You are a highly skilled professional summarizer.
        Provide a concise, comprehensive summary of the following text.
        Extract the key points and present them clearly.
        
        Text to summarize:
        {user_question}
        """
    elif mode == "sentiment":
        final_prompt = f"""
        You are an expert Sentiment Analyzer.
        Analyze the sentiment of the following text. 
        Start your response with exactly one of these words: [POSITIVE], [NEGATIVE], or [NEUTRAL].
        Then, provide a brief 1-2 sentence explanation of why.
        
        Text to analyze:
        {user_question}
        """
    elif mode == "translate":
        final_prompt = f"""
        You are an expert Polyglot Translator.
        Translate the following text to English (if it is not in English) or to Hindi (if it is in English).
        If the user specifies a target language in the prompt, translate to that language instead.
        Provide ONLY the translation, without any conversational filler.
        
        Text to translate:
        {user_question}
        """
    else:
        # Default ipc_chat mode
        final_prompt = f"""
        You are an intelligent Indian Penal Code legal assistant chatbot.

        Answer naturally like ChatGPT.

        Use IPC context and previous conversation history.

        Rules:
        - Explain IPC sections properly.
        - Mention punishments if available.
        - Give simple and clear answers.
        - Give closest relevant answer if exact section is not perfectly found.
        - Do not say 'context not found' immediately.
        - Format your answer in simple Markdown if helpful.

        Previous Conversation:
        {history_text}

        IPC Context:
        {context}

        User Question:
        {user_question}

        Answer:
        """
    
    try:
        response = llm.invoke(final_prompt)
        answer = response.content
        
        chat_history.append({
            "question": user_question,
            "answer": answer
        })
        
        # Keep history manageable
        if len(chat_history) > 10:
            chat_history = chat_history[-10:]
            
        return ChatResponse(response=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/history")
async def clear_history():
    global chat_history
    chat_history = []
    return {"status": "history cleared"}
