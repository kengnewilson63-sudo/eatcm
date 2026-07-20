/** @type {import('tailwindcss').Config} */
module.exports={
  content:['./src/**/*.{html,ts}'],
  theme:{extend:{
    colors:{
      primary:{DEFAULT:'#FF5A36',dark:'#E04020'},
      secondary:{DEFAULT:'#1A1A1F'},
      accent:{DEFAULT:'#FFC247'},
      success:'#22C55E',warning:'#F59E0B',error:'#EF4444',muted:'#9CA3AF',
    },
    fontFamily:{sans:['Plus Jakarta Sans','sans-serif']},
    boxShadow:{
      card:'0 2px 12px rgba(0,0,0,0.08)',
      'card-lg':'0 8px 32px rgba(0,0,0,0.12)',
      primary:'0 4px 20px rgba(255,90,54,0.35)',
      nav:'0 -1px 20px rgba(0,0,0,0.08)',
    },
  }},
  plugins:[],
};
