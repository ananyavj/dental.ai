import os
from openai import OpenAI
from rag.retriver import retrieve
from rag.prompt_builder import build_prompt
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def run_rag(query):

    docs = retrieve(query)

    context = "\n".join(docs)

    prompt = build_prompt(context, query)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You are a dental medical assistant"},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content