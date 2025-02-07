import sqlite3


class SQLiteDB:
    def __init__(self, db_name="db/test.db"):
        """Initialize the database connection."""
        self.db_name = db_name
        self.connection = None
        self.cursor = None
        self.connect()

    def connect(self):
        """Establish a connection to the SQLite database."""
        try:
            self.connection = sqlite3.connect(self.db_name, check_same_thread=False)
            self.cursor = self.connection.cursor()
        except sqlite3.Error as e:
            print(f"Error connecting to database: {e}")

    def execute_query(self, query, params=()):
        """Execute a SQL query."""
        try:
            self.cursor.execute(query, params)
            self.connection.commit()
        except sqlite3.Error as e:
            print(f"Error executing query: {e}")

    def fetch_all(self, query, params=()):
        """Execute a SELECT query and fetch all results."""
        try:
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except sqlite3.Error as e:
            print(f"Error fetching data: {e}")
            return []

    def close(self):
        """Close the database connection."""
        if self.connection:
            self.connection.close()

    def get_user_name(self, user_id):
        """Retrieve the name of a user given their ID."""
        try:
            self.cursor.execute("SELECT name FROM users WHERE id = ?", (user_id,))
            result = self.cursor.fetchone()
            return result[0] if result else None
        except sqlite3.Error as e:
            print(f"Error fetching user name: {e}")
            return None


# Example usage
if __name__ == "__main__":
    db = SQLiteDB()
    db.execute_query(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)"
    )
    db.execute_query("INSERT INTO users (name) VALUES (?)", ("Alice",))
    users = db.fetch_all("SELECT * FROM users")
    print(users)
    db.close()
