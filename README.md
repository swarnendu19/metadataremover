# Master Build Prompt — MetadataRemoverTool.com

You are a senior full-stack engineer, privacy-tool architect, technical SEO specialist, and product designer.

Build a production-ready web application called:

# MetadataRemoverTool.com

The product must be significantly better than generic metadata-removal websites.

Do NOT build a basic:

Upload → Remove → Download

tool.

The core experience must instead be:

# Detect → Explain → Select → Remove → Verify

The website should feel like a professional privacy utility rather than a generic converter website.

---

# 1. PRODUCT POSITIONING

Primary product:

**Free Metadata Remover Tool**

Primary promise:

> Find and remove hidden GPS, camera, author, device and other sensitive metadata before sharing your files.

Secondary promise:

> Your files never leave your device.

Core differentiator:

> Don't just remove metadata. See what's exposing you.

The tool should combine:

- Metadata detection
- Privacy analysis
- Metadata viewing
- Selective removal
- Complete metadata removal
- Before/after comparison
- Removal verification
- Batch processing
- Privacy risk scoring
- Local browser-based processing

The website should make users feel that they are performing a **privacy scan**, not merely converting a file.

---

# 2. NON-NEGOTIABLE PRIVACY ARCHITECTURE

Whenever technically possible, all metadata reading and removal must happen:

**100% inside the user's browser.**

Do NOT upload user files to our servers.

Use technologies such as:

- WebAssembly
- Web Workers
- ArrayBuffer
- Blob
- File API
- browser-compatible metadata parsers
- local JavaScript libraries

Files must never be:

- uploaded
- logged
- stored
- cached server-side
- sent to analytics
- sent to third-party APIs

Place a prominent trust message beside the upload interface:

## 🔒 Your files never leave your device

Metadata is detected and removed locally in your browser.

**No uploading. No storage. No account required.**

If a particular file format cannot safely be processed locally, clearly tell the user rather than silently uploading it somewhere.

---

# 3. INITIAL FILE FORMAT SUPPORT

Prioritize these for V1:

## Images

- JPG
- JPEG
- PNG
- WebP
- HEIC if reliable browser-side support is possible
- TIFF if feasible

## Documents

- PDF

Architect the application so these can be added later:

- DOCX
- XLSX
- PPTX
- MP4
- MOV
- WebM
- MP3
- WAV
- FLAC
- M4A

Do not claim support for a file type unless the application genuinely handles its metadata correctly.

---

# 4. HOMEPAGE

Route:

`/`

Primary SEO intent:

**metadata remover**

Suggested title:

**Metadata Remover — Remove Hidden Metadata Online Free**

Suggested H1:

# Free Metadata Remover Tool

Supporting copy:

> Remove hidden EXIF, GPS, camera, device, author and other sensitive metadata from your files before sharing them.

Immediately underneath show:

🔒 **100% browser processing — your files never leave your device**

No account required.

No upload to our servers.

No quality loss when technically possible.

---

# 5. HERO UPLOAD EXPERIENCE

Create a large premium drag-and-drop upload area.

Text:

## Drop your file here

or

**Choose Files**

Supporting formats:

JPG • PNG • WebP • HEIC • PDF

Also support:

**Ctrl + V / Cmd + V to paste an image or screenshot**

Allow drag-and-drop.

Allow multi-file upload.

Eventually support folder drop.

The upload interface should feel extremely fast and simple.

---

# 6. FILE ANALYSIS STAGE

Immediately after selecting a file, scan it locally.

Show:

- filename
- file type
- file size
- dimensions where applicable
- metadata categories found
- total metadata properties
- privacy-sensitive properties
- non-sensitive properties

Then generate:

# Privacy Risk Score

Example:

## ⚠️ Privacy Risk: HIGH — 82/100

Explain why.

Example:

### Sensitive metadata detected

🔴 GPS coordinates
🔴 Device model
🔴 Device serial information
🟠 Exact capture date
🟠 Editing software
🟢 Camera settings

Do not use random scoring.

Design a deterministic privacy-scoring algorithm.

Example weighting:

GPS coordinates = very high risk
Exact address/location metadata = very high risk
Device serial = very high risk
Author/owner = high
Device model = medium
Creation timestamp = medium
Editing software = low/medium
Exposure data = low
Image dimensions = harmless

Document the scoring rules in code.

---

# 7. PRIVACY EXPLANATIONS

Users should not need to understand EXIF terminology.

For each important metadata property, display:

**Field**

GPS Latitude

**Detected value**

22.5726

**Privacy meaning**

This may reveal where the photo was taken.

**Risk**

High

Do the same for:

- GPS
- device model
- camera model
- serial numbers
- author
- creator
- timestamps
- software
- copyright
- comments
- document author
- document company
- editing application
- embedded thumbnails

Technical users should still be able to expand and inspect raw metadata.

---

# 8. METADATA VIEWER

Before removing anything, show metadata in categorized sections.

Example:

## Location

GPS Latitude
GPS Longitude
GPS Altitude

## Device

Device Manufacturer
Device Model
Serial Number

## Image

Orientation
Dimensions
Color Space

## Capture Information

Date Taken
Exposure
ISO
Aperture
Focal Length

## Creator

Author
Copyright
Artist

## Software

Editing Software
Software Version

## Other

Raw/unclassified metadata

Add search functionality:

**Search metadata fields**

---

# 9. SELECTIVE METADATA REMOVAL

Do not force users into an all-or-nothing choice.

Provide three presets.

## 🔒 Privacy Clean

Recommended.

Remove sensitive personal information while retaining metadata that may be useful.

Remove:

- GPS
- serial numbers
- device identifiers
- author data
- creator identity
- exact timestamps where appropriate
- editing history where appropriate

Retain when safe:

- orientation
- color profile
- image dimensions
- copyright if user chooses
- essential structural metadata

---

## 🧹 Remove Everything

Strip all safely removable metadata.

Explain that some structural metadata may be required for the file format to remain valid.

---

## 🎨 Photographer Mode

Remove privacy-sensitive information but retain useful ownership/photography metadata.

For example:

Remove:

- GPS
- device serial
- sensitive identifiers

Keep:

- copyright
- artist
- camera settings
- exposure settings

---

Also provide:

# Custom

Allow users to select individual metadata categories.

Checkboxes:

- GPS Location
- Device Information
- Serial Numbers
- Author Information
- Capture Date
- Editing Software
- Copyright
- Comments
- EXIF
- IPTC
- XMP
- ICC Profile

Do not allow removal of data that would corrupt the file.

---

# 10. METADATA REMOVAL ENGINE

Implement safe metadata stripping.

Important requirements:

- preserve image dimensions
- preserve image orientation visually
- preserve pixel data whenever possible
- avoid recompression where possible
- avoid unnecessary transcoding
- keep files valid
- retain required structural metadata
- handle corrupted metadata safely

When lossless metadata stripping is technically possible, do that instead of decoding and re-encoding the image.

Never claim:

**0 quality loss**

unless this can actually be guaranteed for that processing path.

---

# 11. BEFORE / AFTER VERIFICATION

This is one of the core competitive features.

After metadata removal, automatically scan the cleaned file again.

Display:

# ✅ Privacy Check Passed

Example:

**17 sensitive metadata fields removed**

Before:

36 metadata properties

After:

8 metadata properties

Sensitive metadata remaining:

**0**

Display individual changes:

GPS Location → ✅ Removed

Device Model → ✅ Removed

Serial Number → ✅ Removed

Author → ✅ Removed

Editing Software → ✅ Removed

Capture Date → ✅ Removed

Copyright → Retained

Orientation → Retained

---

# 12. QUALITY VERIFICATION

Show:

## Original

Filename

File size

Dimensions

Format

## Cleaned

Filename

File size

Dimensions

Format

Then display:

### Image dimensions unchanged ✅

If pixel data was not modified:

### Pixel data unchanged ✅

If lossless metadata stripping occurred:

### No recompression performed ✅

Do NOT show these statements unless technically verified.

---

# 13. DOWNLOAD EXPERIENCE

Primary CTA:

# Download Clean File

Secondary CTAs:

**Verify Again**

**Clean Another File**

Use sensible cleaned filenames.

Example:

Original:

`IMG_4821.jpg`

Output:

`IMG_4821-clean.jpg`

For batch downloads:

`metadata-cleaned-files.zip`

---

# 14. METADATA VERIFICATION TOOL

Build a separate route:

`/metadata-checker`

Primary SEO target:

**metadata checker**

Hero:

# Metadata Privacy Checker

Subtitle:

> Check whether your photo or file contains hidden information before sharing it.

Upload a file.

Show:

## ✅ Safe to share

or

## ⚠️ Sensitive metadata detected

Explain exactly what information is present.

CTA:

# Remove Sensitive Metadata

This should send the file into the metadata remover workflow without requiring another upload.

---

# 15. METADATA VIEWER TOOL

Route:

`/metadata-viewer`

SEO intent:

**metadata viewer**

H1:

# Free Metadata Viewer

Allow users to inspect all detected metadata.

Features:

- organized categories
- raw metadata mode
- search
- copy metadata value
- export metadata as JSON if useful
- immediately remove sensitive metadata

CTA:

**Remove Sensitive Metadata**

---

# 16. IMAGE METADATA REMOVER PAGE

Route:

`/image-metadata-remover`

Target:

- image metadata remover
- remove metadata from image
- remove image metadata

Build a real image-specific interface.

Do not merely duplicate the homepage text.

Include relevant information about:

- EXIF
- GPS
- camera data
- device details
- author information
- timestamps

---

# 17. PHOTO METADATA REMOVER

Route:

`/photo-metadata-remover`

Target photo-specific search intent.

Explain why photos can reveal:

- where they were taken
- when they were taken
- device/camera used
- photographer details

Tool should use the same underlying engine.

---

# 18. EXIF REMOVER

Route:

`/exif-remover`

H1:

# Free EXIF Remover

Target:

- EXIF remover
- remove EXIF data
- remove EXIF online

Allow:

- view EXIF
- selectively remove EXIF
- remove all EXIF
- verify afterward

---

# 19. GPS METADATA REMOVER

Route:

`/gps-metadata-remover`

Focus specifically on removing geolocation.

Hero:

# Remove GPS Location From Photos

After upload, if GPS exists, show a map-free human-readable warning such as:

**GPS location detected**

Latitude: ...

Longitude: ...

Do not send coordinates to external map APIs without explicit consent.

CTA:

# Remove GPS Information

---

# 20. PDF METADATA REMOVER

Route:

`/pdf-metadata-remover`

Detect metadata such as:

- Author
- Creator
- Producer
- Creation Date
- Modification Date
- Title
- Subject
- Keywords

Allow selective removal.

Verify afterward.

Never alter PDF content unnecessarily.

---

# 21. BATCH METADATA REMOVER

Build strong batch UX.

Users should be able to select multiple files.

Example:

# 47 files scanned

🔴 31 files contain sensitive metadata

🟢 16 files appear clean

CTA:

# Clean 31 Files

Show progress locally.

Example:

1 / 31 cleaned

2 / 31 cleaned

...

Allow:

**Download All as ZIP**

Do not artificially restrict batch usage simply to force payment.

We are initially building an SEO + AdSense utility.

---

# 22. DRAG FOLDER SUPPORT

If browser APIs allow it reliably, support dropping an entire folder.

Keep processing completely local.

Display:

47 files found

31 need cleaning

16 already safe

Allow:

**Clean only unsafe files**

---

# 23. PRIVACY REPORT

After cleaning, generate an optional local report.

Example:

# Metadata Removal Report

File:

IMG_4821.jpg

Before:

36 metadata properties

Sensitive properties:

11

Removed:

11

Remaining sensitive properties:

0

Result:

✅ No privacy-sensitive metadata detected

Allow:

**Download Report**

Could be TXT, JSON or PDF later.

Do not upload reports to server storage.

---

# 24. DESIGN SYSTEM

Design should feel:

- premium
- modern
- clean
- privacy-focused
- lightweight
- trustworthy

Avoid:

- generic converter design
- excessive gradients
- spammy download buttons
- fake ads
- clutter
- huge navigation
- unnecessary animations

Use generous whitespace.

Suggested color semantics:

Green → safe

Amber → moderate privacy risk

Red → sensitive information detected

Neutral dark/light UI elsewhere.

Support:

- light mode
- dark mode
- system preference

---

# 25. MOBILE EXPERIENCE

Most workflows must work perfectly on mobile.

Optimize:

- photo selection
- file upload
- metadata inspection
- result cards
- download
- privacy explanations

Buttons should be thumb-friendly.

Do not create tables that become unusable on mobile.

Convert complex tables into cards when screen width is small.

---

# 26. TECH STACK

Recommended:

Next.js latest stable version

TypeScript

Tailwind CSS

shadcn/ui where useful

Web Workers

WebAssembly where necessary

Client-side file APIs

No database required for core functionality.

No authentication required.

Deployable to:

Vercel

Cloudflare Pages

or similar static/serverless infrastructure.

Core metadata processing should remain client-side regardless of hosting provider.

---

# 27. PERFORMANCE

Performance is critical for SEO.

Target:

Lighthouse Performance 95+

SEO 100

Accessibility 95+

Best Practices 95+

Keep initial JavaScript lightweight.

Metadata libraries should be lazy-loaded after the user selects a file.

Use Web Workers for expensive parsing.

Do not freeze the UI during large-file processing.

---

# 28. SEO ARCHITECTURE

Create individual search-focused tools.

Initial routes:

`/`

`/metadata-remover`

`/image-metadata-remover`

`/photo-metadata-remover`

`/pdf-metadata-remover`

`/exif-remover`

`/gps-metadata-remover`

`/metadata-viewer`

`/metadata-checker`

`/metadata-extractor`

`/exif-viewer`

`/image-metadata-checker`

Eventually:

`/video-metadata-remover`

`/word-metadata-remover`

`/remove-metadata-from-jpg`

`/remove-metadata-from-png`

`/remove-metadata-from-pdf`

However:

DO NOT create thin doorway pages.

Every page must contain:

- genuinely relevant tool functionality
- unique instructions
- format-specific information
- relevant FAQ
- unique title
- unique meta description
- relevant schema markup where appropriate

Do not automatically generate hundreds of low-value keyword pages.

---

# 29. INTERNAL LINKING

Create natural internal links.

Example:

Metadata Remover

→ Metadata Viewer

→ Metadata Checker

→ EXIF Remover

→ Image Metadata Remover

→ PDF Metadata Remover

Result screen should link into related tools.

Example:

**Want to inspect another file?**

Metadata Viewer →

**Only concerned about location?**

GPS Metadata Remover →

---

# 30. PROGRAMMATIC SEO SAFETY

We want scalable SEO eventually, but avoid spam.

Pages targeting:

remove metadata from jpg

remove metadata from png

remove metadata from pdf

must have meaningful differences.

Each file type page should:

- support that format
- explain its metadata format
- expose relevant metadata fields
- offer format-specific removal
- answer format-specific questions

Do not simply swap the file extension in otherwise identical text.

---

# 31. STRUCTURED DATA

Add appropriate schema where legitimate.

Possible schemas:

WebApplication

SoftwareApplication

FAQPage where current Google guidelines allow it

BreadcrumbList

Do not create fake ratings.

Do not fabricate reviews.

Do not claim millions of users.

---

# 32. ADSENSE-FRIENDLY DESIGN

The website will eventually be monetized with display ads.

Design ad placements without compromising usability.

Potential placements:

- below introductory explanation
- between educational sections
- below results
- within long informational guides

Do NOT put ads:

- inside upload controls
- directly beside misleading download buttons
- where users could accidentally click them
- where they obscure functionality

The tool must remain useful without ads.

---

# 33. CONTENT QUALITY

Add genuinely useful educational sections.

Examples:

## What is metadata?

Explain simply.

## Why remove metadata?

Discuss privacy.

## What information can photos reveal?

Examples:

- GPS
- capture date
- device
- camera
- creator

## Does removing metadata reduce image quality?

Give an accurate technical explanation.

## Does WhatsApp remove metadata?

Do not answer from assumptions.

Only publish factual claims we can verify.

---

# 34. FAQ

Homepage FAQ ideas:

What is metadata?

What metadata can photos contain?

Does this tool upload my files?

Does removing metadata reduce image quality?

Can metadata reveal my location?

Can I remove metadata from multiple files?

Does this tool remove EXIF data?

Can metadata be recovered after removal?

Can I keep copyright metadata?

Does removing metadata alter the image?

Keep answers useful and non-spammy.

---

# 35. TRUST PAGES

Create:

`/privacy`

`/terms`

`/about`

`/contact`

Privacy page must clearly state:

Files are processed locally when using supported tools.

Files are not uploaded to our servers.

No file content is collected.

Analytics should never capture file names or metadata values.

If advertising is later enabled, disclose relevant cookies/advertising practices accurately.

---

# 36. ANALYTICS PRIVACY

If analytics is added, only collect normal site analytics.

Never collect:

- uploaded file names
- GPS coordinates
- EXIF values
- author data
- extracted metadata
- file contents

Track only product events such as:

tool_opened

file_selected

scan_completed

clean_started

clean_completed

download_clicked

batch_started

Do not attach sensitive metadata to analytics events.

---

# 37. SECURITY

Treat uploaded files as untrusted.

Protect against:

- malformed EXIF
- malformed PDF structures
- decompression bombs
- oversized files
- infinite parser loops
- corrupted containers
- malicious embedded metadata
- unsafe filenames

Use file size limits based on browser capability.

Do not execute embedded scripts.

Do not render potentially dangerous document content unnecessarily.

---

# 38. ACCESSIBILITY

Use semantic HTML.

Keyboard navigation.

ARIA labels where needed.

Visible focus states.

Do not rely only on color to communicate privacy risks.

Example:

Instead of only a red dot:

🔴 High Risk — GPS location detected

---

# 39. ERROR STATES

Provide clear messages.

Examples:

**We couldn't read metadata from this file.**

**This file doesn't appear to contain removable metadata.**

**This format isn't supported yet.**

**This file may be corrupted.**

**The file is too large for your browser to process safely.**

Never pretend cleaning succeeded when it failed.

---

# 40. CLEAN FILE VERIFICATION

The cleaned output must be re-parsed locally after removal.

Only show:

# ✅ Privacy Check Passed

when the second scan confirms that no metadata categories classified as sensitive remain.

If something remains:

## ⚠️ Some metadata could not be removed

Show exactly which fields remain.

Do not mislead the user.

---

# 41. ARCHITECTURE

Create reusable modules.

Example:

`/lib/metadata/parsers/`

image-parser

pdf-parser

future-video-parser

future-office-parser

`/lib/metadata/cleaners/`

image-cleaner

pdf-cleaner

`/lib/privacy/`

risk-engine

field-classifier

privacy-presets

`/lib/verification/`

before-after-comparison

clean-verifier

Design interfaces so additional file types can be added without rewriting the entire application.

---

# 42. PRIVACY CLASSIFICATION ENGINE

Create normalized metadata fields.

Example:

```ts
interface MetadataField {
  id: string;
  key: string;
  label: string;
  rawValue: unknown;
  displayValue: string;
  category:
    | "location"
    | "device"
    | "identity"
    | "timestamp"
    | "software"
    | "copyright"
    | "camera"
    | "technical"
    | "other";
  riskLevel: "none" | "low" | "medium" | "high" | "critical";
  removable: boolean;
  privacyDescription?: string;
}
```

Create one normalized model regardless of metadata source.

This makes:

- viewer
- checker
- remover
- risk scoring
- selective cleaning
- verification

all use the same internal system.

---

# 43. PRIVACY SCORE ENGINE

Create transparent deterministic scoring.

Example structure:

Critical metadata:

GPS coordinates
personal identifier
device serial number

High:

author/person name
organization
embedded contact information

Medium:

device model
exact creation timestamps
editing history

Low:

editing software name
camera exposure settings

None:

dimensions
color space
orientation

Clamp score between 0 and 100.

Show user-friendly labels:

0–10

Minimal

11–30

Low

31–60

Moderate

61–80

High

81–100

Very High

Avoid claiming this is a formal cybersecurity assessment.

Call it:

**Privacy Risk Score**

and explain:

> The score estimates how much potentially identifying metadata was detected in your file.

---

# 44. DIFFERENTIATION SUMMARY

The application must be better than generic metadata-removal websites by combining:

### 1. Metadata visibility

Users see exactly what exists.

### 2. Privacy explanation

Users understand why a field matters.

### 3. Privacy Risk Score

Users immediately understand severity.

### 4. Selective removal

Users choose what gets removed.

### 5. Privacy presets

Privacy Clean / Remove Everything / Photographer Mode.

### 6. Local processing

Files never leave the browser.

### 7. Before/after proof

Show exactly what changed.

### 8. Verification

Rescan cleaned files automatically.

### 9. Quality confirmation

Verify whether dimensions/pixel data changed.

### 10. Batch processing

Clean many files efficiently.

These must feel like one cohesive product.

---

# 45. USER FLOW

Ideal homepage flow:

### Step 1

User lands from Google.

### Step 2

Immediately sees:

Free Metadata Remover

100% private browser processing.

### Step 3

Drops image.

### Step 4

Within seconds:

Privacy Risk: HIGH

11 sensitive properties found.

### Step 5

User can inspect them.

### Step 6

Recommended action:

**Privacy Clean**

### Step 7

Tool removes metadata locally.

### Step 8

Cleaned file is rescanned.

### Step 9

Result:

✅ Privacy Check Passed

11 sensitive fields removed.

### Step 10

User downloads clean file.

This entire flow should require no account and minimal friction.

---

# 46. DO NOT DO THESE THINGS

Do not:

- upload files without clear need
- require sign-up
- use fake progress bars
- fabricate metadata
- fabricate security claims
- claim encryption when irrelevant
- claim 100% removal unless verified
- claim no quality loss if re-encoding occurs
- spam SEO keywords
- create thin doorway pages
- add intrusive popups
- put fake download buttons beside ads
- make the interface look like a low-quality converter website

---

# 47. BUILD ORDER

Implement in phases.

## Phase 1 — Core engine

JPG/JPEG

PNG

WebP

Metadata parsing

Metadata removal

Before/after verification

## Phase 2 — Core UX

Upload

Privacy score

Metadata viewer

Selective cleaning

Presets

Result screen

## Phase 3 — SEO pages

Homepage

Metadata remover

Image metadata remover

Metadata viewer

Metadata checker

EXIF remover

## Phase 4 — More formats

PDF

HEIC

TIFF

## Phase 5 — Batch tools

multi-upload

folder processing

ZIP download

## Phase 6 — Expansion

Office

Video

Audio

Do not build dozens of half-working tools before the core metadata engine is reliable.

---

# 48. TESTING

Write automated tests for:

Metadata extraction

GPS detection

EXIF detection

Metadata classification

Risk score calculations

Privacy presets

Selective removal

Complete removal

Output file validity

Before/after comparison

Files without metadata

Corrupted files

Large files

Unusual metadata

Unicode metadata

Use real fixture files with known metadata.

Test that cleaned outputs no longer contain removed metadata.

---

# 49. FINAL PRODUCT STANDARD

The site should make the user immediately understand:

**What hidden information exists**

↓

**Why it might be risky**

↓

**What will be removed**

↓

**Whether removal succeeded**

↓

**Whether the cleaned file is safe to share**

The result should feel much closer to a:

# File Privacy Scanner

than a generic:

# Metadata Converter

That is the central product strategy.

---

# 50. FINAL HOMEPAGE MESSAGE

Use positioning approximately like:

# Remove Hidden Metadata Before You Share

Photos and documents can contain hidden GPS locations, device information, timestamps and personal details.

Upload a file to see what's inside.

**Your files never leave your device.**

[Check & Remove Metadata]

Below CTA:

✓ Free
✓ No sign-up
✓ Browser-only processing
✓ Before & after verification

The application must deliver on every claim displayed here.

---

Build this as a genuinely useful privacy utility first and an SEO site second.

The reason users should prefer this product over generic metadata removers is:

# We don't just delete metadata.

# We show users what was exposed, explain the risk, remove it, and prove that it's gone.
