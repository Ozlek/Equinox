# Frontend Architecture Documentation

## Project Overview
Equinox frontend is a React 19.2.6 application built with Vite 8.0.12.

### Technology Stack
- **React 19.2.6**: UI library
- **Vite 8.0.12**: Build tool and dev server
- **Axios**: API client for backend communication
- **Bootstrap Icons**: Icon set
- **Patrick Hand**: Custom font (Google Fonts)

### Configuration Files
| File | Purpose |
|------|---------|
| `vite.config.js` | Vite config with React plugin |
| `eslint.config.js` | ESLint flat config |
| `package.json` | Dependencies and scripts |
| `index.html` | HTML entry point |

### Available Scripts
```bash
npm rundev    # Start development server
npm runbuild  # Build for production
npm runlint   # Run ESLint
npm runpreview # Preview production build
```

## API Integration

### Base URL
Development: `http://localhost:8000` (Django default)
Production: Configured via environment or relative paths

### Axios Setup
```javascript
import axios from 'axios';

// All API calls use /api/ prefix
// Example: POST /api/login/
```

### Common API Patterns
```javascript
// GET request
axios.get('/api/check-auth/')
  .then(response => { /* handle */ })
  .catch(error => { /* handle */ });

// POST request with JSON
axios.post('/api/login/', {
  username: 'user',
  password: 'pass'
})
  .then(response => { /* handle */ });
```

## Component Structure

### Entry Point
```
src/main.jsx  →  renders <App />  →  rest of application
```

### Key Files
- `src/main.jsx`: Root render point
- `src/App.jsx`: Main application container (content not fully visible in codebase)
- `vite.config.js`: Vite configuration
- `eslint.config.js`: ESLint configuration

### Styling
- Bootstrap Icons for UI icons
- Patrick Hand font for headings (imported from Google Fonts)
- `index.css`: Base styles

## Configuration

### Vite Config (`vite.config.js`)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### ESLint Config (`eslint.config.js`)
- Recommended JavaScript rules
- React Hooks plugin
- React Refresh plugin
- Browser globals configured

### Package Dependencies
| Dependency | Purpose |
|------------|---------|
| `react` | ^19.2.6 | UI library |
| `react-dom` | ^19.2.6 | DOM rendering |
| `axios` | ^1.18.0 | API client |
| `@vitejs/plugin-react` | ^6.0.1 | React Vite plugin |
| `@eslint/js` | ^10.0.1 | ESLint core |
| `eslint-plugin-react-hooks` | ^7.1.1 | React Hooks linting |
| `eslint-plugin-react-refresh` | ^0.5.2 | React Refresh linting |

## Development Workflow

### 1. Start Backend
```bash
cd backend
python manage.py runserver
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Access Application
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/...`
- Django Admin: `http://localhost:8000/admin/`

### 4. CORS Configuration
Ensure backend `.env` has:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## API Endpoints Used by Frontend

### Authentication
- `POST /api/login/` - User login
- `POST /api/register/` - User registration
- `POST /api/onboarding/` - Set grade level
- `GET /api/check-auth/` - Auth status

### Playthrough
- `GET/POST /api/playthrough/start/` - Start session
- `POST /api/playthrough/answer/` - Submit answer

### DDA Rating
- `GET /api/dda/rating/` - Get current rating

### Achievements
- `GET /api/achievements/` - List achievements
- `GET /api/user/achievements/` - User achievements