const placeholderSvg = `
<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="100%" y="100%" width="80%" height="80%"  fill="#e1e1e1ff" />
<path d="M21 16V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V18M21 16V4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V18M21 16L15.4829 12.3219C15.1843 12.1228 14.8019 12.099 14.4809 12.2595L3 18" stroke="#9a9a9aff" stroke-linejoin="round"/>
<circle cx="8" cy="9" r="2" stroke="#9a9a9aff" stroke-linejoin="round"/>
</svg>
`;

export const placeholderDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg)}`;