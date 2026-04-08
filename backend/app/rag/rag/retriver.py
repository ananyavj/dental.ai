import numpy as np
from embeddings.embeddings_utils import get_embedding
from vector_db.db_manager import load_index

index, texts = load_index()

def retrieve(query, k=5):

    query_vector = np.array([get_embedding(query)])

    distances, indices = index.search(query_vector, k)

    results = [texts[i] for i in indices[0]]

    return results