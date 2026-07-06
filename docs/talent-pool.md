# Wavloops Talent Pool — Product Spec

Curated artist directory + AI-powered beat/artist matching. The strategic feature that turns Wavloops from a beat-sharing tool into a full placement pipeline.

**Status** : Draft / to build
**Owner** : Theo
**Target ship** : Sprint 1 (curated directory, 1 week) → Sprint 2 (AI Finder, 4-6 weeks later)

---

## 1. Vision

Wavloops becomes the **curated marketplace** where music producers discover, save, and pitch artists — not by scraping the internet in real-time, but by browsing a hand-selected pool of quality artists organized like Spotify playlists.

**One-liner** : "Spotify-like discovery for producers, with a direct pipeline to pitch."

## 2. The problem it solves

Producers today spend 15+ hours/week manually searching YouTube for artists to pitch. The result :
- Random results, no curation
- Contact info scattered across bios, descriptions, comments
- Cold outreach with no tracking, no CRM, no follow-up
- 1-3% response rate (industry standard)

Wavloops Talent Pool solves this by :
1. Providing a **curated pool** vetted editorially (Theo's taste = the moat)
2. Organizing artists into **browseable categories** (Fresh Pool, Top Drill, Rising Atlanta, etc.)
3. Offering **direct outreach in-app** for artists with business emails
4. Providing **CRM tracking** for all pitches (Direct + Manual)
5. In Phase 2, adding **AI matching** that pairs uploaded beats with artists from the pool

## 3. Two-phase approach

### Phase 1 — Curated Directory (Sprint 1, 1 week)
Ship the browsing + Pro paywall. NO AI. Just editorial curation.

### Phase 2 — AI Finder (Sprint 2, 4-6 weeks later)
Once the pool has 200-500 artists, add the "Find matching artists for this beat" feature powered by Fable 5. Runs against the curated pool, not live YouTube.

**Reason for phasing** : ship value fast without AI dependency. AI adds compounding value once the data is rich.

---

## 4. Feature scope — Phase 1

### 4.1 Sidebar entry

Add "Talent" as a new sidebar item between Contacts and Settings :
- Icon : binoculars or radar
- Badge : "NEW" for first 30 days, then remove

### 4.2 Main Talent page (`/talent`)

Spotify-like layout :
- Header : "Talent Pool · Curated by 40mins"
- Horizontal scrollable rows :
  - **Fresh Pool** (artists added this month)
  - **Top Drill Artists**
  - **Rising in Atlanta**
  - **Melodic Trap**
  - **Underground R&B**
  - **Editor's Picks** (Theo's top selection)
- Filter bar : search + genre chips + region chips
- Each card : avatar, name, handle, primary genre tag, subs count, contact-type badge (see 5.)

### 4.3 Artist detail page (`/talent/[artistId]`)

- **Header** : avatar + name + handle + tags
- **Bio** : 2-3 line editorial description (written by Theo when adding)
- **Stats** : YouTube subs, IG followers (if scraped), last release date, activity indicator (🟢 active last 30d / 🟡 moderate / 🔴 inactive 60+ days)
- **Latest tracks** : 3-5 recent YouTube uploads embedded, playable in-page
- **Contact section** (varies by contact type — see 5.)
- **Actions** :
  - `Save to Radar` (persistent, per-producer list)
  - `Add to server` (if Direct contact + Pro plan)
  - `Copy DM template` (Manual contact + Pro plan)
  - Status selector pill : `Not pitched` / `Pitched` / `Responded` / `Deal` / `Pass`

### 4.4 The Radar (`/talent/radar`)

Producer's personal shortlist of saved artists. Similar layout to the main pool but scoped to their saves. Includes :
- Activity feed : "🎤 UnkoDayShaii dropped 'Overtime' 2 days ago"
- Status overview : X pitched, Y responded, Z deals
- Bulk actions : mark multiple, bulk copy DMs

---

## 5. Two contact types

Each artist profile has a `contact_method` field set at creation time :

### 5.1 `direct` — Has verified business email

Business email criteria (RGPD-compliant) :
- Publicly displayed in a business context (YouTube About "for business inquiries", video description tagged "booking/contact", Instagram linktree contact field)
- Domain agnostic : Gmail is fine IF displayed as business contact
- **Store the source URL** (where the email was found) for audit trail

UX :
- Contact section shows email (Pro plan) or blurred (Free plan)
- **`Add to server` button active** → Wavloops sends the invitation via magic-link, exactly like the existing "add contact to server" flow
- Full tracking : opens, clicks, listens, downloads all captured in-app

Badge : 🟢 `Direct contact`

### 5.2 `manual` — Only public social (IG, YouTube, WhatsApp, etc.)

For artists without a business email available.

UX :
- Contact section shows IG handle + YouTube channel + any other public link
- **No `Add to server` button** — technically impossible without email
- **`Copy DM template` button** (Pro plan) → Fable 5 generates a personalized pitch based on the beat + artist style
- Producer manually pastes the DM in IG/WhatsApp/wherever
- Returns to Wavloops to mark status : `Pitched` → auto-reminder in 5 days if no update

Badge : 🟡 `Manual contact`

### 5.3 `label_group` — Label or music group entity

Same as `direct` but for collective entities. Legal risk is lower (labels' generic emails are explicitly for outreach).

Badge : 🔵 `Label / Group`

---

## 6. Business model

### Free plan
- Browse the full Talent Pool
- See all artist profiles (bio, stats, tracks, badges)
- Save up to 5 artists in Radar
- Contact info **blurred** for Direct contacts
- Public links (IG/YouTube) visible for Manual contacts (already public anyway)
- Cannot use `Add to server` on Direct contacts

### Pro plan ($99/year)
- Unlimited Radar saves
- **Unlock all business emails** (Direct contacts)
- **`Add to server` active** on Direct contacts
- **AI-generated DM templates + pitch angles** on Manual contacts
- **Release notifications** for saved artists
- Full CRM tracking + auto-reminders
- **AI Finder** (Phase 2)
- Submit artist nominations to the pool (crowd-sourced expansion)

### Rationale
- The Pro paywall is legitimate : you pay for curated contact database + workflow acceleration
- Direct contact + Add-to-server = **immediate value in 3 clicks**
- Manual contact + templates + tracking = **15 hours/week saved on manual YouTube veille**

---

## 7. Legal framework — RGPD compliance

### 7.1 What emails to include

Only emails found in a **publicly declared business context** :
- ✅ YouTube "For business inquiries" section
- ✅ Video description labeled "booking/contact/manager"
- ✅ Instagram bio contact field
- ✅ Linktree/direct link explicitly for business
- ✅ Label/manager emails on official pages
- ❌ Emails scraped from random comments
- ❌ Emails from third-party leak/doxxing sites
- ❌ Personal emails not designated as contact points

### 7.2 Store source URLs

For every email added to the database, store the URL where it was found. Column : `email_source_url`. Provides audit trail if a complaint arises.

### 7.3 Transparency in every invitation

Each invitation email sent via Wavloops must include :

```
Nous avons trouvé votre email professionnel sur votre chaîne YouTube publique.
Vous ne souhaitez pas être contacté via Wavloops ?
[Retirer mon profil] · [Se désinscrire]
```

### 7.4 Public claim / removal page

Create `/artist-directory-privacy` (public, unauth-gated) where any artist can :
- **Claim their profile** → creates a free Wavloops artist account with control over their listing
- **Update their info** (bio, genres, contact preferences)
- **Remove themselves** → full deletion within 30 days (RGPD Art. 17)
- **Blacklist** their email so they're never re-added

### 7.5 Right to erasure processing

Any removal request must be processed within 30 days (RGPD obligation). Automate this : a simple admin panel workflow where Theo (or an admin) confirms the removal.

### 7.6 Terms of Service update

Update Wavloops CGU/T&C to explicitly cover this data processing :
- Legal basis : legitimate interest (B2B prospection)
- Data retention : until artist requests removal or 3 years of inactivity
- Data recipients : only Pro plan producers, no third-party sharing
- Rights : access, rectification, erasure, objection

**Recommendation** : consult a RGPD lawyer ($500-1500) before scaling to 5000+ profiles to validate the T&C and privacy policy.

### 7.7 The "value return" strategy

Best defense against reputation risk : make sure artists **want** to be in the database.

When an artist claims their profile, they get :
- Free artist Wavloops account
- Analytics on which producers have viewed their profile
- Notifications when a producer pitches them
- Control over their listing (edit, hide, remove)
- Optional : featured slot in categories they opt-into

This flips the dynamic : instead of "we harvest your data", it becomes "we help you get discovered by qualified producers".

---

## 8. Admin workflow — how Theo populates the pool

### 8.1 Admin panel `/admin/talent`

Simple form to add an artist :
- Paste YouTube channel URL → backend auto-fetches avatar, subs, recent uploads via YouTube Data API
- Instagram handle → save link
- Business email (if found) → save + source URL
- Genre tags (multi-select)
- Category assignment (Fresh Pool, Top Drill, etc.)
- Bio (2-3 lines, editorial)
- Contact type auto-set based on email presence

### 8.2 Bulk import

CSV upload for batch adding :
- Columns : `name, youtube_url, instagram_handle, business_email, source_url, tags, category, bio`
- Backend processes each row, fetches YouTube data via API, saves the profile
- Useful for weekend bootstrap sessions (add 100 artists in one shot)

### 8.3 Editorial workflow

Weekly cadence :
- Monday : review "Fresh Pool" candidates from crowd-sourced nominations (Pro users)
- Wednesday : add 5-10 new artists
- Friday : refresh "Top" categories based on activity data

---

## 9. AI Finder — Phase 2 (Sprint 2, 4-6 weeks after Phase 1)

Once the pool has 200+ artists, add the AI matching feature.

### 9.1 Trigger
Button `🔍 Find matching artists` on each beat detail page.

### 9.2 Flow
1. Producer clicks the button on beat "Emotions" (from Toronto Chop server)
2. Fable 5 analyzes beat metadata : BPM, key, mood, style, loudness
3. Fable 5 cross-references against the curated Talent Pool
4. Returns top 10 matches with :
   - Match score (0-100%)
   - Explanation (why this artist matches)
   - Suggested pitch angle
   - Pre-generated DM template (personalized to the artist)

### 9.3 Cost per query
~$0.20 (10k input + 2k output tokens with Fable 5)
Include in Pro plan (up to 20 queries/month), or offer as add-on credit ($5 = 25 queries).

### 9.4 Why AI matching works better on curated pool than live YouTube
- Data is clean, structured, editorial-quality
- No hallucinations from bad YouTube scraping
- Match explanations are rich because artist metadata is complete
- Producer trusts the results because Theo pre-vetted the artists

---

## 10. Bootstrap strategy — first 4 weeks

### Week 1 : ship Phase 1
- Sidebar item + `/talent` page + `/talent/[id]` page
- Admin panel + bulk CSV import
- Free/Pro tiering (email blur, Add-to-server gate)
- Public claim/removal page + T&C update

### Week 2 : bootstrap catalog
- Theo adds 50 artists manually, split across categories :
  - 20 with business emails (Direct contacts)
  - 25 with IG/YouTube only (Manual contacts)
  - 5 labels/groups (Label contacts)
- Focus on the 40mins niche : drill / dark trap / atlanta / melodic

### Week 3 : soft launch
- Email the 585 old users : "Wavloops is back. Try the Talent Pool."
- Land on `/talent` after signup
- Monitor engagement : clicks per category, saves per producer, Pro conversions

### Week 4 : iterate
- Based on user behavior, refine categories
- Add 25-50 more artists in high-engagement niches
- Identify Pro plan conversion rate baseline

---

## 11. Success metrics

### Phase 1 (curated directory)
- **Talent Pool DAU** among producers : target 30%+ within 30 days
- **Radar saves per producer** : target 15+ average
- **Pro conversion rate from Talent Pool** : target 8%+ (vs current 2%)
- **Artist claim rate** : target 5% of profiles claimed within 60 days (health signal)

### Phase 2 (AI Finder)
- **AI Finder usage per Pro user per month** : target 10+ queries
- **Match → pitch conversion** : target 40% (out of 10 matches, 4 pitched)
- **Pitch → response rate on AI-matched artists** : target 8%+ (vs 2% cold)

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Legal challenge on data processing | Business-email-only, source tracking, opt-out, T&C, RGPD lawyer review before scale |
| Reputation risk if artist unhappy | Claim/removal flow, value-return strategy, transparent invitations |
| Catalog quality drift | Editorial gatekeeping, Theo reviews all additions in Phase 1 |
| Slow Pro conversion | Pricing test, offer free trial of Pro with Talent Pool access |
| Fable 5 cost overrun in Phase 2 | Cache results 24h, cap monthly queries per Pro user, offer add-on credits |
| YouTube Data API quota exhaustion | 10k units/day free = ~500 admin operations. Enough for weekly bootstrap; monitor and upgrade if needed. |

---

## 13. Open questions

- **Pricing** : $99/year is current Pro plan. Does Talent Pool justify a higher tier ($199/year) or stays at $99 ?
- **Artist nominations** : how do Pro users submit artists ? Simple form + Theo approves ? Or vote-based ?
- **Categories curation** : who names categories ? Only Theo, or crowd-sourced ?
- **Analytics dashboard for artists** : Phase 3 feature ?
- **International expansion** : if scaling to non-francophone/non-anglophone markets, review local privacy laws (LGPD Brazil, PIPEDA Canada, etc.)

---

## 14. Next actions

- [ ] Validate this spec with 2-3 producer users (Ramon Manrrique + dlegendbeats + spyderblacklives)
- [ ] Sketch DB schema (`talent_artists`, `talent_categories`, `talent_radar_saves`, `talent_status_updates`)
- [ ] Draft the T&C update + privacy policy sections
- [ ] Design the artist card + detail page (Wavloops DS)
- [ ] Setup YouTube Data API v3 key in Google Cloud Console
- [ ] Consult a RGPD lawyer (budget $500-1500, before scaling to 500+ profiles)

---

*Last updated : 2026-07-06 by Theo + Claude*
