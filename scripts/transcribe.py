#!/usr/bin/env python3
"""
Transcription pipeline for the Veterinary Business Podcast.

Downloads audio from Libsyn, transcribes with faster-whisper (VAD-enabled),
labels speakers as Host/Guest using heuristic turn detection, and optionally
injects the transcript HTML into the episode page.

Speaker labeling uses a simplified heuristic approach -- not diarization.
"""

import argparse
import html
import os
import sys
import time

import requests
from bs4 import BeautifulSoup, NavigableString


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
DEFAULT_OUTPUT_DIR = "transcripts"
DEFAULT_MODEL = "small"

# Gap (in seconds) between segments that suggests a speaker change
SPEAKER_CHANGE_GAP = 2.0

# If fewer than this many speaker changes detected, treat as monologue
MONOLOGUE_THRESHOLD = 5


# ---------------------------------------------------------------------------
# Step A: Extract audio URL from episode HTML
# ---------------------------------------------------------------------------

def extract_audio_url(episode_dir: str) -> str:
    """Parse the episode index.html and return the Libsyn MP3 URL."""
    index_path = os.path.join(episode_dir, "index.html")
    if not os.path.isfile(index_path):
        print(f"ERROR: Episode HTML not found at {index_path}", file=sys.stderr)
        sys.exit(1)

    with open(index_path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    audio_tag = soup.find("audio")
    if not audio_tag:
        print("ERROR: No <audio> element found in episode HTML", file=sys.stderr)
        sys.exit(1)

    source_tag = audio_tag.find("source")
    if source_tag and source_tag.get("src"):
        return source_tag["src"]

    # Fallback: check audio src directly
    if audio_tag.get("src"):
        return audio_tag["src"]

    print("ERROR: No audio source URL found in episode HTML", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Step B: Download audio
# ---------------------------------------------------------------------------

def download_audio(url: str, episode_num: int) -> str:
    """Download MP3 to cache directory. Skip if already cached."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    filename = f"episode-{episode_num}.mp3"
    cache_path = os.path.join(CACHE_DIR, filename)

    if os.path.isfile(cache_path):
        size_mb = os.path.getsize(cache_path) / (1024 * 1024)
        print(f"Using cached audio: {cache_path} ({size_mb:.1f} MB)")
        return cache_path

    print(f"Downloading audio from {url} ...")
    try:
        resp = requests.get(url, stream=True, timeout=300)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"ERROR: Failed to download audio: {e}", file=sys.stderr)
        sys.exit(1)

    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(cache_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                pct = downloaded / total * 100
                print(f"\r  Progress: {downloaded / (1024*1024):.1f} / {total / (1024*1024):.1f} MB ({pct:.0f}%)", end="", flush=True)
            else:
                print(f"\r  Downloaded: {downloaded / (1024*1024):.1f} MB", end="", flush=True)

    print()  # newline after progress
    size_mb = os.path.getsize(cache_path) / (1024 * 1024)
    print(f"Download complete: {cache_path} ({size_mb:.1f} MB)")
    return cache_path


# ---------------------------------------------------------------------------
# Step C: Transcribe with faster-whisper + VAD
# ---------------------------------------------------------------------------

def transcribe_audio(audio_path: str, model_size: str):
    """Transcribe audio using faster-whisper with VAD filtering."""
    from faster_whisper import WhisperModel

    print(f"Loading whisper model '{model_size}' (device=cpu, compute_type=int8) ...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print("Transcribing (this may take a while on CPU) ...")
    start = time.time()
    segments_iter, info = model.transcribe(
        audio_path,
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=500,
            speech_pad_ms=200,
        ),
        language="en",
        beam_size=5,
    )

    # Materialize segments (generator)
    segments = []
    for seg in segments_iter:
        segments.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text.strip(),
        })
        if len(segments) % 50 == 0:
            print(f"  ... {len(segments)} segments transcribed so far")

    elapsed = time.time() - start
    print(f"Transcription complete: {len(segments)} segments in {elapsed:.0f}s")

    if len(segments) == 0:
        print("WARNING: No segments transcribed. Possible audio issue.", file=sys.stderr)

    return segments, info


# ---------------------------------------------------------------------------
# Step D: Speaker labeling (heuristic)
# ---------------------------------------------------------------------------

def label_speakers(segments):
    """
    Apply heuristic speaker labels (Host/Guest).

    Strategy: Toggle speaker when gap between segments exceeds threshold.
    If very few toggles, treat as monologue (all Host).
    """
    if not segments:
        return segments

    current_speaker = "Host"
    speaker_changes = 0

    for i, seg in enumerate(segments):
        if i > 0:
            gap = seg["start"] - segments[i - 1]["end"]
            if gap > SPEAKER_CHANGE_GAP:
                current_speaker = "Guest" if current_speaker == "Host" else "Host"
                speaker_changes += 1
        seg["speaker"] = current_speaker

    # If too few changes, likely a monologue -- all Host
    if speaker_changes < MONOLOGUE_THRESHOLD:
        for seg in segments:
            seg["speaker"] = "Host"
        speaker_changes = 0

    return segments, speaker_changes


# ---------------------------------------------------------------------------
# Step E: Generate HTML fragment
# ---------------------------------------------------------------------------

def generate_html_fragment(segments, episode_num: int, output_dir: str, speaker_changes: int) -> str:
    """Build transcript HTML and write to file."""
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"episode-{episode_num}.html")

    # Group consecutive same-speaker segments, but cap at ~10 segments per
    # paragraph so monologues don't become one giant block of text.
    MAX_SEGMENTS_PER_PARAGRAPH = 10
    grouped = []
    seg_count = 0
    for seg in segments:
        if grouped and grouped[-1]["speaker"] == seg["speaker"] and seg_count < MAX_SEGMENTS_PER_PARAGRAPH:
            grouped[-1]["text"] += " " + seg["text"]
            seg_count += 1
        else:
            grouped.append({"speaker": seg["speaker"], "text": seg["text"]})
            seg_count = 1

    # Build HTML using BeautifulSoup for proper escaping
    doc = BeautifulSoup("", "html.parser")

    wrapper = doc.new_tag("div", attrs={"class": "transcript-section", "id": "transcript"})

    h2 = doc.new_tag("h2")
    h2.string = "Episode Transcript"
    wrapper.append(h2)

    # Note about heuristic labeling
    note = doc.new_tag("p")
    note.string = "Note: Speaker labels are generated using automated heuristics and may not be perfectly accurate."
    note["style"] = "font-size: 0.85rem; color: #666; font-style: italic; margin-bottom: 1rem;"
    wrapper.append(note)

    content_div = doc.new_tag("div", attrs={"class": "transcript-content"})

    for group in grouped:
        p = doc.new_tag("p")
        strong = doc.new_tag("strong")
        strong.string = f"{group['speaker']}:"
        p.append(strong)
        # Use NavigableString which handles escaping
        p.append(NavigableString(" " + html.escape(group["text"])))
        content_div.append(p)

    wrapper.append(content_div)

    # Write fragment
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(str(wrapper))

    print(f"Transcript fragment written to {output_path}")
    return output_path


# ---------------------------------------------------------------------------
# Step F: Inject transcript into episode page
# ---------------------------------------------------------------------------

TRANSCRIPT_CSS = """\
.transcript-section { margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #E8913A; }
.transcript-section h2 { color: #1B2A4A; margin-bottom: 1rem; }
.transcript-content p { margin-bottom: 0.75rem; line-height: 1.8; }
.transcript-content strong { color: #0D7377; }"""


def inject_transcript(episode_num: int, transcript_html_path: str):
    """Inject the transcript section into the episode page HTML."""
    episode_dir = os.path.join("podcast", f"episode-{episode_num}")
    index_path = os.path.join(episode_dir, "index.html")

    if not os.path.isfile(index_path):
        print(f"ERROR: Episode page not found at {index_path}", file=sys.stderr)
        sys.exit(1)

    with open(index_path, "r", encoding="utf-8") as f:
        page_html = f.read()

    soup = BeautifulSoup(page_html, "html.parser")

    # Check if already injected
    if soup.find(class_="transcript-section"):
        print("Transcript section already exists in episode page -- replacing it.")
        soup.find(class_="transcript-section").decompose()

    # Read the transcript fragment
    with open(transcript_html_path, "r", encoding="utf-8") as f:
        transcript_soup = BeautifulSoup(f.read(), "html.parser")

    transcript_div = transcript_soup.find(class_="transcript-section")
    if not transcript_div:
        print("ERROR: Could not parse transcript fragment", file=sys.stderr)
        sys.exit(1)

    # Find episode-main and append transcript after last child div
    episode_main = soup.find(class_="episode-main")
    if not episode_main:
        print("ERROR: Could not find .episode-main in episode page", file=sys.stderr)
        sys.exit(1)

    episode_main.append(transcript_div)

    # Add CSS to existing style block
    style_tag = soup.find("style")
    if style_tag and style_tag.string:
        existing_css = style_tag.string
        if ".transcript-section" not in existing_css:
            style_tag.string = existing_css + "\n\n" + TRANSCRIPT_CSS
    elif style_tag:
        style_tag.string = TRANSCRIPT_CSS

    # Write back -- use formatter=None to minimize reformatting
    # However, we use "minimal" formatter to avoid entity issues
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(str(soup))

    print(f"Transcript injected into {index_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Transcribe a Veterinary Business Podcast episode from Libsyn audio."
    )
    parser.add_argument(
        "--episode", type=int, required=True,
        help="Episode number (1-101)"
    )
    parser.add_argument(
        "--inject", action="store_true",
        help="Inject transcript HTML into the episode page"
    )
    parser.add_argument(
        "--model", default=DEFAULT_MODEL,
        help=f"Whisper model size (default: {DEFAULT_MODEL})"
    )
    parser.add_argument(
        "--output-dir", default=DEFAULT_OUTPUT_DIR,
        help=f"Output directory for transcript fragments (default: {DEFAULT_OUTPUT_DIR})"
    )
    args = parser.parse_args()

    episode_num = args.episode
    episode_dir = os.path.join("podcast", f"episode-{episode_num}")

    print(f"=== Transcription Pipeline: Episode {episode_num} ===\n")

    # Step A: Extract audio URL
    audio_url = extract_audio_url(episode_dir)
    print(f"Audio URL: {audio_url}\n")

    # Step B: Download audio
    audio_path = download_audio(audio_url, episode_num)
    print()

    # Step C: Transcribe
    segments, info = transcribe_audio(audio_path, args.model)
    print()

    # Step D: Label speakers
    labeled_segments, speaker_changes = label_speakers(segments)
    print(f"Speaker changes detected: {speaker_changes}")
    if speaker_changes < MONOLOGUE_THRESHOLD:
        print("  (Treating as monologue -- all segments labeled as Host)")
    print()

    # Step E: Generate HTML fragment
    transcript_path = generate_html_fragment(
        labeled_segments, episode_num, args.output_dir, speaker_changes
    )
    print()

    # Step F: Inject (optional)
    if args.inject:
        inject_transcript(episode_num, transcript_path)
        print()

    # Summary
    word_count = sum(len(s["text"].split()) for s in segments)
    duration_str = f"{info.duration:.0f}s" if hasattr(info, "duration") else "unknown"
    print("=== Summary ===")
    print(f"  Episode:          {episode_num}")
    print(f"  Audio URL:        {audio_url}")
    print(f"  Audio duration:   {duration_str}")
    print(f"  Segments:         {len(segments)}")
    print(f"  Word count:       ~{word_count}")
    print(f"  Speaker changes:  {speaker_changes}")
    print(f"  Transcript file:  {transcript_path}")
    if args.inject:
        print(f"  Injected into:    {os.path.join(episode_dir, 'index.html')}")
    print("\nDone.")


if __name__ == "__main__":
    main()
