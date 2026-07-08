# 🏠 HouseManagement

An all-in-one house management suite designed for couples to organize household finances, subscriptions, shopping, inventory, and important events from a single dashboard.

---

# Features

## 📊 General Dashboard

- Household overview
- Financial summary
- Upcoming obligations
- Recent activity
- Quick access to all modules

## 💰 Finance

Manage your household finances with dedicated tools for:

- Transactions tracker
- Accounts
- Budgets
- People
- Obligations
  - Money you owe
  - Money owed to you
- Reports and analytics

## 🛒 Shopping

Plan your purchases before going to the store.

- Shopping lists
- Estimated total cost
- Product price history
- Automatic price estimation based on previously stored prices

## 🎮 Entertainment

Keep track of recurring entertainment expenses.

- Subscription manager
- Game library
- Wishlist

## 🏠 Home Inventory

Maintain an organized inventory of your belongings.

- Appliances
- Electronics
- Furniture
- Vehicles
- Serial numbers
- Models
- Purchase details
- Warranty reminders
- Maintenance reminders

## 📅 Calendar

Never miss an important date.

- Upcoming payments
- Financial reminders

---

# Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui v2, @base-ui/primitives |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth (SSR) |
| Data Fetching | TanStack React Query v5 |
| Forms | react-hook-form v7, Zod v4 |
| Charts | Recharts |
| Notifications | Sonner |
| Icons | Lucide React |
| Dates | date-fns |
| Spreadsheet Export | SheetJS (xlsx) |
| Search | cmdk |
| Theme | next-themes |

---

# Getting Started

## Clone the repository

```bash
git clone https://github.com/yourusername/househub.git
cd househub
```

## Install dependencies

```bash
npm install
```

or

```bash
pnpm install
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Start the development server

```bash
npm run dev
```

Then open:

```
http://localhost:3000
```

---

# License

MIT License.
