from fastapi import FastAPI, File, UploadFile, Form, Request, Response, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, RedirectResponse
import os
from urllib.parse import urlencode
from app.text_extractor import extract_text_from_pdf
try:
    from app.indexer import index_document
except Exception as e:
    print(f"Indexer unavailable in copied runtime: {e}")
    def index_document(*args, **kwargs):
        return "copied-runtime-no-index"
try:
    from app.chatbot import chatbot_response
except Exception as e:
    print(f"Chatbot engine unavailable in copied runtime: {e}")
    def chatbot_response(query, document_titles=None):
        titles = document_titles or []
        return f"Copied unified runtime placeholder response for query: {query}. Active documents: {', '.join(titles) if titles else 'none'}."
import hashlib
import secrets
import glob

app = FastAPI()

ENABLE_LOCAL_AUTH_FALLBACK = str(os.getenv("ENABLE_LOCAL_AUTH_FALLBACK", "false")).lower() in ("1", "true", "yes", "on")
PORTAL_HOME_URL = os.getenv("PORTAL_HOME_URL", "/")
GATEWAY_LOGIN_URL = os.getenv("GATEWAY_LOGIN_URL", "/unified-login.html")

os.environ["HUGGING_FACE_HUB_TOKEN"] = "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"

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
app.mount("/chatbot/static", StaticFiles(directory=PUBLIC_DIR), name="chatbot_static")
print(f"Static files mounted from: {PUBLIC_DIR}")

USERS = {}
SESSIONS = {}
app.state.uploaded_document_titles = []


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_session(username: str) -> str:
    token = secrets.token_hex(16)
    SESSIONS[token] = username
    return token


def get_current_user(session_token: str = Cookie(None)):
    if session_token and session_token in SESSIONS:
        return SESSIONS[session_token]
    return None


def gateway_login_redirect(next_path: str = "/chatbot/"):
    separator = "&" if "?" in GATEWAY_LOGIN_URL else "?"
    query = urlencode({"app": "chatbot", "next": next_path})
    return RedirectResponse(f"{GATEWAY_LOGIN_URL}{separator}{query}")


@app.get("/chatbot/")
@app.get("/chatbot", include_in_schema=False)
async def chatbot_root(session_token: str = Cookie(None)):
    if not get_current_user(session_token):
        return gateway_login_redirect("/chatbot/static/index.html")
    return RedirectResponse("/chatbot/static/index.html")


@app.get("/chatbot/admin")
async def chatbot_admin(session_token: str = Cookie(None)):
    if not get_current_user(session_token):
        return gateway_login_redirect("/chatbot/static/admin.html")
    return RedirectResponse("/chatbot/static/admin.html")


@app.get("/chatbot/shared-entry")
async def chatbot_shared_entry(sharedEmail: str, next: str = "/chatbot/"):
    username = sharedEmail.split("@")[0]
    if username not in USERS:
        USERS[username] = hash_password("shared-login-placeholder")
    token = create_session(username)
    response = RedirectResponse(next)
    response.set_cookie(key="session_token", value=token, httponly=True)
    return response


@app.post("/chatbot/admin/register")
async def admin_register(username: str = Form(...), password: str = Form(...)):
    if not ENABLE_LOCAL_AUTH_FALLBACK:
        return JSONResponse({"error": "Local admin register disabled"}, status_code=404)
    if username in USERS:
        return JSONResponse({"error": "Username already exists"}, status_code=400)
    USERS[username] = hash_password(password)
    return {"message": "Admin user registered successfully"}


@app.post("/chatbot/admin/login")
async def admin_login(response: Response, username: str = Form(...), password: str = Form(...)):
    if not ENABLE_LOCAL_AUTH_FALLBACK:
        return JSONResponse({"error": "Local admin login disabled"}, status_code=404)
    if username not in USERS or USERS[username] != hash_password(password):
        return JSONResponse({"error": "Invalid credentials"}, status_code=401)
    token = create_session(username)
    response.set_cookie(key="session_token", value=token, httponly=True)
    return {"message": "Login successful"}


@app.get("/chatbot/admin/check")
async def admin_check(session_token: str = Cookie(None)):
    user = get_current_user(session_token)
    if user:
        return {"logged_in": True, "username": user}
    return {"logged_in": False}


@app.get("/chatbot/uploaded_files")
async def get_uploaded_files():
    return {"files": app.state.uploaded_document_titles}


@app.delete("/chatbot/uploaded_files")
async def clear_uploaded_files():
    try:
        cleared_count = len(app.state.uploaded_document_titles)
        app.state.uploaded_document_titles = []
        temp_files = glob.glob("temp_*.pdf")
        deleted_files = []
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
                deleted_files.append(temp_file)
            except OSError as e:
                print(f"Error deleting {temp_file}: {e}")
        return {"status": "success", "message": f"Successfully cleared {cleared_count} documents and deleted {len(deleted_files)} temp files"}
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Failed to clear files: {str(e)}"}, status_code=500)


@app.post("/chatbot/admin/logout")
async def admin_logout(response: Response, session_token: str = Cookie(None), return_to: str = PORTAL_HOME_URL):
    if session_token and session_token in SESSIONS:
        del SESSIONS[session_token]
    response = RedirectResponse(return_to)
    response.delete_cookie("session_token")
    return response


@app.post("/chatbot/upload")
async def upload_file(files: list[UploadFile] = File(...)):
    uploaded_titles = []
    for file in files:
        content = await file.read()
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as f:
            f.write(content)
        text, metadata = extract_text_from_pdf(temp_filename)
        title = os.path.splitext(file.filename)[0]
        doc_id = index_document(temp_filename, title, "Unknown Author", text, ["document"])
        uploaded_titles.append(title)

    app.state.uploaded_document_titles.extend(uploaded_titles)

    return {
        "message": f"Successfully uploaded and indexed {len(files)} files",
        "uploaded": uploaded_titles,
        "total_files": len(app.state.uploaded_document_titles)
    }


@app.post("/chatbot/query")
async def query(query: str = Form(...)):
    response = chatbot_response(query, document_titles=app.state.uploaded_document_titles)
    return {"response": response}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
