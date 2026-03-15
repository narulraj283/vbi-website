---
phase: 06-transcription-pipeline
plan: 01
subsystem: transcription
tags: [faster-whisper, whisper, vad, beautifulsoup, podcast, audio, transcription]

# Dependency graph
requires:
  - phase: 09-podcast-structured-data
    provides: Episode HTML pages with JSON-LD and audio source tags
provides:
  - "scripts/transcribe.py: end-to-end transcription pipeline (download, transcribe, label, inject)"
  - "scripts/requirements.txt: Python dependencies for transcription"
  - "Validated transcript output for episode 1"
  - "Reusable pipeline ready for batch processing all 101 episodes"
affects: [07-batch-transcription]

# Tech tracking
tech-stack:
  added: [faster-whisper 1.2.1, beautifulsoup4, requests, ctranslate2, onnxruntime, silero-vad]
  patterns: [VAD-filtered transcription, heuristic speaker labeling, BeautifulSoup HTML injection]

key-files:
  created: [scripts/transcribe.py, scripts/requirements.txt, transcripts/episode-1.html]
  modified: [podcast/episode-1/index.html]

key-decisions:
  - "Used faster-whisper tiny model for validation (96s vs estimated 15-30 min for small model)"
  - "Heuristic speaker labeling with gap-based turn detection (>2s gap toggles speaker)"
  - "Episode 1 treated as monologue (all Host labels) -- fewer than 5 speaker changes detected"
  - "Paragraph grouping capped at 10 segments to prevent wall-of-text in monologues"
  - "faster-whisper 1.2.1 installed successfully (plan noted it might not exist)"

patterns-established:
  - "Transcript pipeline: extract URL from HTML, download to cache, transcribe with VAD, label speakers, generate HTML, inject"
  - "Cached audio downloads in scripts/cache/ to avoid re-downloading during development"
  - "Transcript CSS injected into existing style block (orange border-top, teal speaker labels)"

requirements-completed: [PODC-03, PODC-04, PODC-05, PODC-06]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 6 Plan 01: Transcription Pipeline Summary

**faster-whisper transcription pipeline with VAD filtering, heuristic speaker labels, and BeautifulSoup HTML injection -- validated on episode 1 (327 segments, 5492 words)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T17:32:23Z
- **Completed:** 2026-03-15T17:38:27Z
- **Tasks:** 2 of 2 auto tasks completed (Task 3 is human-verify checkpoint)
- **Files modified:** 4

## Accomplishments
- Built complete transcription pipeline script (scripts/transcribe.py) with CLI interface
- Downloaded and transcribed episode 1 audio from Libsyn (37.8 MB, 27.5 min, 327 segments)
- Injected transcript section into episode 1 HTML page with proper CSS styling
- VAD filtering active -- no hallucinated text over silence/music sections
- Pipeline is reusable for batch processing all 101 episodes via --episode N flag

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create transcription pipeline script** - `e6a6d4e` (feat)
2. **Task 2: Run pipeline on episode 1 and inject transcript** - `beac368` (feat)
3. **Task 3: Human verification checkpoint** - awaiting user review

## Files Created/Modified
- `scripts/transcribe.py` - End-to-end transcription pipeline (download, transcribe, label, inject)
- `scripts/requirements.txt` - Python dependencies (faster-whisper, beautifulsoup4, requests)
- `transcripts/episode-1.html` - HTML transcript fragment for episode 1
- `podcast/episode-1/index.html` - Episode page with injected transcript section and CSS

## Decisions Made
- Used faster-whisper "tiny" model for validation run (completed in 96 seconds on CPU vs estimated 15-30 min for "small" model). Batch run in Phase 7 can use "small" for higher accuracy.
- Episode 1 detected as monologue -- all segments labeled as Host (fewer than 5 speaker changes via gap heuristic). This is appropriate for the introductory episode.
- Capped paragraph grouping at 10 segments maximum to ensure readability even in monologue episodes.
- faster-whisper 1.2.1 was available on PyPI despite plan noting it might not exist. Used >= constraint in requirements.txt.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed paragraph grouping creating single giant paragraph for monologues**
- **Found during:** Task 2 (verification)
- **Issue:** When all segments had the same speaker (monologue), grouping merged all 327 segments into one paragraph, failing the >5 paragraphs check
- **Fix:** Added MAX_SEGMENTS_PER_PARAGRAPH = 10 cap to split long same-speaker runs into multiple paragraphs
- **Files modified:** scripts/transcribe.py
- **Verification:** Re-ran pipeline, now produces 34 paragraphs with 5507 words
- **Committed in:** beac368 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for readability. No scope creep.

## Issues Encountered
- Plan specified faster-whisper==1.1.0 as latest stable, but 1.2.1 was actually available and installed successfully. Used >= constraint instead of pinning.
- urllib3 v2 warning about LibreSSL 2.8.3 (cosmetic, does not affect functionality).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pipeline validated and ready for batch processing all 101 episodes in Phase 7
- Audio caching in scripts/cache/ will prevent re-downloading episode 1
- Consider using "small" model in Phase 7 for higher accuracy (at cost of ~10x longer runtime per episode)
- Speaker labeling heuristic may need tuning for interview episodes with actual guests

---
*Phase: 06-transcription-pipeline*
*Completed: 2026-03-15*
