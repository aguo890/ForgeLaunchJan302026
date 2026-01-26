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
DOCS_MAPPING = {
    "docs/algorithms_strategy.md": ["src/algorithms.js", "test/algorithms.test.js"],
    "docs/system_design_strategy.md": ["src/system_design.js", "test/system_design.test.js"],
}

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

def update_qa_report(log_output):
    """Updates the QA_REPORT.md file with the new verification log and date."""
    qa_file = ROOT_DIR / "docs" / "qa_report.md"
    if not qa_file.exists():
        print("ℹ️  QA Report not found, skipping update.")
        return

    try:
        content = qa_file.read_text(encoding="utf-8")
        
        # 1. Update Date
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        content = re.sub(r"\*\*Date:\*\* \d{4}-\d{2}-\d{2}", f"**Date:** {today}", content)

        # 2. Update Log Content
        # Matches content between ```text and ```
        # We use a non-greedy match (.*?) with DOTALL (s) flag implied by manual handling or easier logic
        # Since I can't easily rely on regex flags in simple replace, let's use a robust pattern
        pattern = r"(```text\n)(.*?)(```)"
        
        # We need to act carefully with regex multiline. 
        # simpler approach: split by markers if regex is tricky without imports, but we can import re.
        # Let's assume re is imported or we import it inside function if needed, 
        # but better to add 'import re' at top. 
        # For now, I will use a logic that doesn't rely on global scope 're' if I missed adding it to imports?
        # I checked file content, 'import re' is NOT there. I need to add it.
        
        # We will do strings replacement for safety if re is not available, 
        # BUT I will add `import re` in a separate step or just assume I can edit imports.
        # Wait, I can only edit contiguous blocks.
        
        # Let's stick to string finding for safety without re if I can't easily add the import line 
        # without a large replace. Actually, I can replace the top imports too.
        # But for this function:
        start_marker = "```text\n"
        end_marker = "\n```"
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker, start_idx + len(start_marker))
        
        if start_idx != -1 and end_idx != -1:
            new_content = content[:start_idx + len(start_marker)] + log_output.strip() + content[end_idx:]
            qa_file.write_text(new_content, encoding="utf-8")
            print(f"✅ Updated {qa_file.name} with latest verification logs.")
            return True
        else:
            print("⚠️  Could not find code block in QA Report to update.")
            return False

    except Exception as e:
        print(f"⚠️  Failed to update QA Report: {e}")
        return False

def run_verification():
    """Runs the verification script if it exists and updates QA report."""
    verify_script = ROOT_DIR / "scripts" / "verify_submission.js"
    if verify_script.exists():
        print("🔍 Running verification suite...")
        try:
            # Capture output this time
            result = subprocess.run(
                ["node", str(verify_script)], 
                cwd=ROOT_DIR, 
                check=True,
                capture_output=True,
                text=True,
                encoding='utf-8' # Ensure encoding
            )
            print("✅ Verification Passed.")
            # Strip ANSI color codes
            clean_output = re.sub(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])', '', result.stdout)
            return clean_output
        except subprocess.CalledProcessError as e:
            print("❌ Verification FAILED. Aborting commit.")
            # Print stderr to show why it failed
            print(e.stderr)
            print(e.stdout)
            sys.exit(1)
    else:
        print("ℹ️  No verification script found (scripts/verify_submission.js). Skipping.")
        return None

def update_documentation_files(client, staged_files_list):
    """Updates documentation files based on changes in their mapped source/test files."""
    updated_any = False
    
    for doc_rel_path, dependencies in DOCS_MAPPING.items():
        doc_path = ROOT_DIR / doc_rel_path
        if not doc_path.exists():
            continue
            
        # Check if any dependency is in staged files
        # We only trigger if .js or .test.js files are staged, avoiding feedback loops
        trigger_files = [f for f in staged_files_list if any(f.endswith(dep) for dep in dependencies)]
        
        if not trigger_files:
            continue
            
        print(f"📄 dependency change detected for {doc_rel_path}. Updating documentation...")
        
        try:
            current_doc_content = doc_path.read_text(encoding="utf-8")
            
            # For simplicity, we use the first source file as primary context if multiple exist, 
            # or we could concatenate. Let's concatenate primary source files for context.
            source_contexts = []
            for dep in dependencies:
                dep_path = ROOT_DIR / dep
                if dep_path.exists() and dep.endswith(".js"):
                    source_contexts.append(f"--- FILE: {dep} ---\n{dep_path.read_text(encoding='utf-8')}")
            
            source_context_str = "\n\n".join(source_contexts)
            
            system_prompt = (
                "You are a technical writer maintaining strategy documentation for a software project. "
                "Your goal is to keep the documentation consistent with the latest source code."
            )
            
            user_prompt = f"""
You are a Technical Writer maintaining a Strategy Document.

SOURCE CODE CONTEXT:
{source_context_str}

CURRENT DOCUMENTATION:
{current_doc_content}

TASK:
Update the CURRENT DOCUMENTATION to match the SOURCE CODE.

STRICT RULES:
1. PRESERVE the existing headers, tone, and 'Executive Summary'.
2. ONLY update sections where the logic/algorithm has actually changed.
3. IF complexities changed (e.g., O(N) to O(1)), update the 'Complexity' section.
4. Do NOT rewrite the entire file if not needed; output the fully updated markdown file.
5. Ensure the tone remains professional and academic as in the original.
"""

            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
            )
            
            new_doc_content = response.choices[0].message.content.strip()
            
            # Safety Check: Prevent wiping the file or massive hallucinations
            if len(new_doc_content) < len(current_doc_content) * 0.5:
                print(f"⚠️  AI generated documentation for {doc_rel_path} is suspiciously short. Skipping update.")
                continue
                
            if new_doc_content != current_doc_content:
                doc_path.write_text(new_doc_content, encoding="utf-8")
                subprocess.run(["git", "add", str(doc_path)], cwd=ROOT_DIR)
                print(f"✅ Updated and staged {doc_rel_path}")
                updated_any = True
            else:
                print(f"ℹ️  No changes needed for {doc_rel_path}")
                
        except Exception as e:
            print(f"⚠️  Failed to update {doc_rel_path}: {e}")
            
    return updated_any

def main():
    api_key = os.getenv("DEEPSEEK_API_KEY") # Or OPENAI_API_KEY
    
    # 0. Run Verification
    verification_output = run_verification()
    
    if verification_output:
        updated = update_qa_report(verification_output)
        if updated:
             # Stage the updated QA Report so it is included in the commit
             qa_file = ROOT_DIR / "docs" / "qa_report.md"
             subprocess.run(["git", "add", str(qa_file)], cwd=ROOT_DIR)

    # 1. Stage initial changes to get the diff
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

        # 2. Update Documentation (if applicable)
        docs_updated = update_documentation_files(client, staged_files_list)
        
        # If docs were updated, refresh diff/files
        if docs_updated:
            diff = get_staged_diff()
            files = get_staged_files()
            staged_files_list = [f.strip() for f in files.splitlines() if f.strip()]

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
        # subprocess.run(["git", "push"], cwd=ROOT_DIR, check=True)
        print("✅ Committed (Push skipped for test)!")
    except subprocess.CalledProcessError:
        print("❌ Failed to commit/push.")
        sys.exit(1)

if __name__ == "__main__":
    main()
