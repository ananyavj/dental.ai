def build_prompt(context, question):

    prompt = f"""
You are a dental clinical assistant.

Answer only from the provided context.

Context:
{context}

Question:
{question}

Rules:
- Cite the information
- If not found say "insufficient evidence"
- Do not give personal diagnosis
"""

    return prompt