import{s as n,r as o,j as e,E as r,H as i,I as c,J as d,K as l,O as x,Q as m,x as h}from"./index-ClBrSNJO.js";const u=({iconName:s,className:t})=>{switch(s){case"FlameIcon":return e.jsx(h,{className:t});case"AwardIcon":return e.jsx(r,{className:t});case"ScienceIcon":return e.jsx(m,{className:t});case"MathIcon":return e.jsx(x,{className:t});case"SocialStudiesIcon":return e.jsx(l,{className:t});case"PhysicsIcon":return e.jsx(d,{className:t});case"ChemistryIcon":return e.jsx(c,{className:t});case"BiologyIcon":return e.jsx(i,{className:t});default:return e.jsx(r,{className:t})}},j=()=>{const{newAchievement:s,clearNewAchievement:t}=n();return o.useEffect(()=>{if(s){const a=setTimeout(()=>{t()},5e3);return()=>clearTimeout(a)}},[s,t]),s?e.jsxs("div",{className:"fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm p-4 bg-white rounded-xl shadow-2xl border border-slate-200 animate-slide-down-fade",children:[e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 ${s.color}`,children:e.jsx(u,{iconName:s.icon,className:"w-7 h-7"})}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-extrabold text-slate-800",children:"Achievement Unlocked!"}),e.jsx("p",{className:"text-sm font-semibold text-slate-600",children:s.name}),e.jsx("p",{className:"text-xs text-slate-500 mt-1",children:s.description})]})]}),e.jsx("div",{className:"absolute bottom-0 left-0 h-1 bg-[var(--brand-primary)] animate-progress-bar"}),e.jsx("style",{children:`
                @keyframes slide-down-fade {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-down-fade {
                    animation: slide-down-fade 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
                }
                @keyframes progress-bar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress-bar {
                    animation: progress-bar 5s linear forwards;
                }
            `})]}):null};export{j as default};
