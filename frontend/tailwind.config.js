/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        darkbg: '#05070e',
        panelbg: 'rgba(13, 20, 38, 0.65)',
        borderblue: '#1f2d4d',
        cpcb: {
          good: '#00b050',
          satisfactory: '#92d050',
          moderate: '#ffff00',
          poor: '#ffc000',
          verypoor: '#ff0000',
          severe: '#c00000'
        }
      },
      animation: {
        'glow-pulse': 'glowPulse 1.8s infinite alternate',
        'wave-flow': 'waveFlow 4s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%': { transform: 'scale(0.9)', boxShadow: '0 0 10px 2px rgba(255, 87, 34, 0.4)' },
          '100%': { transform: 'scale(1.15)', boxShadow: '0 0 22px 8px rgba(255, 87, 34, 0.65)' }
        },
        waveFlow: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      }
    },
  },
  plugins: [],
}
