/** Used by shadcn CLI for component scaffolding; Tailwind v4 tokens live in `src/index.css`. */
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
} satisfies Config;
