# Filmila - Film Distribution Platform

A modern web application for filmmakers to distribute their films and for viewers to discover and watch films.

## Features

- User authentication (Viewer, Filmmaker, Admin roles)
- Film upload and management
- Film browsing and viewing
- Admin dashboard for content management
- Responsive design

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- React Router
- React Hot Toast

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/filmila.git
cd filmila
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Deployment

The application can be deployed to various platforms:

### Vercel (Recommended)
1. Push your code to GitHub
2. Import the project in Vercel
3. Add your environment variables
4. Deploy

### Netlify
1. Push your code to GitHub
2. Import the project in Netlify
3. Add your environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 