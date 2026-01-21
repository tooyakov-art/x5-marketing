
// Removed 'headlineStroke' causing jagged text. Replaced with shadow config logic in renderer.
export const VARIANT_STYLES = [
  { 
      id: 'neon_punch', 
      badgeBg: '#d9f99d', badgeText: '#000000', 
      headlineColor: '#d9f99d', 
      ctaBg: '#d9f99d', ctaText: '#000000',
      shadow: 'neon' 
  },
  { 
      id: 'urgent_red', 
      badgeBg: '#ef4444', badgeText: '#ffffff', 
      headlineColor: '#ffffff', 
      ctaBg: '#ef4444', ctaText: '#ffffff',
      shadow: 'strong' // White text needs strong shadow
  },
  { 
      id: 'luxury_bw', 
      badgeBg: '#ffffff', badgeText: '#000000', 
      headlineColor: '#ffffff', 
      ctaBg: '#ffffff', ctaText: '#000000',
      shadow: 'soft' 
  },
  { 
      id: 'cyber_blue', 
      badgeBg: '#3b82f6', badgeText: '#ffffff', 
      headlineColor: '#60a5fa', 
      ctaBg: '#3b82f6', ctaText: '#ffffff',
      shadow: 'neon_blue' 
  },
  { 
      id: 'toxic_yellow', 
      badgeBg: '#facc15', badgeText: '#000000', 
      headlineColor: '#facc15', 
      ctaBg: '#facc15', ctaText: '#000000',
      shadow: 'hard_black' 
  },
  {
      id: 'clean_white',
      badgeBg: 'rgba(255,255,255,0.2)', badgeText: '#ffffff',
      headlineColor: '#ffffff',
      ctaBg: '#ffffff', ctaText: '#000000',
      shadow: 'soft'
  }
];
