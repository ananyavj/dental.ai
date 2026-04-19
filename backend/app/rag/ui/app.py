import streamlit as st
import requests

API_URL = "http://localhost:8000/ask"

st.title("🦷 Dentist AI Assistant")

question = st.text_input("Ask a dentistry question")

if st.button("Ask"):

    response = requests.post(
        API_URL,
        json={"question": question}
    )

    answer = response.json()["answer"]

    st.write("### Answer")
    st.write(answer)