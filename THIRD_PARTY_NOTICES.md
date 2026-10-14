# Open-source sources and changes

HARU is a derivative work licensed under AGPL-3.0-or-later. Full corresponding source is available from this app's Settings page as source.zip.

## asbplayer

- Source: https://github.com/asbplayer/asbplayer
- Snapshot commit: c8718d11f933f307088f2463c02e87a39cdc0571
- License: GNU Affero General Public License v3 or later (see LICENSE)
- A full source snapshot, excluding Git metadata, is retained in upstream/asbplayer/.
- Directly imported runtime modules: common/subtitle-collection/subtitle-collection.ts and common/subtitle-reader/subtitles-to-srt.ts. These files are unmodified.
- Changes/additions: a separate Chinese Korean-learning entry point; daily quota planning; original introductory Korean lessons; FSRS cards; local lyric import; loop controls; JSON backup and TSV export. The full upstream browser extension and original React UI are not embedded in this entry point.

## ts-fsrs

https://github.com/open-spaced-repetition/ts-fsrs · MIT License. Used directly as the review scheduler. Installed version is pinned in package-lock.json. See third-party/ts-fsrs-LICENSE.txt.

## @flatten-js/interval-tree

https://github.com/alexbol99/interval-tree · MIT License. Used by the upstream SubtitleCollection. See third-party/interval-tree-LICENSE.txt.

## @qgustavor/srt-parser

https://github.com/qgustavor/srt-parser · MIT License. Used for SRT import and upstream SRT export. See third-party/srt-parser-LICENSE.txt.

## Tooling and content

esbuild is build tooling under MIT License. Original HARU teaching explanations are licensed with the application. No Wedding Dress lyrics or song recording is bundled. Learner-imported lyrics, notes, and media are browser-local runtime data and are excluded from the source download and deployment archive.

Anki is not bundled or copied into HARU. HARU exports compatible plain-text TSV cards; there is no background Anki synchronization.
