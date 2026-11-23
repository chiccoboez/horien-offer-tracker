# Horien Offer Tracker

Act as an expert full-stack developer and create an "Offer Tracker CRM" web application. The app must be responsive, modern, and have a persistent database (use Supabase for database and storage). Do NOT implement user authentication or login screens; the app will be accessed directly via URL for personal use.

0. Branding & UI Theme (HORIEN)

App Title: "HORIEN OFFER TRACKER" (Display this prominently in the header/sidebar).

Design System: Extract the primary color, secondary color, corporate fonts, and logo directly from this website: https://saltbattery.horien.com/

Implementation: Apply these corporate colors to the UI theme (buttons, active states, sidebar background, text highlights) using Tailwind CSS. Place the Horien logo at the top left of the navigation/sidebar. The overall look must be a sleek, professional B2B CRM consistent with the Horien brand identity.

1. Core Concept & Database (Supabase)
Create a database table called offers with the following fields:

id (UUID, primary key)

offer_name (String, manually entered by the user)

created_at (Timestamp)

offer_date (Date)

po_date (Date, nullable - to be filled only when status becomes "PO received")

customer_name (String)

end_customer_name (String)

battery_models (JSON array). The model name MUST be selected from a fixed dropdown with these exact values: "24UP160", "24UP200", "48UP160", "48UP200", "110UP80", "125UP80", "220UP40", "250UP40", "380UP40", "450UP40". Each model selected will have a corresponding quantity (Number).

total_amount (Number, formatted as Currency €)

notes (Text)

country (String)

region (String)

status (Enum/String: exactly "quoted", "LOI", or "PO received")

pdf_url (String, link to the file stored in Supabase Storage)

2. App Structure & Pages
Provide a sidebar or top navigation to access the following 3 main pages:

Page A: Dashboard Principale (Metrics, Alerts & New Offer Form)

Top Section - Metrics:

Total Value (€) of offers in "quoted" status.

Total Value (€) of offers in "LOI" + "PO received".

Breakdown (table/bar chart) of total batteries by model (summing quantities across all offers).

Middle Section - Follow-up Alerts:

A notification area displaying alerts for offers that have been in "quoted" status for more than 1 month (based on offer_date).

Alert text format: "Promemoria: Contattare il cliente [customer_name] per l'offerta [offer_name]".

Bottom Section - Nuova Offerta (Data Entry):

A clean form to add a new offer. Inputs for all fields (offer_name, offer_date, customer_name, etc.).

Dynamic input for battery_models (Add row -> select from dropdown -> input quantity).

File upload component for PDF (integrated with Supabase Storage).

Save button with success toast and immediate database update.

Page B: Gestione Offerte (List, Search, CRUD & Export)

A data table displaying all offers.

Tabs: "Tutte le offerte" (All offers) and "Solo Quoted" (Only 'quoted' status).

Tools: Search Bar (by customer, end-customer, country, or offer name). Filters by status, battery_model, and region.

Export: A prominent "Export to CSV" button that downloads the current view of the table.

Actions on each row:

View/Download PDF.

Delete: With confirmation dialog.

Edit: Opens a modal to update fields. Crucial logic: If the user changes the status to "PO received", dynamically show a new date picker input for po_date (Data ricezione PO) so it can be saved.

Page C: Statistiche (Historical Analytics)

A reporting page showing aggregated data grouped by Month and by Year (based on offer_date).

For each period (e.g., January 2026, Year 2026), display:

Number of offers made.

Total number of batteries quoted (sum of all quantities).

Total quoted amount (€) (sum of total_amount).

Use simple tables or charts (Recharts) to visualize these trends over time.

3. Technical Requirements

Ensure state management handles real-time updates so that adding, editing, or deleting an offer instantly refreshes metrics, alerts, and tables across all pages without requiring a page reload.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://horien-offer-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a17e1f85-79df-45e6-b155-bb5a1bf65cf0).

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
