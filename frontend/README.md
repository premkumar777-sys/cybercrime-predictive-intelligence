# Cyberguard Nexus

Build a frontend-only prototype for a Smart India Hackathon project called:

Telangana Cybercrime Predictive Intelligence Platform

IMPORTANT

FRONTEND ONLY.

No backend, database, Supabase, Firebase, APIs, authentication, or real integrations.

Use only static/mock data.

No real prediction logic.

No unnecessary features or complex architecture.

Keep the implementation lightweight to minimize Lovable usage/credits.

Everything should be a polished clickable UI prototype only.

Product Concept

Cybercrime complaint → transaction analysis → predictive intelligence → ranked possible cash-withdrawal locations → map → investigator report.

Predictions must always be presented as risk/likelihood estimates, never guaranteed outcomes.

3 ROLES — ONE APPLICATION

Create one application with three role-based experiences:

1. Victim/Citizen

Landing/login UI

Dashboard

Report Cybercrime form

Transaction details

Evidence upload UI

Generated Case ID

Complaint status timeline

2. Police

Police dashboard

Case list

Case details

Risk-level overview

Transaction timeline

Alerts

Basic charts/statistics

3. Investigator

Investigator dashboard

Case analysis page

Transaction timeline

Transaction relationship visualization

Predictive intelligence panel

Ranked candidate locations

Interactive map

Explainability/supporting factors

Intelligence report UI

The Investigator dashboard/case-analysis page should be the main showcase screen.

LANDING PAGE

Create a professional government/public-safety style landing page.

Hero:
Predictive Cybercrime Intelligence

Subtitle:
From cybercrime complaints to proactive, location-based investigative intelligence.

Show the workflow visually:

Complaint → Transaction Intelligence → Analysis → Geospatial Intelligence → Location Ranking → Actionable Intelligence

Add buttons:

Report Cybercrime

Police Login

Investigator Login

Sections:

Why this platform?

How it works

Key capabilities

Important prediction disclaimer

DESIGN

Style should feel like a modern Indian government cybercrime intelligence platform:

Professional

Trustworthy

Secure

Clean

Modern

Serious

Responsive

Avoid:

Cyberpunk

Hacker/Matrix effects

Neon

Gaming UI

Excessive animations

Use restrained colors, clear typography, cards, tables, badges, icons and subtle transitions.

Use React + TypeScript + Tailwind + shadcn/ui + Lucide icons where available.

DEMO DATA

Use clearly fictional demo data such as:

Case: CASE-2026-00124
Fraud: UPI Fraud
Amount: ₹75,000
Risk: HIGH

Example candidate locations:

Central ATM — Risk Score 86% — 18:00–20:00

Market Area ATM — Risk Score 72% — 18:00–21:00

City Center ATM — Risk Score 61%

Show supporting factors:

Temporal similarity

Geographic relevance

Transaction similarity

Network relationship

Historical pattern

Use clearly fictional Telangana locations/data and do not imply official Telangana Police ownership.

MOST IMPORTANT

Do not build three separate websites.

Build one polished frontend application with three role-based UI experiences sharing the same visual design.

The complete visual story should be:

Victim reports → Police receives → Investigator analyzes → Prediction displayed → Locations ranked → Map shown → Intelligence report displayed

Focus on visual quality and demo presentation, not functionality or backend implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b0bf4a57-6be4-49dc-8c3c-aa81d35feb29).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
