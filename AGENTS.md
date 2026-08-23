# MetadataRemoverTool.com

## Product

A privacy-first, browser-only metadata remover for JPG, PNG, WebP, and PDF files. Files never leave the user's browser.

## V1 scope

- One responsive remover homepage.
- Detect, explain, selectively remove, and verify metadata locally.
- Privacy Clean, Remove Everything, Photographer Mode, and Custom cleanup.
- Additive multi-file batches, isolated per-file failures, ZIP download, and collision-safe filenames.
- Dark theme by default with a persisted light-theme toggle.

## Out of scope

- Accounts, server uploads, advertising, analytics that receive file data, separate SEO routes, and unsupported file types.
- Keyword-stuffed copy, misspelled keyword targeting, fabricated claims, ratings, or testimonials.

## Release contract

- Custom PDF cleanup exposes every detected identity field, selected by default.
- Photographer Mode removes GPS, identity, serial numbers, and exact dates while retaining safe camera and exposure data where supported.
- Formats that cannot safely preserve selected metadata fall back to full metadata removal.
- Release verification covers Chromium, Firefox, WebKit, and mobile viewports.
- Release changes remain uncommitted for user review.

## Roadmap

1. Astro and Tailwind foundation. Done.
2. Local file analysis and privacy report. Done.
3. Selective PDF controls and photographer presets. Done.
4. Reliable batches and collision-safe downloads. Done.
5. Cross-browser automated verification. Done.
6. Homepage on-page SEO and social sharing. Todo.
7. Release documentation and final review. Todo.

## Approved next step

Optimize the single homepage for the correctly spelled primary keyword "metadata remover." Keep the working remover first, make the full homepage approximately 800-1200 words, and naturally cover photo, image, EXIF, PDF, free, and online metadata-removal searches. Use the H1 "Free Metadata Remover for Photos, Images and PDFs." Add canonical, robots, Open Graph, Twitter Card, WebApplication, and visible FAQ metadata for `https://metadataremovertool.com/`, plus a branded 1200x630 social image. Expand the visible FAQ with concise answers for general, photo, image, PDF, Android, macOS, and Word-document searches; Word answers must clearly state that Word cleanup is unsupported here and only give general official guidance. Generate FAQ JSON-LD from the same visible question-and-answer data. Preserve the current functionality, responsive layout, themes, and browser-only privacy promise. Verify the build, rendered metadata, copy length, responsive appearance, and existing remover behavior. Keep all changes uncommitted.
