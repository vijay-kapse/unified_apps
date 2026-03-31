import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional


class SessionStore:
    def __init__(self, db_path: Optional[str] = None):
        default_path = os.path.join(os.path.dirname(__file__), "chatbot_sessions.sqlite3")
        self.db_path = db_path or os.getenv("CHATBOT_SESSION_DB_PATH", default_path)
        self._init_db()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        try:
            conn.row_factory = sqlite3.Row
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_db(self):
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_token TEXT PRIMARY KEY,
                    username TEXT,
                    email TEXT NOT NULL,
                    name TEXT,
                    google_sub TEXT,
                    login_timestamp TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )

    def create_session(self, session_token: str, username: str, email: str, name: str, google_sub: str) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        session_data = {
            "session_token": session_token,
            "username": username,
            "email": email,
            "name": name or username,
            "google_sub": google_sub,
            "login_timestamp": now,
            "created_at": now,
        }
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO sessions (
                    session_token, username, email, name, google_sub, login_timestamp, created_at
                ) VALUES (
                    :session_token, :username, :email, :name, :google_sub, :login_timestamp, :created_at
                )
                """,
                session_data,
            )
        return session_data

    def get_session(self, session_token: Optional[str]) -> Optional[dict]:
        if not session_token:
            return None
        with self._connect() as conn:
            row = conn.execute(
                "SELECT session_token, username, email, name, google_sub, login_timestamp, created_at FROM sessions WHERE session_token = ?",
                (session_token,),
            ).fetchone()
        return dict(row) if row else None

    def delete_session(self, session_token: Optional[str]) -> None:
        if not session_token:
            return
        with self._connect() as conn:
            conn.execute("DELETE FROM sessions WHERE session_token = ?", (session_token,))
