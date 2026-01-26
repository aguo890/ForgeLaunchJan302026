import os
import subprocess
import sys
import datetime
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
DEVLOG_FILE = ROOT_DIR / "DEVLOG.md"  # <--- New Log File Path

try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError:
    print("⚠️  Missing dependencies (openai, python-dotenv).")
    print("   Please run: pip install openai python-dotenv")
    sys.exit(1)

load_dotenv(ROOT_DIR / ".env")

def get_staged_diff():
    """Get the diff of currently staged files."""
    result = subprocess.run(
        ["git", "diff", "--cached"], 
        capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=ROOT_DIR
    )
    return result.stdout or ""

def get_staged_files():
    """Get the list of staged files."""
    result = subprocess.run(
        ["git", "diff", "--name-only", "--cached"], 
        capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=ROOT_DIR
    )
    return result.stdout or ""

def generate_devlog_entry(client, diff, files):
    """Generates a high-level progress update for the dev log."""
    print("📔 Updating Dev Log...")
    today = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    
    system_prompt = (
        "You are a Project Manager maintaining a 'Developer Log'. "
        "Summarize the technical diff into a concise, high-level progress report. "
        "Focus on 'What was achieved' rather than 'What lines changed'. "
        "Use bullet points. Do not add a title or date (I will handle that)."
    )
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Files Changed:\n{files}\n\nTechnical Diff:\n{diff[:15000]}"} 
            ],
            temperature=0.3,
            max_tokens=200
        )
        log_content = response.choices[0].message.content.strip()
        
        # Append to DEVLOG.md
        entry = f"\n\n## [{today}]\n{log_content}"
        
        with open(DEVLOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
            
        print(f"✅ Appended new entry to {DEVLOG_FILE.name}")
        return True
    except Exception as e:
        print(f"⚠️  Failed to update Dev Log: {e}")
        return False

def generate_commit_message(client, diff, files):
    """Generates the conventional commit message."""
    print("🤖 Generating commit message...")
    
    system_prompt = (
        "You are a senior developer. Generate a detailed commit message complying with Conventional Commits."
        "\nStructure:"
        "\n<type>: <short summary>"
        "\n\n- <bullet point 1>"
        "\n- <bullet point 2>"
        "\n\nRules:"
        "\n1. First line must be under 72 chars."
        "\n2. Group changes logically."
        "\n3. Do not use markdown formatting (no bold/italics)."
    )
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Staged Files:\n{files}\n\nDiff Content:\n{diff[:20000]}"}
            ],
            temperature=0.4,
            max_tokens=250
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"⚠️  Generation failed: {e}")
        return "wip: update (generation failed)"

def main():
    api_key = os.getenv("DEEPSEEK_API_KEY") # Or OPENAI_API_KEY
    
    # 1. Stage initial changes to get the diff
    print("📦 Staging changes...")
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR)
    
    diff = get_staged_diff()
    files = get_staged_files()
    
    if not diff.strip():
        print("No changes to commit.")
        sys.exit(0)

    # Initialize Client
    if not api_key:
        print("⚠️  API Key not found. Skipping AI generation.")
        commit_msg = "wip: quick push"
    else:
        # Adjust base_url/model if using a different provider
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")

        # 2. Generate and Write Dev Log (Only if there are changes)
        # We pass the diff *before* the log update so the log reflects the actual work
        generate_devlog_entry(client, diff, files)

        # 3. Stage the Dev Log update so it's included in the commit
        subprocess.run(["git", "add", str(DEVLOG_FILE)], cwd=ROOT_DIR)
        
        # 4. Refresh diff/files to include the devlog change in the context (optional, but good for consistency)
        diff = get_staged_diff() 
        files = get_staged_files()

        # 5. Generate Commit Message
        commit_msg = generate_commit_message(client, diff, files)

    # 6. Execute Git Operations
    branch = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, cwd=ROOT_DIR).stdout.strip()
    
    print("---------------------------------------------------")
    print(f"🚀 Branch: {branch}")
    print(f"📝 Message:\n{commit_msg}")
    print("---------------------------------------------------")
    
    try:
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=ROOT_DIR, check=True)
        subprocess.run(["git", "push"], cwd=ROOT_DIR, check=True)
        print("✅ Pushed!")
    except subprocess.CalledProcessError:
        print("❌ Failed to commit/push.")
        sys.exit(1)

if __name__ == "__main__":
    main()
