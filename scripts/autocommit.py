import os
import subprocess
import sys
import datetime
import re
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent
DEVLOG_FILE = ROOT_DIR / "docs" / "development_log.md"  # <--- New Log File Path

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
    
    system_prompt = """
    You are a Principal Software Engineer writing a technical development log.
    
    Your goal is not just to list changes, but to explain the *engineering story* behind them.
    
    For every major change (architectural, algorithmic, or complex refactor), use the following structure:
    
    1. **Context/Problem**: Briefly explain the limitation, bug, or missing requirement that triggered this work.
    2. **Solution/Implementation**: Describe the technical approach taken. Be specific (e.g., "Switched from Array to Set", "Implemented a guard clause").
    3. **Rationale/Logic**: Explain *why* this solution was chosen. Discuss trade-offs, performance implications (Big O), or maintainability benefits.
    4. **Outcome**: Mention how it was verified (tests passed, benchmark results) and the impact.
    
    **Formatting Rules:**
    - Use `## [Timestamp] Title of Change` for the header.
    - Use **bold** for key technical terms.
    - Keep it concise but dense with technical value.
    - For minor trivial fixes (typos, formatting), a simple bullet point is sufficient.
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Current Timestamp: {today}\nFiles Changed:\n{files}\n\nTechnical Diff:\n{diff[:15000]}"} 
            ],
            temperature=0.3,
            max_tokens=500
        )
        log_content = response.choices[0].message.content.strip()
        
        # Append to DEVLOG.md
        entry = f"\n\n{log_content}"
        
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

def update_qa_report(log_output, success):
    """
    Updates the QA_REPORT.md file with the new verification log, date, and result.
    Uses Regex for robust replacement rather than brittle string slicing.
    Records BOTH success and failure states for accurate observability.
    """
    qa_file = ROOT_DIR / "docs" / "qa_report.md"
    if not qa_file.exists():
        print("ℹ️  QA Report not found, skipping update.")
        return False

    try:
        content = qa_file.read_text(encoding="utf-8")
        today = datetime.datetime.now().strftime("%Y-%m-%d")

        # 1. Update Date (Regex for robustness)
        content = re.sub(r"(\*\*Date:\*\* ).*", f"\\g<1>{today}", content)

        # 2. Update Log Content (Regex with DOTALL for multi-line match)
        log_pattern = r"(```text\n)(.*?)(```)"
        
        if not re.search(log_pattern, content, re.DOTALL):
            print("⚠️  Could not find '```text' block in QA Report.")
            return False

        # Clean ANSI codes from log before injecting
        clean_log = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', log_output)
        
        # Inject new log
        new_log_block = f"```text\n{clean_log.strip()}\n```"
        content = re.sub(log_pattern, new_log_block, content, flags=re.DOTALL)

        # 3. Update Conclusion Signature (Dynamic Status)
        status_pattern = r"(\*Signed: Automated Verification Suite.*)"
        status_emoji = '✅ PASS' if success else '❌ FAIL'
        status_line = f"*Signed: Automated Verification Suite (Result: {status_emoji})*"
        
        if re.search(status_pattern, content):
            content = re.sub(status_pattern, status_line, content)
        else:
            # Append if not found
            content += f"\n\n{status_line}"

        qa_file.write_text(content, encoding="utf-8")
        print(f"✅ Updated {qa_file.name} with latest logs (Result: {status_emoji}).")
        return True

    except Exception as e:
        print(f"⚠️  Failed to update QA Report: {e}")
        return False

def run_verification():
    """
    Runs the verification script and returns (output, success) tuple.
    Does NOT exit on failure - allows caller to update report first.
    """
    verify_script = ROOT_DIR / "scripts" / "verify_submission.js"
    if not verify_script.exists():
        print("ℹ️  No verification script found (scripts/verify_submission.js). Skipping.")
        return None, True  # No script = no failure

    print("🔍 Running verification suite...")
    try:
        # Capture output regardless of success/failure (no check=True)
        result = subprocess.run(
            ["node", str(verify_script)], 
            cwd=ROOT_DIR, 
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        
        # Combine stdout/stderr for complete picture
        output = result.stdout
        if result.stderr:
            output += f"\n\nSTDERR:\n{result.stderr}"
        
        # returncode 0 = success
        success = (result.returncode == 0)
        
        if success:
            print("✅ Verification Passed.")
        else:
            print("❌ Verification FAILED.")
            
        return output, success
        
    except Exception as e:
        return f"CRITICAL SCRIPT ERROR: {str(e)}", False

def main():
    api_key = os.getenv("DEEPSEEK_API_KEY") # Or OPENAI_API_KEY
    
    # 0. Run Verification (returns tuple: output, success)
    verification_output, is_passing = run_verification()
    
    # Update report REGARDLESS of pass/fail for accurate observability
    if verification_output:
        updated = update_qa_report(verification_output, is_passing)
        if updated:
            # Stage the updated QA Report so it is included
            qa_file = ROOT_DIR / "docs" / "qa_report.md"
            subprocess.run(["git", "add", str(qa_file)], cwd=ROOT_DIR)

    # 1. Halt if verification failed (AFTER updating report)
    if not is_passing:
        print("\n❌ Verification FAILED. Report updated. Commit aborted.")
        sys.exit(1)

    # 2. Stage initial changes to get the diff
    print("📦 Staging changes...")
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR)
    
    diff = get_staged_diff()
    files = get_staged_files()
    staged_files_list = [f.strip() for f in files.splitlines() if f.strip()]
    
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

        # 3. Generate and Write Dev Log (Only if there are changes)
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
