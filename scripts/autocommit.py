import os
import subprocess
import sys
from pathlib import Path
# Setup paths (Assumes this script is in <root>/scripts/)
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError:
    print("⚠️  Missing dependencies (openai, python-dotenv).")
    print("   Please run: pip install openai python-dotenv")
    sys.exit(1)
# Load environment variables
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
def main():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    # specific to your new project? You can change the env var name if needed.
    
    commit_msg = ""
    print("📦 Staging all changes...")
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR)
    diff = get_staged_diff()
    files = get_staged_files()
    
    if not diff.strip():
        print("No changes to commit.")
        sys.exit(0)
    if not api_key:
        print("⚠️  DeepSeek/OpenAI API Key not found. Using default message.")
        # Fallback if no key
        commit_msg = "wip: quick push"
    else:
        # --- Handling Large Diffs & Lock Files ---
        MAX_DIFF_LEN = 25000 
        
        is_lock_file = any(f.endswith(('.lock', '-lock.json', '.lock.yaml')) for f in files.splitlines())
        
        if is_lock_file:
            diff_context = "⚠️ Large lock file changes detected (excluded from context)."
            diff_context += "\n" + diff[:10000]
        elif len(diff) > MAX_DIFF_LEN:
            diff_context = f"⚠️ DIFF TRUNCATED (Total len: {len(diff)} chars). Showing first {MAX_DIFF_LEN} chars:\n"
            diff_context += diff[:MAX_DIFF_LEN]
        else:
            diff_context = diff
        prompt_content = f"Staged Files:\n{files}\n\nDiff Content:\n{diff_context}"
        # Adjust base_url/model if using a different provider
        client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        print("🤖 Analyzing changes...")
        
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": (
                        "You are a senior developer. Generate a detailed commit message complying with Conventional Commits."
                        "\nStructure:"
                        "\n<type>: <short summary>"
                        "\n\n- <bullet point 1>"
                        "\n- <bullet point 2>"
                        "\n\nRules:"
                        "\n1. First line must be under 72 chars."
                        "\n2. Group changes logically."
                        "\n3. Do not use markdown formatting (no bold/italics)."
                    )},
                    {"role": "user", "content": prompt_content}
                ],
                temperature=0.4,
                max_tokens=250
            )
            commit_msg = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"⚠️  Generation failed: {e}")
            commit_msg = "wip: update (generation failed)"
    # Execute
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
