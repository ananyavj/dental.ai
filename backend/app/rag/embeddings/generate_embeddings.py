import json
# import os
import numpy as np
from tqdm import tqdm

from embeddings_utils import get_embedding
from vector_db.db_manager import save_index

DATA_PATH = "data/processed/chunks.json"

def generate_embeddings():

    with open(DATA_PATH) as f:
        chunks = json.load(f)

    vectors = []
    texts = []

    for chunk in tqdm(chunks):

        emb = get_embedding(chunk["text"])

        vectors.append(emb)
        texts.append(chunk["text"])

    save_index(np.array(vectors), texts)


if __name__ == "__main__":
    generate_embeddings()