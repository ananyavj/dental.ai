import faiss
import pickle
import numpy as np

INDEX_PATH = "vector_db/faiss_index/index.faiss"
META_PATH = "vector_db/faiss_index/meta.pkl"


def save_index(vectors, texts):

    dimension = vectors.shape[1]

    index = faiss.IndexFlatL2(dimension)
    index.add(vectors)

    faiss.write_index(index, INDEX_PATH)

    with open(META_PATH, "wb") as f:
        pickle.dump(texts, f)


def load_index():

    index = faiss.read_index(INDEX_PATH)

    with open(META_PATH, "rb") as f:
        texts = pickle.load(f)

    return index, texts