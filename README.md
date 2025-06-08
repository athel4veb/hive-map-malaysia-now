
# ASBhive Admin Panel

A comprehensive admin dashboard for managing startup and VC/grant data scraping, built with React, TypeScript, and Supabase.

## Features

### 🚀 Data Management
- **URL Management**: Add, remove, and bulk import URLs for scraping
- **CSV Upload**: Import URLs from CSV files
- **Dual Data Types**: Support for both startup and VC/grant data sources

### 📊 Analytics Dashboard
- Real-time data visualization with charts and graphs
- Sector distribution analysis
- Yearly trends tracking
- AI-powered insights generation

### 🔧 Scraping Controls
- Automated data scraping via n8n webhooks
- Real-time scraping status monitoring
- Data export functionality (JSON format)

### 🤖 AI-Powered Features
- Smart matchmaking between startups and VCs
- AI-generated insights from data patterns
- Automated data analysis and recommendations

### 🔐 Authentication & Security
- Supabase authentication integration
- Role-based access control
- Row Level Security (RLS) policies

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Fetching**: TanStack Query
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd asbhive-admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
src/
├── components/
│   ├── admin/           # Admin panel specific components
│   │   ├── Dashboard.tsx
│   │   ├── URLManager.tsx
│   │   ├── ScrapingControls.tsx
│   │   └── RecentActivity.tsx
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   └── Navbar.tsx
├── hooks/
│   ├── useDashboardData.ts    # Dashboard data management
│   ├── useUrlManager.ts       # URL management logic
│   └── use-toast.ts
├── pages/
│   ├── AdminPanel.tsx         # Main admin dashboard
│   ├── StartupExplore.tsx     # Startup discovery page
│   ├── VCExplore.tsx         # VC/Grant discovery page
│   ├── Matchmaker.tsx        # AI matchmaking interface
│   └── Auth.tsx              # Authentication page
├── utils/
│   └── scrapingUtils.ts      # Scraping and export utilities
├── integrations/
│   └── supabase/            # Supabase client and types
└── lib/
    └── utils.ts             # General utilities
```

## Database Schema

### Core Tables
- `startup` - Startup company data
- `grant_programs` - VC firms and grant programs
- `startup_urls` - URLs for startup scraping
- `grant_urls` - URLs for VC/grant scraping
- `profiles` - User profile information

### Key Features
- Row Level Security (RLS) enabled on all tables
- User-specific data access controls
- Automated profile creation on user registration

## API Integration

### n8n Webhooks
The application integrates with n8n workflows for automated data scraping:

- **Startup Scraping**: `https://n8n.vebmy.com/webhook/getstartupscrape`
- **VC/Grant Scraping**: `https://n8n.vebmy.com/webhook/scrapevc`

### Supabase Edge Functions
- `ai-matchmaker` - AI-powered matching between startups and VCs using Google Gemini

## Deployment

### Using Lovable
1. Connect your project to GitHub via the Lovable interface
2. Click "Publish" to deploy to Lovable's hosting platform

### Manual Deployment
1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your preferred hosting service

### Environment Variables for Production
Ensure these environment variables are set in your production environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (for AI features)

## Usage

### Admin Panel Access
1. Navigate to `/admin` after authentication
2. Use the dashboard to monitor data and analytics
3. Add URLs for scraping in the URL Management section
4. Start scraping processes and monitor progress
5. Export data as needed

### Data Import Methods
- **Single URL**: Add individual URLs manually
- **Bulk Text**: Paste multiple URLs (one per line)
- **CSV Upload**: Import URLs from CSV files

### AI Matchmaking
1. Visit `/matchmaker`
2. Select your user type (startup seeker or VC)
3. Describe your requirements
4. Get AI-powered matches with detailed reasoning

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Security Considerations

- All database operations use Row Level Security (RLS)
- User authentication required for admin functions
- API keys stored securely in Supabase secrets
- CORS properly configured for webhook endpoints

## License

This project is proprietary and confidential.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

Built with ❤️ using Lovable, React, and Supabase
