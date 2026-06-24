from langchain_community.embeddings import HuggingFaceHubEmbeddings
import os

print("Initializing Hub Embeddings...")
embeddings = HuggingFaceHubEmbeddings(
    model="sentence-transformers/all-MiniLM-L6-v2",
    huggingfacehub_api_token=os.getenv("HF_TOKEN")
)

print("Embedding a test query...")
try:
    vec = embeddings.embed_query("what is ipc 34")
    print(f"Success! Vector length: {len(vec)}")
    print(f"First 5 dimensions: {vec[:5]}")
except Exception as e:
    print(f"Failed: {e}")
