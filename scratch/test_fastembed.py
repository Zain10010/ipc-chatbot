from langchain_community.embeddings.fastembed import FastEmbedEmbeddings

print("Initializing FastEmbed...")
try:
    embeddings = FastEmbedEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    print("Embedding a test query...")
    vec = embeddings.embed_query("what is ipc 34")
    print(f"Success! Vector length: {len(vec)}")
    print(f"First 5 dimensions: {vec[:5]}")
except Exception as e:
    print(f"Failed: {e}")
