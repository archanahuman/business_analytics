import streamlit as st
import requests
import pandas as pd
import plotly.express as px

BACKEND_URL = "http://127.0.0.1:8000"

st.set_page_config("Business Analytics", layout="wide")
st.title("📊 Business Analytics Application")

# ---------------- SESSION ----------------
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "dataset_id" not in st.session_state:
    st.session_state.dataset_id = ""

# ---------------- AUTH ----------------
st.subheader("Login / Signup")
mode = st.radio("Select", ["Login", "Signup"])
email = st.text_input("Email")
password = st.text_input("Password", type="password")

if st.button(mode):
    res = requests.post(
        f"{BACKEND_URL}/{mode.lower()}",
        json={"email": email, "password": password}
    )
    data = res.json()
    if "message" in data:
        st.success(data["message"])
        st.session_state.logged_in = True
    else:
        st.error(data["error"])

st.divider()

# ---------------- UPLOAD CSV ----------------
if st.session_state.logged_in:
    uploaded = st.file_uploader("Upload CSV", type=["csv"])
    if uploaded and st.button("Upload"):
        res = requests.post(
            f"{BACKEND_URL}/upload-csv",
            files={"file": uploaded},
            params={"user_email": email}
        )
        data = res.json()
        st.session_state.dataset_id = data["dataset_id"]
        st.success("CSV Uploaded")
        st.write("Columns:", data["columns"])

# ---------------- ASK QUESTION ----------------
if st.session_state.dataset_id:
    st.subheader("Ask any question about your data")
    question = st.text_input("Ask in natural language")

    if st.button("Ask"):
        res = requests.post(
            f"{BACKEND_URL}/ask",
            json={
                "dataset_id": st.session_state.dataset_id,
                "query": question
            }
        )
        data = res.json()

        st.subheader("Answer")
        st.write(data["answer_text"])

        df = pd.DataFrame(data["data"])
        st.dataframe(df)

        if not df.empty:
            fig = px.bar(df, x=df.columns[0], y=df.columns[1])
            st.plotly_chart(fig)
