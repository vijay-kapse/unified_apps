from fastapi import FastAPI, File, UploadFile, Form, Request, Response, Cookie, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
import os
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
import base64
import hashlib
import hmac
import json
import secrets
import glob
import time

app = FastAPI()

@app.get("/chatbot/")
@app.get("/chatbot", include_in_schema=False)
async def chatbot_root():
    return RedirectResponse("/chatbot/static/index.html")

os.environ["HUGGING_FACE_HUB_TOKEN"] = "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"

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")
app.mount("/chatbot/static", StaticFiles(directory=PUBLIC_DIR), name="chatbot_static")
print(f"Static files mounted from: {PUBLIC_DIR}")

USERS = {}  # username->password_hash
SESSIONS = {}  # session_token--> username

# --- Track all uploaded document titles for multi-file support ---
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

def _b64_decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def _validate_gateway_token(raw_token: str):
    try:
        payload_b64, sig_b64 = raw_token.split('.', 1)
    except ValueError:
        return None

    secret = os.getenv("GATEWAY_SESSION_SECRET")
    if not secret:
        return None

    expected_sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode("utf-8"), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    ).decode("utf-8").rstrip("=")
    if not hmac.compare_digest(sig_b64, expected_sig):
        return None

    try:
        payload = json.loads(_b64_decode(payload_b64))
    except Exception:
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    if not payload.get("email") or not payload.get("sub"):
        return None
    return payload


@app.get("/chatbot/shared-entry")
async def chatbot_shared_entry(gateway_token: str, next: str = "/chatbot/"):
    trusted_identity = _validate_gateway_token(gateway_token)
    if trusted_identity is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid gateway_token")

    username = trusted_identity["email"].split("@")[0]
    if username not in USERS:
        USERS[username] = hash_password("shared-login-placeholder")
    token = create_session(username)
    response = RedirectResponse(next)
    response.set_cookie(key="session_token", value=token, httponly=True)
    response.set_cookie(key="gateway_sub", value=str(trusted_identity.get("sub", "")), httponly=True)
    response.set_cookie(key="gateway_login_ts", value=str(trusted_identity.get("login_timestamp", "")), httponly=True)
    return response

@app.post("/chatbot/admin/register")
async def admin_register(username: str = Form(...), password: str = Form(...)):
    if username in USERS:
        return JSONResponse({"error": "Username already exists"}, status_code=400)
    USERS[username] = hash_password(password)
    return {"message": "Admin user registered successfully"}

@app.post("/chatbot/admin/login")
async def admin_login(response: Response, username: str = Form(...), password: str = Form(...)):
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
        # Clear the document titles from memory
        cleared_count = len(app.state.uploaded_document_titles)
        app.state.uploaded_document_titles = []
        
        # Delete temporary PDF files
        temp_files = glob.glob("temp_*.pdf")
        deleted_files = []
        
        for temp_file in temp_files:
            try:
                os.remove(temp_file)
                deleted_files.append(temp_file)
                print(f"Deleted temp file: {temp_file}")
            except OSError as e:
                print(f"Error deleting {temp_file}: {e}")
        
        print(f"Cleared {cleared_count} document titles and deleted {len(deleted_files)} temp files")
        
        return {
            "status": "success", 
            "message": f"Successfully cleared {cleared_count} documents and deleted {len(deleted_files)} temp files"
        }
        
    except Exception as e:
        print(f"Error clearing files: {e}")
        return JSONResponse(
            {"status": "error", "message": f"Failed to clear files: {str(e)}"}, 
            status_code=500
        )

@app.post("/chatbot/admin/logout")
async def admin_logout(response: Response, session_token: str = Cookie(None)):
    if session_token and session_token in SESSIONS:
        del SESSIONS[session_token]
    response.delete_cookie("session_token")
    return {"message": "Logged out"}

# --- Modified upload endpoint for multiple files ---
@app.post("/chatbot/upload")
async def upload_file(files: list[UploadFile] = File(...)):
    uploaded_titles = []
    for file in files:
        print(f"POST /upload called with file: {file.filename}")
        content = await file.read()
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as f:
            f.write(content)
        print(f"File saved as {temp_filename}")

        text, metadata = extract_text_from_pdf(temp_filename)
        print(f"Extracted text length: {len(text)} characters")

        title = os.path.splitext(file.filename)[0]
        doc_id = index_document(temp_filename, title, "Unknown Author", text, ["document"])
        print(f"Document indexed with ID: {doc_id}")

        uploaded_titles.append(title)

    # Store all uploaded document titles
    app.state.uploaded_document_titles.extend(uploaded_titles)

    return {
        "message": f"Successfully uploaded and indexed {len(files)} files",
        "uploaded": uploaded_titles,
        "total_files": len(app.state.uploaded_document_titles)
    }

@app.post("/chatbot/query")
async def query(query: str = Form(...)):
    print(f"POST /query called with query: {query}")
    # --- Pass all uploaded document titles to the chatbot ---
    response = chatbot_response(query, document_titles=app.state.uploaded_document_titles)
    print(f"Chatbot response generated (length: {len(response)})")
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI app...")
    uvicorn.run(app, host="0.0.0.0", port=8080)