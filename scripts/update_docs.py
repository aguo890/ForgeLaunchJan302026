import os
import subprocess
import sys
from pathlib import Path

# Setup paths
SCRIPT_DIR = Path(__file__).parent
ROOT_DIR = SCRIPT_DIR.parent

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

def get_staged_files():
    """Get the list of staged files."""
    result = subprocess.run(
        ["git", "diff", "--name-only", "--cached"], 
        capture_output=True, text=True, encoding='utf-8', errors='replace', cwd=ROOT_DIR
    )
    return result.stdout or ""

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
            
            # Concatenate primary source files for context
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
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("⚠️  API Key not found. Cannot update docs via AI.")
        sys.exit(1)

    print("🔍 Checking if documentation updates are needed based on staged changes...")
    
    # Ensure changes are staged so we can check them
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR)
    
    files = get_staged_files()
    staged_files_list = [f.strip() for f in files.splitlines() if f.strip()]
    
    if not staged_files_list:
        print("No staged files found.")
        return

    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    updated = update_documentation_files(client, staged_files_list)
    
    if not updated:
        print("✅ Documentation is already up to date.")

if __name__ == "__main__":
    main()
