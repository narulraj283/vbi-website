#!/usr/bin/env python3
"""
Batch transcription runner for all 101 VBI podcast episodes.

Orchestrates scripts/transcribe.py across all episodes with:
- Skip detection (idempotent -- already-transcribed episodes are skipped)
- Progress tracking with timestamps
- Periodic git commits for incremental progress saving
- Error handling and continuation on failure
- Completion report written to scripts/batch-log.txt
"""

import argparse
import datetime
import os
import subprocess
import sys
from pathlib import Path

# Project root is parent of scripts/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
TRANSCRIBE_SCRIPT = PROJECT_ROOT / "scripts" / "transcribe.py"
PODCAST_DIR = PROJECT_ROOT / "podcast"
BATCH_LOG = PROJECT_ROOT / "scripts" / "batch-log.txt"


def timestamp():
    """Return current timestamp string."""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def log(msg, flush=True):
    """Print a timestamped log message."""
    print(f"[{timestamp()}] {msg}", flush=flush)


def has_transcript(episode_num):
    """Check if an episode already has a transcript section injected."""
    index_path = PODCAST_DIR / f"episode-{episode_num}" / "index.html"
    if not index_path.exists():
        return False
    content = index_path.read_text(encoding="utf-8")
    return 'class="transcript-section"' in content


def check_dependencies():
    """Verify required Python packages are installed."""
    missing = []
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        missing.append("faster-whisper")
    try:
        from bs4 import BeautifulSoup  # noqa: F401
    except ImportError:
        missing.append("beautifulsoup4")
    try:
        import requests  # noqa: F401
    except ImportError:
        missing.append("requests")

    if missing:
        log(f"ERROR: Missing Python packages: {', '.join(missing)}")
        log("Install with: pip install " + " ".join(missing))
        return False
    return True


def preflight(start, end):
    """Run pre-flight checks before batch processing."""
    log("=== PRE-FLIGHT CHECKS ===")

    # Check transcribe.py exists
    if not TRANSCRIBE_SCRIPT.exists():
        log(f"ERROR: {TRANSCRIBE_SCRIPT} not found")
        return False
    log(f"OK: {TRANSCRIBE_SCRIPT} exists")

    # Check episode directories exist
    missing_dirs = []
    for i in range(start, end + 1):
        ep_dir = PODCAST_DIR / f"episode-{i}"
        index_file = ep_dir / "index.html"
        if not index_file.exists():
            missing_dirs.append(i)

    if missing_dirs:
        log(f"WARNING: Missing episode HTML files for episodes: {missing_dirs}")
        if len(missing_dirs) > 10:
            log("ERROR: Too many missing episodes -- aborting")
            return False
    else:
        log(f"OK: All episode HTML files exist for episodes {start}-{end}")

    # Check dependencies
    if not check_dependencies():
        return False
    log("OK: All Python dependencies installed")

    total = end - start + 1
    log(f"Total episodes to process: {total} (episodes {start}-{end})")
    log("WARNING: Batch transcription may take several hours on CPU")
    log("")
    return True


def git_commit(message):
    """Stage modified episode files and commit."""
    try:
        # Stage episode HTML files and transcripts
        subprocess.run(
            ["git", "add", "podcast/episode-*/index.html", "transcripts/"],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        result = subprocess.run(
            ["git", "commit", "-m", message],
            cwd=str(PROJECT_ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode == 0:
            log(f"Git commit: {message}")
            return True
        else:
            # Nothing to commit is OK
            if "nothing to commit" in result.stdout or "nothing to commit" in result.stderr:
                log("Git: nothing to commit")
                return True
            log(f"Git commit failed: {result.stderr.strip()}")
            return False
    except Exception as e:
        log(f"Git commit error: {e}")
        return False


def run_batch(start, end, model, commit_every, dry_run):
    """Run batch transcription across episode range."""
    total = end - start + 1
    successes = []
    failures = []
    skipped = []

    # Track for periodic commits
    uncommitted_successes = []
    first_uncommitted = None

    log(f"=== BATCH TRANSCRIPTION: Episodes {start}-{end} ===")
    log(f"Model: {model} | Commit every: {commit_every} episodes")
    log("")

    for idx, ep_num in enumerate(range(start, end + 1), 1):
        progress = f"[{idx}/{total}]"

        # Skip detection
        if has_transcript(ep_num):
            log(f"{progress} Episode {ep_num}: already has transcript, skipping")
            skipped.append(ep_num)
            continue

        # Check episode file exists
        index_path = PODCAST_DIR / f"episode-{ep_num}" / "index.html"
        if not index_path.exists():
            log(f"{progress} Episode {ep_num}: index.html not found, skipping")
            failures.append((ep_num, "index.html not found"))
            continue

        if dry_run:
            log(f"{progress} Episode {ep_num}: WOULD transcribe (dry-run)")
            successes.append(ep_num)
            continue

        # Run transcription
        log(f"{progress} Processing episode {ep_num}...")
        cmd = [
            sys.executable,
            str(TRANSCRIBE_SCRIPT),
            "--episode", str(ep_num),
            "--inject",
            "--model", model,
        ]

        try:
            result = subprocess.run(
                cmd,
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                text=True,
                timeout=1800,  # 30 min per episode
            )

            if result.returncode == 0:
                log(f"{progress} Episode {ep_num}: SUCCESS")
                successes.append(ep_num)
                uncommitted_successes.append(ep_num)
                if first_uncommitted is None:
                    first_uncommitted = ep_num
            else:
                error_msg = result.stderr.strip().split("\n")[-1] if result.stderr.strip() else "Unknown error"
                log(f"{progress} Episode {ep_num}: FAILED -- {error_msg}")
                failures.append((ep_num, error_msg))

        except subprocess.TimeoutExpired:
            log(f"{progress} Episode {ep_num}: TIMEOUT (>30 min)")
            failures.append((ep_num, "Timeout exceeded 30 minutes"))

        except Exception as e:
            log(f"{progress} Episode {ep_num}: ERROR -- {e}")
            failures.append((ep_num, str(e)))

        # Periodic git commit
        if not dry_run and len(uncommitted_successes) >= commit_every:
            last_ep = uncommitted_successes[-1]
            msg = f"feat(07): add transcripts for episodes {first_uncommitted}-{last_ep} [{len(successes)}/{total}]"
            git_commit(msg)
            uncommitted_successes = []
            first_uncommitted = None

    # Final commit for remaining work
    if not dry_run and uncommitted_successes:
        last_ep = uncommitted_successes[-1]
        msg = f"feat(07): complete batch transcription -- {len(successes)}/{total} episodes"
        git_commit(msg)

    # Completion report
    report = generate_report(total, successes, skipped, failures, dry_run)
    print(report)

    # Write log file
    if not dry_run:
        try:
            with open(BATCH_LOG, "w", encoding="utf-8") as f:
                f.write(report)
            log(f"Report written to {BATCH_LOG}")

            # Stage and commit the log
            subprocess.run(
                ["git", "add", str(BATCH_LOG)],
                cwd=str(PROJECT_ROOT),
                capture_output=True,
                text=True,
                timeout=30,
            )
        except Exception as e:
            log(f"Warning: Could not write batch log: {e}")

    return len(failures)


def generate_report(total, successes, skipped, failures, dry_run):
    """Generate the completion report."""
    lines = []
    mode = " (DRY RUN)" if dry_run else ""
    lines.append(f"=== BATCH TRANSCRIPTION COMPLETE{mode} ===")
    lines.append(f"Timestamp: {timestamp()}")
    lines.append(f"Total:    {total}")
    lines.append(f"Success:  {len(successes)}")
    lines.append(f"Skipped:  {len(skipped)} (already had transcripts)")
    lines.append(f"Failed:   {len(failures)}")
    lines.append("")

    if skipped:
        lines.append(f"Skipped episodes: {skipped}")
    if failures:
        lines.append("Failed episodes:")
        for ep_num, reason in failures:
            lines.append(f"  Episode {ep_num}: {reason}")
    if not failures and not dry_run:
        lines.append("All episodes processed successfully!")

    lines.append("")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Batch transcribe all VBI podcast episodes."
    )
    parser.add_argument(
        "--start", type=int, default=1,
        help="First episode to process (default: 1)"
    )
    parser.add_argument(
        "--end", type=int, default=101,
        help="Last episode to process (default: 101)"
    )
    parser.add_argument(
        "--model", default="tiny",
        help="Whisper model size (default: tiny)"
    )
    parser.add_argument(
        "--commit-every", type=int, default=10,
        help="Git commit after every N successful transcriptions (default: 10)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be done without executing"
    )
    args = parser.parse_args()

    os.chdir(str(PROJECT_ROOT))

    if not preflight(args.start, args.end):
        sys.exit(1)

    failure_count = run_batch(
        args.start, args.end, args.model, args.commit_every, args.dry_run
    )

    if failure_count > 0 and not args.dry_run:
        log(f"WARNING: {failure_count} episodes failed. Check batch-log.txt for details.")
        sys.exit(1 if failure_count > 6 else 0)  # Only fail exit if >6% failure rate


if __name__ == "__main__":
    main()
