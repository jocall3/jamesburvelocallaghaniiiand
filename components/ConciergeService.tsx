

import React, { useState, useEffect, useCallback } from 'react';

const ConciergeAnimationStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

// --- CORE TYPES & INTERFACES ---
type Category = 'JETS' | 'YACHTS' | 'RESIDENCES' | 'EXPERIENCES' | 'DINING' | 'SECURITY' | 'ART' | 'AUTOMOBILES' | 'AVIATION' | 'WELLNESS' | 'PHILANTHROPY' | 'TECHNOLOGY' | 'FASHION' | 'COLLECTIBLES' | 'STAFFING' | 'EDUCATION' | 'LEGAL' | 'FINANCE' | 'REAL_ESTATE' | 'TRAVEL' | 'EVENTS' | 'ENTERTAINMENT' | 'SPORTS' | 'HEALTH' | 'GOVERNANCE' | 'RESEARCH' | 'SPACE' | 'MARINE' | 'LAND' | 'AIR' | 'VIRTUAL' | 'CYBERNETICS' | 'ROBOTICS' | 'BIOTECH' | 'NANOTECH' | 'ENERGY' | 'MATERIALS' | 'LOGISTICS' | 'COMMUNICATIONS' | 'MEDIA' | 'ADVISORY' | 'CONSULTING' | 'INSURANCE' | 'INVESTMENTS' | 'VENTURE_CAPITAL' | 'PRIVATE_EQUITY' | 'HEDGE_FUNDS' | 'FAMILY_OFFICE' | 'CONCIERGE_MEDICINE' | 'LONGEVITY' | 'GENOMICS' | 'NEUROSCIENCE' | 'QUANTUM_COMPUTING' | 'AI_SERVICES' | 'DATA_ANALYSIS' | 'BESPOKE_SOFTWARE' | 'HARDWARE_DESIGN' | 'ARCHITECTURAL_DESIGN' | 'INTERIOR_DESIGN' | 'LANDSCAPE_DESIGN' | 'URBAN_PLANNING' | 'SUSTAINABILITY' | 'CONSERVATION' | 'EXPLORATION' | 'ADVENTURE' | 'CULINARY_ARTS' | 'VITICULTURE' | 'DISTILLING' | 'PERFUMERY' | 'HOROLOGY' | 'JEWELRY' | 'GEMOLOGY' | 'HAUTE_COUTURE' | 'AUTOMOTIVE_DESIGN' | 'RACING' | 'EQUESTRIAN' | 'POLO' | 'SAILING' | 'AVIATION_ACROBATICS' | 'MOUNTAINEERING' | 'POLAR_EXPEDITIONS' | 'ARCHAEOLOGY' | 'PALEONTOLOGY' | 'ASTRONOMY' | 'ASTROPHYSICS' | 'OCEANOGRAPHY' | 'METEOROLOGY' | 'GEOLOGY' | 'CARTOGRAPHY' | 'CRYPTOGRAPHY' | 'LINGUISTICS' | 'PHILOSOPHY' | 'HISTORY' | 'ANTHROPOLOGY' | 'SOCIOLOGY' | 'PSYCHOLOGY' | 'THEOLOGY' | 'MYTHOLOGY' | 'LITERATURE' | 'POETRY' | 'MUSIC_COMPOSITION' | 'SCULPTURE' | 'PAINTING' | 'PHOTOGRAPHY';

interface Asset {
  id: string;
  title: string;
  description: string;
  specs: string[];
  availability: string;
  image: string; // Using colored placeholders for self-containment
  demandIndex: number; // For HFT simulation
  // --- 100 NEW FEATURES ---
  feature_1: string | number | boolean;
  feature_2: string | number | boolean;
  feature_3: string | number | boolean;
  feature_4: string | number | boolean;
  feature_5: string | number | boolean;
  feature_6: string | number | boolean;
  feature_7: string | number | boolean;
  feature_8: string | number | boolean;
  feature_9: string | number | boolean;
  feature_10: string | number | boolean;
  feature_11: string | number | boolean;
  feature_12: string | number | boolean;
  feature_13: string | number | boolean;
  feature_14: string | number | boolean;
  feature_15: string | number | boolean;
  feature_16: string | number | boolean;
  feature_17: string | number | boolean;
  feature_18: string | number | boolean;
  feature_19: string | number | boolean;
  feature_20: string | number | boolean;
  feature_21: string | number | boolean;
  feature_22: string | number | boolean;
  feature_23: string | number | boolean;
  feature_24: string | number | boolean;
  feature_25: string | number | boolean;
  feature_26: string | number | boolean;
  feature_27: string | number | boolean;
  feature_28: string | number | boolean;
  feature_29: string | number | boolean;
  feature_30: string | number | boolean;
  feature_31: string | number | boolean;
  feature_32: string | number | boolean;
  feature_33: string | number | boolean;
  feature_34: string | number | boolean;
  feature_35: string | number | boolean;
  feature_36: string | number | boolean;
  feature_37: string | number | boolean;
  feature_38: string | number | boolean;
  feature_39: string | number | boolean;
  feature_40: string | number | boolean;
  feature_41: string | number | boolean;
  feature_42: string | number | boolean;
  feature_43: string | number | boolean;
  feature_44: string | number | boolean;
  feature_45: string | number | boolean;
  feature_46: string | number | boolean;
  feature_47: string | number | boolean;
  feature_48: string | number | boolean;
  feature_49: string | number | boolean;
  feature_50: string | number | boolean;
  feature_51: string | number | boolean;
  feature_52: string | number | boolean;
  feature_53: string | number | boolean;
  feature_54: string | number | boolean;
  feature_55: string | number | boolean;
  feature_56: string | number | boolean;
  feature_57: string | number | boolean;
  feature_58: string | number | boolean;
  feature_59: string | number | boolean;
  feature_60: string | number | boolean;
  feature_61: string | number | boolean;
  feature_62: string | number | boolean;
  feature_63: string | number | boolean;
  feature_64: string | number | boolean;
  feature_65: string | number | boolean;
  feature_66: string | number | boolean;
  feature_67: string | number | boolean;
  feature_68: string | number | boolean;
  feature_69: string | number | boolean;
  feature_70: string | number | boolean;
  feature_71: string | number | boolean;
  feature_72: string | number | boolean;
  feature_73: string | number | boolean;
  feature_74: string | number | boolean;
  feature_75: string | number | boolean;
  feature_76: string | number | boolean;
  feature_77: string | number | boolean;
  feature_78: string | number | boolean;
  feature_79: string | number | boolean;
  feature_80: string | number | boolean;
  feature_81: string | number | boolean;
  feature_82: string | number | boolean;
  feature_83: string | number | boolean;
  feature_84: string | number | boolean;
  feature_85: string | number | boolean;
  feature_86: string | number | boolean;
  feature_87: string | number | boolean;
  feature_88: string | number | boolean;
  feature_89: string | number | boolean;
  feature_90: string | number | boolean;
  feature_91: string | number | boolean;
  feature_92: string | number | boolean;
  feature_93: string | number | boolean;
  feature_94: string | number | boolean;
  feature_95: string | number | boolean;
  feature_96: string | number | boolean;
  feature_97: string | number | boolean;
  feature_98: string | number | boolean;
  feature_99: string | number | boolean;
  feature_100: string | number | boolean;
}

interface BookingState {
  isBooking: boolean;
  asset: Asset | null;
  step: 'details' | 'comms' | 'auth' | 'confirmed';
  itinerary: {
    pax: string;
    timeline: string;
    requests: string;
  };
}

// --- MOCK DATA ENGINE (EXPANDED & FUTURISTIC) ---

const NEW_FEATURES_DATA = Array.from({ length: 100 }, (_, i) => i + 1).reduce((acc, i) => {
  const key = `feature_${i}` as keyof Asset;
  let value: string | number | boolean;
  const type = i % 3;
  if (type === 0) {
    value = `Generated String Value ${i}`;
  } else if (type === 1) {
    value = i * 3.14;
  } else {
    value = i % 2 === 0;
  }
  acc[key] = value;
  return acc;
}, {} as any);

const createPlaceholderAsset = (id: string, title: string, description: string, image: string, demandIndex: number): Asset => ({
  id,
  title,
  description,
  specs: ['Bespoke', 'On-Demand', 'Fully Managed'],
  availability: 'By Arrangement',
  image,
  demandIndex,
  ...NEW_FEATURES_DATA,
});

const ASSETS: Record<Category, Asset[]> = {
  JETS: [
    {
      id: 'j1',
      title: 'Gulfstream G800 "Celestial"',
      description: 'The flagship of the Balcony fleet. Ultra-long range with four living areas and a private stateroom.',
      specs: ['Range: 8,000 nm', 'Speed: Mach 0.925', 'Capacity: 19 Pax', 'Ka-Band WiFi'],
      availability: 'Immediate',
      image: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      demandIndex: 1.12,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'j2',
      title: 'Bombardier Global 8000 "Apex"',
      description: 'The fastest and longest-range business jet, breaking the sound barrier in tests. A true time machine.',
      specs: ['Range: 8,000 nm', 'Top Speed: Mach 1.015', 'Capacity: 17 Pax', 'Smooth Flĕx Wing'],
      availability: 'In Hangar (London)',
      image: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)',
      demandIndex: 1.25,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'j3',
      title: 'Hermes Hypersonic "Helios"',
      description: 'Sub-orbital point-to-point transport. London to New York in 90 minutes. The ultimate executive edge.',
      specs: ['Range: Global', 'Speed: Mach 5+', 'Capacity: 8 Pax', 'Zero-G Cabin'],
      availability: '24h Pre-Auth',
      image: 'linear-gradient(135deg, #8E0E00 0%, #1F1C18 100%)',
      demandIndex: 3.45,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'j4',
      title: 'Sikorsky S-92 "Sanctuary"',
      description: 'Executive VTOL for seamless city-to-asset transfers. Fully customized interior with soundproofing.',
      specs: ['Range: 539 nm', 'Twin-Turbine', 'Capacity: 10 Pax', 'Medical Suite'],
      availability: 'On Standby',
      image: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
      demandIndex: 0.98,
      ...NEW_FEATURES_DATA,
    }
  ],
  YACHTS: [
    {
      id: 'y1',
      title: 'Lürssen "Leviathan" 150m',
      description: 'A floating private nation with two helipads, a submarine dock, and a full concert hall.',
      specs: ['Length: 150m', 'Crew: 50', 'Guest Cabins: 14', 'Missile Defense System'],
      availability: 'Docked (Monaco)',
      image: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      demandIndex: 1.88,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'y2',
      title: 'Oceanco "Nautilus"',
      description: 'Explorer-class submersible yacht. Capable of 2 weeks fully submerged for ultimate privacy and exploration.',
      specs: ['Length: 115m', 'Max Depth: 200m', 'Guests: 12', 'Oceanographic Lab'],
      availability: 'Pacific Traverse',
      image: 'linear-gradient(135deg, #000046 0%, #1CB5E0 100%)',
      demandIndex: 2.15,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'y3',
      title: 'Sunreef 100 Power Eco "Serenity"',
      description: 'Fully electric luxury catamaran with proprietary solar skin for silent, unlimited-range cruising.',
      specs: ['Solar Skin', 'Zero Emission', 'Guests: 12', 'Hydroponic Garden'],
      availability: 'Immediate (Miami)',
      image: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
      demandIndex: 1.05,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'y4',
      title: 'Wally "Why200" Space Yacht',
      description: 'Radical design maximizing volume and stability. A true villa on the water with a 37 m² master suite.',
      specs: ['Length: 27m', 'Beam: 7.6m', 'Guests: 8', 'Fold-out Terraces'],
      availability: 'Available',
      image: 'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
      demandIndex: 0.92,
      ...NEW_FEATURES_DATA,
    }
  ],
  RESIDENCES: [
    {
      id: 'r1',
      title: 'The Sovereign Private Atoll',
      description: 'A self-sufficient private island in the Maldives with full staff, private runway, and marine biology center.',
      specs: ['7 Villas', 'Full Staff (80)', 'Private Runway', 'Submarine Included'],
      availability: 'Immediate',
      image: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
      demandIndex: 2.50,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'r2',
      title: 'Aman Penthouse, Central Park Tower',
      description: 'The highest residence in the western hemisphere. 360-degree views, private chef, and direct Aman spa access.',
      specs: ['Floor: 130', '5 Bedrooms', 'Private Elevator', '24/7 Butler'],
      availability: 'Available',
      image: 'linear-gradient(135deg, #FDFC47 0%, #24FE41 100%)',
      demandIndex: 1.40,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'r3',
      title: 'Kyoto Imperial Villa "Komorebi"',
      description: 'A historically significant private residence with modern amenities, zen gardens, and a private onsen.',
      specs: ['10 Acres', 'Tea House', 'Michelin Chef', 'Art Collection'],
      availability: 'By Request',
      image: 'linear-gradient(135deg, #D31027 0%, #EA384D 100%)',
      demandIndex: 1.90,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'r4',
      title: 'Orbital Spire "Ascension"',
      description: 'Private residential module on the first commercial space station. Unparalleled views and zero-gravity recreation.',
      specs: ['LEO', '4 Occupants', 'Full Life Support', 'VR Dock'],
      availability: 'Q4 Launch Window',
      image: 'linear-gradient(135deg, #17233c 0%, #27345d 100%)',
      demandIndex: 4.10,
      ...NEW_FEATURES_DATA,
    }
  ],
  EXPERIENCES: [
    {
      id: 'e1',
      title: 'Monaco GP - Paddock & Yacht',
      description: 'VIP access to the Paddock Club combined with a trackside berth on our "Leviathan" yacht.',
      specs: ['Full Hospitality', 'Pit Lane Walk', 'Driver Meet & Greet', 'Yacht Party Access'],
      availability: 'May 23-26',
      image: 'linear-gradient(135deg, #8E0E00 0%, #1F1C18 100%)',
      demandIndex: 1.75,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'e2',
      title: 'Deep Dive: Mariana Trench',
      description: 'A piloted descent to the deepest point on Earth in a Triton 36000/2 submersible. A true unique perspective.',
      specs: ['7-Day Expedition', 'Scientific Crew', 'HD Video Log', 'Personalized Sub'],
      availability: 'Limited Slots',
      image: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
      demandIndex: 3.20,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'e3',
      title: 'Antarctic Philharmonic',
      description: 'A private concert by the Vienna Philharmonic in a custom-built acoustic ice cavern in Antarctica.',
      specs: ['Private Charter Flight', 'Luxury Base Camp', 'Climate Gear Provided', 'Post-Concert Gala'],
      availability: 'December',
      image: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
      demandIndex: 2.80,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'e4',
      title: 'Curated Reality Simulation',
      description: 'Bespoke, fully immersive sensory experience. Live any life, any time, any place. Powered by Quantum AI.',
      specs: ['Neural Interface', 'Haptic Suit', 'Custom Scenarios', '48-Hour Max Duration'],
      availability: 'Beta Access',
      image: 'linear-gradient(135deg, #ff00cc, #333399 100%)',
      demandIndex: 4.50,
      ...NEW_FEATURES_DATA,
    }
  ],
  DINING: [
    {
      id: 'd1',
      title: 'Noma, Copenhagen - Full Buyout',
      description: 'Exclusive access to the world\'s most influential restaurant for a private evening curated by René Redzepi.',
      specs: ['20 Guests Max', 'Custom Menu', 'Wine Pairing', 'Kitchen Tour'],
      availability: 'By Arrangement',
      image: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
      demandIndex: 1.60,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'd2',
      title: 'Chef\'s Table at Sukiyabashi Jiro',
      description: 'A guaranteed reservation at the 10-seat counter of the world\'s most famous sushi master.',
      specs: ['Omakase Menu', 'Sake Pairing', 'Private Translator', '2 Guests'],
      availability: '3-Month Lead',
      image: 'linear-gradient(135deg, #3a6186 0%, #89253e 100%)',
      demandIndex: 2.90,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'd3',
      title: 'Dom Pérignon Vertical Tasting',
      description: 'A private tasting of every vintage of Dom Pérignon ever produced, hosted by the Chef de Cave in Épernay.',
      specs: ['Rare Vintages', 'Cellar Access', 'Gourmet Dinner', 'Overnight at Château'],
      availability: 'Twice Yearly',
      image: 'linear-gradient(135deg, #eacda3 0%, #d6ae7b 100%)',
      demandIndex: 2.10,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 'd4',
      title: 'Zero-G Culinary Lab',
      description: 'A parabolic flight experience where a Michelin-starred chef prepares a meal in zero gravity.',
      specs: ['15 Parabolas', 'Custom Menu', 'Flight Suit', 'Post-Flight Celebration'],
      availability: 'Quarterly',
      image: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      demandIndex: 3.80,
      ...NEW_FEATURES_DATA,
    }
  ],
  SECURITY: [
    {
      id: 's1',
      title: 'Executive Protection Detail (Tier 1)',
      description: 'A 4-person team of former special forces operators for low-profile, high-capability personal security.',
      specs: ['Global Coverage', 'Threat Assessment', 'Secure Comms', 'Medical Trained'],
      availability: 'Immediate',
      image: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
      demandIndex: 1.30,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 's2',
      title: 'Armored Convoy Service',
      description: 'Fleet of discreet, B7-rated armored vehicles with trained security drivers for secure ground transport.',
      specs: ['B7 Armor', 'Counter-Surveillance', 'Convoy Options', 'Route Planning'],
      availability: 'Global Metros',
      image: 'linear-gradient(135deg, #536976 0%, #292E49 100%)',
      demandIndex: 1.10,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 's3',
      title: 'Cybersecurity Fortress',
      description: 'A personal, quantum-encrypted digital ecosystem for all your devices, communications, and data.',
      specs: ['Quantum Encryption', '24/7 SOC', 'Digital Decoy', 'Hardware Provided'],
      availability: '72h Setup',
      image: 'linear-gradient(135deg, #00F260 0%, #0575E6 100%)',
      demandIndex: 2.40,
      ...NEW_FEATURES_DATA,
    },
    {
      id: 's4',
      title: 'Contingency Extraction',
      description: 'Global non-permissive environment extraction service. Guaranteed retrieval from any situation.',
      specs: ['Ex-Intel Assets', 'Global Network', 'Covert Aircraft', 'Full Discretion'],
      availability: 'On Retainer',
      image: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
      demandIndex: 3.95,
      ...NEW_FEATURES_DATA,
    }
  ],
  ART: [createPlaceholderAsset('art1', 'Private Art Curation', 'Acquire or commission masterworks with our expert art advisors.', 'linear-gradient(135deg, #360033, #0b8793)', 2.2)],
  AUTOMOBILES: [createPlaceholderAsset('auto1', 'Hypercar Commission', 'Design and commission a one-off vehicle from a legendary manufacturer.', 'linear-gradient(135deg, #1f1c18, #8e0e00)', 3.1)],
  AVIATION: [createPlaceholderAsset('av1', 'Fighter Jet Experience', 'Pilot a supersonic fighter jet with a veteran instructor.', 'linear-gradient(135deg, #2c3e50, #d3cce3)', 2.8)],
  WELLNESS: [createPlaceholderAsset('well1', 'Longevity Retreat', 'A personalized, data-driven wellness program at a private Swiss clinic.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.5)],
  PHILANTHROPY: [createPlaceholderAsset('phil1', 'Foundation Management', 'Establish and manage a high-impact philanthropic foundation.', 'linear-gradient(135deg, #00467f, #a5cc82)', 1.9)],
  TECHNOLOGY: [createPlaceholderAsset('tech1', 'Personal Tech Lab', 'Build a state-of-the-art research and development lab in your residence.', 'linear-gradient(135deg, #0575e6, #00f260)', 3.5)],
  FASHION: [createPlaceholderAsset('fash1', 'Atelier Privé Access', 'Private access to the haute couture ateliers of Paris during fashion week.', 'linear-gradient(135deg, #ff00cc, #333399)', 2.1)],
  COLLECTIBLES: [createPlaceholderAsset('coll1', 'Rare Horology Acquisition', 'Source the world\'s rarest and most sought-after timepieces.', 'linear-gradient(135deg, #eacda3, #d6ae7b)', 2.9)],
  STAFFING: [createPlaceholderAsset('staff1', 'Elite Household Staffing', 'Recruit and train world-class staff for your residences and assets.', 'linear-gradient(135deg, #536976, #292e49)', 1.5)],
  EDUCATION: [createPlaceholderAsset('edu1', 'Private Tutelage', 'Arrange for private education from Nobel laureates and industry titans.', 'linear-gradient(135deg, #141e30, #243b55)', 2.0)],
  LEGAL: [createPlaceholderAsset('legal1', 'Global Legal Counsel', 'Retain a discreet, globally-connected legal team for any contingency.', 'linear-gradient(135deg, #232526, #414345)', 1.8)],
  FINANCE: [createPlaceholderAsset('fin1', 'Bespoke Financial Instruments', 'Create custom financial products and investment vehicles.', 'linear-gradient(135deg, #1e3c72, #2a5298)', 2.7)],
  REAL_ESTATE: [createPlaceholderAsset('re1', 'Off-Market Portfolio', 'Access a portfolio of the world\'s most exclusive off-market properties.', 'linear-gradient(135deg, #fdfc47, #24fe41)', 2.4)],
  TRAVEL: [createPlaceholderAsset('travel1', 'Round-the-World Itinerary', 'A fully-staffed, year-long journey curated to your exact specifications.', 'linear-gradient(135deg, #00c6ff, #0072ff)', 3.3)],
  EVENTS: [createPlaceholderAsset('event1', 'Private Gala Production', 'Conceptualize and execute world-class private events and celebrations.', 'linear-gradient(135deg, #d31027, #ea384d)', 2.6)],
  ENTERTAINMENT: [createPlaceholderAsset('ent1', 'Private Concert Booking', 'Arrange a private performance from any of the world\'s top artists.', 'linear-gradient(135deg, #606c88, #3f4c6b)', 2.9)],
  SPORTS: [createPlaceholderAsset('sport1', 'Sports Team Acquisition', 'Facilitate the purchase and management of a professional sports franchise.', 'linear-gradient(135deg, #56ab2f, #a8e063)', 3.8)],
  HEALTH: [createPlaceholderAsset('health1', '24/7 Medical Concierge', 'A dedicated team of physicians providing immediate, global medical care.', 'linear-gradient(135deg, #000046, #1cb5e0)', 2.3)],
  GOVERNANCE: [createPlaceholderAsset('gov1', 'Citizenship by Investment', 'Strategic advisory for acquiring secondary citizenships and residencies.', 'linear-gradient(135deg, #3a6186, #89253e)', 3.0)],
  RESEARCH: [createPlaceholderAsset('res1', 'Fund Private Research', 'Sponsor a scientific research project in any field of your choosing.', 'linear-gradient(135deg, #0f2027, #2c5364)', 2.2)],
  SPACE: [createPlaceholderAsset('space1', 'Lunar Mission Patronage', 'Become the primary patron of a private mission to the Moon.', 'linear-gradient(135deg, #17233c, #27345d)', 4.8)],
  MARINE: [createPlaceholderAsset('marine1', 'Submersible Fleet', 'Acquire and staff a fleet of personal submersibles for exploration.', 'linear-gradient(135deg, #000428, #004e92)', 3.1)],
  LAND: [createPlaceholderAsset('land1', 'Private Nature Reserve', 'Purchase and conserve vast tracts of land for ecological preservation.', 'linear-gradient(135deg, #134e5e, #71b280)', 2.7)],
  AIR: [createPlaceholderAsset('air1', 'Airship "Zephyr"', 'A modern, luxury airship for silent, low-altitude global cruising.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 3.4)],
  VIRTUAL: [createPlaceholderAsset('vr1', 'Digital Immortality', 'Create a sentient, AI-powered digital version of yourself.', 'linear-gradient(135deg, #ff00cc, #333399)', 4.9)],
  CYBERNETICS: [createPlaceholderAsset('cyber1', 'Augmentation Suite', 'Access to cutting-edge, bespoke cybernetic enhancements.', 'linear-gradient(135deg, #434343, #000000)', 4.2)],
  ROBOTICS: [createPlaceholderAsset('robo1', 'Custom Android Staff', 'Commission humanoid robotics for specialized household or security tasks.', 'linear-gradient(135deg, #373b44, #4286f4)', 3.9)],
  BIOTECH: [createPlaceholderAsset('bio1', 'Personal Gene Sequencing', 'Full-spectrum genomic sequencing and personalized preventative medicine.', 'linear-gradient(135deg, #00f260, #0575e6)', 3.6)],
  NANOTECH: [createPlaceholderAsset('nano1', 'Utility Fog Access', 'Beta access to programmable nanite swarms for instant creation.', 'linear-gradient(135deg, #232526, #414345)', 4.7)],
  ENERGY: [createPlaceholderAsset('energy1', 'Fusion Reactor Investment', 'Become a primary investor in a private fusion energy startup.', 'linear-gradient(135deg, #fdfc47, #24fe41)', 4.1)],
  MATERIALS: [createPlaceholderAsset('mat1', 'Exotic Material Sourcing', 'Procure and utilize materials not yet available on the open market.', 'linear-gradient(135deg, #536976, #292e49)', 3.2)],
  LOGISTICS: [createPlaceholderAsset('log1', 'Global Logistics Network', 'A private, secure logistics network for moving any asset, anywhere.', 'linear-gradient(135deg, #141e30, #243b55)', 2.5)],
  COMMUNICATIONS: [createPlaceholderAsset('comm1', 'Private Satellite Constellation', 'Launch and control a personal, encrypted satellite communications network.', 'linear-gradient(135deg, #09203f, #537895)', 4.0)],
  MEDIA: [createPlaceholderAsset('media1', 'Acquire Media House', 'Purchase a major newspaper, television network, or film studio.', 'linear-gradient(135deg, #8e0e00, #1f1c18)', 3.7)],
  ADVISORY: [createPlaceholderAsset('adv1', 'Shadow Cabinet', 'Assemble a personal advisory board of global leaders and experts.', 'linear-gradient(135deg, #360033, #0b8793)', 3.0)],
  CONSULTING: [createPlaceholderAsset('consult1', 'Geopolitical Strategy', 'Retain a team of geopolitical analysts for strategic global positioning.', 'linear-gradient(135deg, #2c3e50, #d3cce3)', 2.8)],
  INSURANCE: [createPlaceholderAsset('ins1', 'Impossible Risk Coverage', 'Underwrite insurance policies for risks deemed uninsurable.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.4)],
  INVESTMENTS: [createPlaceholderAsset('inv1', 'Alpha-Tier Deal Flow', 'Access to exclusive, off-market investment opportunities.', 'linear-gradient(135deg, #00467f, #a5cc82)', 2.9)],
  VENTURE_CAPITAL: [createPlaceholderAsset('vc1', 'Curated VC Fund', 'Create and manage a bespoke venture capital fund.', 'linear-gradient(135deg, #0575e6, #00f260)', 3.1)],
  PRIVATE_EQUITY: [createPlaceholderAsset('pe1', 'Targeted LBOs', 'Identify and execute leveraged buyouts of strategic companies.', 'linear-gradient(135deg, #ff00cc, #333399)', 3.3)],
  HEDGE_FUNDS: [createPlaceholderAsset('hf1', 'Quantum Trading Algorithm', 'Develop and deploy a proprietary quantum computing-based trading algorithm.', 'linear-gradient(135deg, #eacda3, #d6ae7b)', 4.3)],
  FAMILY_OFFICE: [createPlaceholderAsset('fo1', 'Multi-Generational Office', 'Establish a comprehensive family office to manage wealth for centuries.', 'linear-gradient(135deg, #536976, #292e49)', 2.6)],
  CONCIERGE_MEDICINE: [createPlaceholderAsset('cm1', 'Mobile Surgical Suite', 'A fully-equipped, mobile surgical unit that can be deployed globally.', 'linear-gradient(135deg, #141e30, #243b55)', 3.5)],
  LONGEVITY: [createPlaceholderAsset('long1', 'Age Reversal Therapies', 'Access to experimental and clinically-proven age reversal treatments.', 'linear-gradient(135deg, #232526, #414345)', 4.5)],
  GENOMICS: [createPlaceholderAsset('gen1', 'Bespoke Genome Editing', 'Commission CRISPR-based genomic edits for preventative health.', 'linear-gradient(135deg, #1e3c72, #2a5298)', 4.6)],
  NEUROSCIENCE: [createPlaceholderAsset('neuro1', 'Brain-Computer Interface', 'Early access to next-generation, non-invasive BCI technology.', 'linear-gradient(135deg, #fdfc47, #24fe41)', 4.4)],
  QUANTUM_COMPUTING: [createPlaceholderAsset('qc1', 'Personal Quantum Computer', 'Acquire and house a personal quantum computer for private use.', 'linear-gradient(135deg, #00c6ff, #0072ff)', 4.9)],
  AI_SERVICES: [createPlaceholderAsset('ai1', 'Personal AGI', 'Commission the development of a personalized Artificial General Intelligence.', 'linear-gradient(135deg, #d31027, #ea384d)', 5.0)],
  DATA_ANALYSIS: [createPlaceholderAsset('data1', 'Global Data Oracle', 'A service that can answer any question by analyzing global data streams in real-time.', 'linear-gradient(135deg, #606c88, #3f4c6b)', 4.2)],
  BESPOKE_SOFTWARE: [createPlaceholderAsset('sw1', 'Unbreakable OS', 'Commission a custom, unhackable operating system for all personal devices.', 'linear-gradient(135deg, #56ab2f, #a8e063)', 3.8)],
  HARDWARE_DESIGN: [createPlaceholderAsset('hw1', 'Custom Silicon', 'Design and fabricate custom microchips for specific, high-performance tasks.', 'linear-gradient(135deg, #000046, #1cb5e0)', 4.0)],
  ARCHITECTURAL_DESIGN: [createPlaceholderAsset('arch1', 'Starchitect Commission', 'Commission a Pritzker Prize-winning architect to design a residence.', 'linear-gradient(135deg, #3a6186, #89253e)', 3.2)],
  INTERIOR_DESIGN: [createPlaceholderAsset('int1', 'Living Art Installation', 'Design a home interior that is a dynamic, evolving work of art.', 'linear-gradient(135deg, #0f2027, #2c5364)', 2.7)],
  LANDSCAPE_DESIGN: [createPlaceholderAsset('landsc1', 'Ecosystem Creation', 'Design and create a self-sustaining, bespoke ecosystem on your property.', 'linear-gradient(135deg, #134e5e, #71b280)', 3.0)],
  URBAN_PLANNING: [createPlaceholderAsset('urban1', 'Charter City Development', 'Fund and develop a new city based on a specific set of principles.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 4.1)],
  SUSTAINABILITY: [createPlaceholderAsset('sustain1', 'Atmospheric Carbon Capture', 'Deploy a personal, large-scale carbon capture facility.', 'linear-gradient(135deg, #ff00cc, #333399)', 3.6)],
  CONSERVATION: [createPlaceholderAsset('conserve1', 'Species Revival', 'Fund a de-extinction project for an extinct species.', 'linear-gradient(135deg, #434343, #000000)', 4.4)],
  EXPLORATION: [createPlaceholderAsset('explore1', 'First Contact Mission', 'Fund a mission to explore a previously uncharted region of the Earth.', 'linear-gradient(135deg, #373b44, #4286f4)', 3.9)],
  ADVENTURE: [createPlaceholderAsset('adv2', 'Volcano Luge', 'A custom-built luge track down the side of an active volcano.', 'linear-gradient(135deg, #8e0e00, #1f1c18)', 3.7)],
  CULINARY_ARTS: [createPlaceholderAsset('cul1', 'Personal Michelin Chef', 'Retain a 3-star Michelin chef for your personal, exclusive service.', 'linear-gradient(135deg, #00f260, #0575e6)', 2.8)],
  VITICULTURE: [createPlaceholderAsset('viti1', 'Bespoke Grand Cru', 'Create your own vintage with a legendary Bordeaux or Burgundy estate.', 'linear-gradient(135deg, #536976, #292e49)', 2.9)],
  DISTILLING: [createPlaceholderAsset('dist1', '50-Year-Old Scotch Cask', 'Acquire a full cask of exceptionally rare, aged single malt scotch.', 'linear-gradient(135deg, #eacda3, #d6ae7b)', 2.6)],
  PERFUMERY: [createPlaceholderAsset('perf1', 'Signature Scent Creation', 'Work with a master perfumer in Grasse to create a unique personal fragrance.', 'linear-gradient(135deg, #09203f, #537895)', 2.1)],
  HOROLOGY: [createPlaceholderAsset('horo1', 'Grand Complication Watch', 'Commission a unique, grand complication timepiece from a master watchmaker.', 'linear-gradient(135deg, #141e30, #243b55)', 3.4)],
  JEWELRY: [createPlaceholderAsset('jewel1', 'Crown Jewel Acquisition', 'Acquire a historically significant piece of jewelry from a royal collection.', 'linear-gradient(135deg, #360033, #0b8793)', 3.5)],
  GEMOLOGY: [createPlaceholderAsset('gem1', 'Uncut Diamond Sourcing', 'Source a large, flawless rough diamond directly from the mine.', 'linear-gradient(135deg, #2c3e50, #d3cce3)', 3.1)],
  HAUTE_COUTURE: [createPlaceholderAsset('hc1', 'Personal Atelier', 'Establish a private atelier with a renowned fashion designer.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.9)],
  AUTOMOTIVE_DESIGN: [createPlaceholderAsset('ad1', 'Concept Car Realization', 'Purchase and make road-legal a one-off automotive concept car.', 'linear-gradient(135deg, #00467f, #a5cc82)', 3.8)],
  RACING: [createPlaceholderAsset('race1', 'F1 Team Ownership', 'Acquire a controlling stake in a Formula 1 racing team.', 'linear-gradient(135deg, #d31027, #ea384d)', 4.2)],
  EQUESTRIAN: [createPlaceholderAsset('eq1', 'Champion Thoroughbred Stable', 'Build a stable of thoroughbreds to compete in the Triple Crown.', 'linear-gradient(135deg, #0575e6, #00f260)', 3.0)],
  POLO: [createPlaceholderAsset('polo1', 'Private Polo Grounds', 'Construct and maintain a world-class polo club for personal use.', 'linear-gradient(135deg, #ff00cc, #333399)', 2.7)],
  SAILING: [createPlaceholderAsset('sail1', 'America\'s Cup Syndicate', 'Form and fund a syndicate to compete for the America\'s Cup.', 'linear-gradient(135deg, #536976, #292e49)', 3.6)],
  AVIATION_ACROBATICS: [createPlaceholderAsset('aa1', 'Personal Airshow Team', 'Establish and sponsor a professional aerial acrobatics team.', 'linear-gradient(135deg, #eacda3, #d6ae7b)', 2.8)],
  MOUNTAINEERING: [createPlaceholderAsset('mount1', 'First Ascent Sponsorship', 'Sponsor an expedition to be the first to summit an unclimbed peak.', 'linear-gradient(135deg, #141e30, #243b55)', 3.3)],
  POLAR_EXPEDITIONS: [createPlaceholderAsset('polar1', 'North Pole Habitation', 'Construct a permanent, luxury habitat at the geographic North Pole.', 'linear-gradient(135deg, #232526, #414345)', 4.0)],
  ARCHAEOLOGY: [createPlaceholderAsset('archaeo1', 'Fund a Major Dig', 'Privately fund an archaeological excavation of a major historical site.', 'linear-gradient(135deg, #1e3c72, #2a5298)', 3.1)],
  PALEONTOLOGY: [createPlaceholderAsset('paleo1', 'T-Rex Skeleton Acquisition', 'Acquire a complete Tyrannosaurus Rex skeleton for private display.', 'linear-gradient(135deg, #fdfc47, #24fe41)', 3.9)],
  ASTRONOMY: [createPlaceholderAsset('astro1', 'Private Observatory', 'Build a research-grade astronomical observatory in a prime location like Atacama.', 'linear-gradient(135deg, #00c6ff, #0072ff)', 3.7)],
  ASTROPHYSICS: [createPlaceholderAsset('astrop1', 'Exoplanet Discovery Program', 'Fund a program that provides private access to a space telescope for finding exoplanets.', 'linear-gradient(135deg, #606c88, #3f4c6b)', 4.3)],
  OCEANOGRAPHY: [createPlaceholderAsset('ocean1', 'Seafloor Mapping', 'Commission a private vessel to map a previously uncharted area of the ocean floor.', 'linear-gradient(135deg, #56ab2f, #a8e063)', 3.4)],
  METEOROLOGY: [createPlaceholderAsset('meteo1', 'Weather Control (Beta)', 'Access to experimental, localized weather modification technology.', 'linear-gradient(135deg, #000046, #1cb5e0)', 4.5)],
  GEOLOGY: [createPlaceholderAsset('geo1', 'Volcano Monitoring', 'Install a private, advanced monitoring system on an active volcano.', 'linear-gradient(135deg, #3a6186, #89253e)', 3.2)],
  CARTOGRAPHY: [createPlaceholderAsset('carto1', 'Personalized World Atlas', 'Commission a master cartographer to create a hand-drawn atlas of your travels.', 'linear-gradient(135deg, #0f2027, #2c5364)', 2.2)],
  CRYPTOGRAPHY: [createPlaceholderAsset('crypto1', 'Break Unbreakable Codes', 'Commission a team of mathematicians to crack famous unsolved ciphers.', 'linear-gradient(135deg, #134e5e, #71b280)', 3.8)],
  LINGUISTICS: [createPlaceholderAsset('ling1', 'Revive a Dead Language', 'Fund a project to revive and reintroduce a dormant or extinct language.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.5)],
  PHILOSOPHY: [createPlaceholderAsset('philo1', 'Modern Day Salon', 'Host a series of philosophical debates with the world\'s greatest living thinkers.', 'linear-gradient(135deg, #ff00cc, #333399)', 2.3)],
  HISTORY: [createPlaceholderAsset('hist1', 'Historical Document Collection', 'Acquire original, significant historical documents and manuscripts.', 'linear-gradient(135deg, #434343, #000000)', 3.0)],
  ANTHROPOLOGY: [createPlaceholderAsset('anthro1', 'Uncontacted Tribe Study', 'Fund a non-invasive, long-term anthropological study.', 'linear-gradient(135deg, #373b44, #4286f4)', 3.5)],
  SOCIOLOGY: [createPlaceholderAsset('soc1', 'Longitudinal Study', 'Commission a multi-generational study on a sociological topic of your choice.', 'linear-gradient(135deg, #8e0e00, #1f1c18)', 2.9)],
  PSYCHOLOGY: [createPlaceholderAsset('psych1', 'Consciousness Research', 'Fund a leading-edge laboratory dedicated to the study of consciousness.', 'linear-gradient(135deg, #00f260, #0575e6)', 3.6)],
  THEOLOGY: [createPlaceholderAsset('theo1', 'Ancient Texts Access', 'Gain private access to view the world\'s most protected religious texts.', 'linear-gradient(135deg, #536976, #292e49)', 3.1)],
  MYTHOLOGY: [createPlaceholderAsset('myth1', 'Locate Mythical Artifacts', 'Fund expeditions to search for the historical basis of mythological artifacts.', 'linear-gradient(135deg, #eacda3, #d6ae7b)', 3.4)],
  LITERATURE: [createPlaceholderAsset('lit1', 'Patron of Letters', 'Become the sole patron of a promising novelist for their entire career.', 'linear-gradient(135deg, #09203f, #537895)', 2.4)],
  POETRY: [createPlaceholderAsset('poet1', 'Poet Laureate', 'Establish a private, international poet laureate prize.', 'linear-gradient(135deg, #141e30, #243b55)', 2.0)],
  MUSIC_COMPOSITION: [createPlaceholderAsset('music1', 'Symphony Commission', 'Commission a major new work from a world-renowned composer.', 'linear-gradient(135deg, #360033, #0b8793)', 2.6)],
  SCULPTURE: [createPlaceholderAsset('sculpt1', 'Monumental Commission', 'Commission a monumental sculpture for a public or private space.', 'linear-gradient(135deg, #2c3e50, #d3cce3)', 2.8)],
  PAINTING: [createPlaceholderAsset('paint1', 'Old Master Commission', 'Commission a master artist who works in classical techniques to create a personal masterpiece.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.7)],
  PHOTOGRAPHY: [createPlaceholderAsset('photo1', 'Lifetime Archive Acquisition', 'Acquire the complete lifetime archive of a legendary photographer.', 'linear-gradient(135deg, #00467f, #a5cc82)', 2.5)],
};

const ConciergeService: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>('JETS');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [bookingState, setBookingState] = useState<BookingState>({
    isBooking: false,
    asset: null,
    step: 'details',
    itinerary: { pax: '', timeline: '', requests: '' }
  });

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleBook = (asset: Asset) => {
    setBookingState({ ...bookingState, isBooking: true, asset, step: 'details' });
  };

  const handleBookingNext = () => {
    if (bookingState.step === 'details') setBookingState({ ...bookingState, step: 'comms' });
    else if (bookingState.step === 'comms') setBookingState({ ...bookingState, step: 'auth' });
    else if (bookingState.step === 'auth') {
      setTimeout(() => {
        setBookingState({ ...bookingState, step: 'confirmed' });
      }, 2000);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8 font-sans">
      <ConciergeAnimationStyles />
      
      {/* Header */}
      <header className="flex justify-between items-end mb-12 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
            THE SOVEREIGN CONCIERGE
          </h1>
          <p className="text-gray-400 mt-2 text-sm tracking-wide uppercase">
            Exclusive Access for Ultra-High-Net-Worth Individuals
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase">Member Status</div>
          <div className="text-xl font-bold text-yellow-500">Visionary</div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Category Sidebar */}
        <div className="col-span-2 space-y-2 h-[calc(100vh-200px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {(Object.keys(ASSETS) as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setSelectedAsset(null); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold tracking-wider transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {category.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Asset Grid */}
        <div className="col-span-6 grid grid-cols-2 gap-6 auto-rows-min h-[calc(100vh-200px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {ASSETS[selectedCategory].map((asset) => (
            <div
              key={asset.id}
              onClick={() => handleAssetClick(asset)}
              className={`group relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 ${selectedAsset?.id === asset.id ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <div className="h-40 w-full" style={{ background: asset.image }}></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">{asset.title}</h3>
                  <div className="px-2 py-1 rounded bg-gray-900 border border-gray-700 text-[10px] text-gray-400 uppercase">
                    Index: {asset.demandIndex}
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-4">{asset.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    {asset.availability}
                  </span>
                  <span className="text-xs text-gray-500">ID: {asset.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="col-span-4 bg-gray-800/50 rounded-2xl border border-gray-700 p-6 h-[calc(100vh-200px)] flex flex-col relative overflow-hidden backdrop-blur-sm">
          {selectedAsset ? (
            <>
              <div className="absolute top-0 left-0 w-full h-48 z-0 opacity-50" style={{ background: selectedAsset.image }}></div>
              <div className="absolute top-0 left-0 w-full h-48 z-0 bg-gradient-to-b from-transparent to-gray-900"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mt-32 mb-6">
                  <h2 className="text-3xl font-extrabold text-white mb-2">{selectedAsset.title}</h2>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedAsset.description}</p>
                </div>

                <div className="space-y-6 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Specifications</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedAsset.specs.map((spec, i) => (
                        <div key={i} className="bg-gray-900 px-3 py-2 rounded border border-gray-700 text-xs text-gray-300">
                          {spec}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">AI Market Analysis</h4>
                    <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Demand Velocity</span>
                        <span className="text-green-400">High</span>
                      </div>
                      <div className="w-full bg-gray-700 h-1.5 rounded-full mb-4">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(selectedAsset.demandIndex / 5) * 100}%` }}></div>
                      </div>
                      <p className="text-[10px] text-gray-500 italic">
                        "This asset class shows a 14% appreciation vector over the next quarter due to scarcity in the EMEA region."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button 
                    onClick={() => handleBook(selectedAsset)}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Request Allocation
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">?</span>
              </div>
              <p className="text-sm">Select an asset to view intelligence and booking options.</p>
            </div>
          )}
        </div>

      </div>

      {/* Booking Modal */}
      {bookingState.isBooking && bookingState.asset && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-md">
          <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Secure Acquisition Protocol</h3>
              <button 
                onClick={() => setBookingState({ ...bookingState, isBooking: false })}
                className="text-gray-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-8 flex-grow overflow-y-auto">
              <div className="flex items-center mb-8">
                {['details', 'comms', 'auth', 'confirmed'].map((s, i) => (
                  <div key={s} className={`flex-1 h-1 rounded-full mx-1 transition-all duration-500 ${
                    ['details', 'comms', 'auth', 'confirmed'].indexOf(bookingState.step) >= i 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-800'
                  }`}></div>
                ))}
              </div>

              {bookingState.step === 'details' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-lg font-bold text-white">Confirm Requirements for {bookingState.asset.title}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Party Size / Quantity</label>
                      <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 focus:outline-none" placeholder="e.g., 4 Passengers" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Timeline</label>
                      <input type="text" className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 focus:outline-none" placeholder="e.g., Oct 12 - Oct 15" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 uppercase mb-1">Special Requests</label>
                      <textarea className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white h-24 focus:border-yellow-500 focus:outline-none" placeholder="Security detail, dietary restrictions, etc."></textarea>
                    </div>
                  </div>
                </div>
              )}

              {bookingState.step === 'comms' && (
                <div className="space-y-6 animate-fade-in">
                  <h4 className="text-lg font-bold text-white">Secure Channel Establishment</h4>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-sm text-gray-300">Connecting to dedicated concierge via Signal Protocol...</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                      <input type="checkbox" defaultChecked className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-0" />
                      <span className="text-sm text-gray-400">Encrypt Metadata</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
                      <input type="checkbox" defaultChecked className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-0" />
                      <span className="text-sm text-gray-400">Enable Kill Switch</span>
                    </div>
                  </div>
                </div>
              )}

              {bookingState.step === 'auth' && (
                <div className="space-y-6 animate-fade-in text-center py-8">
                  <div className="w-24 h-24 mx-auto border-4 border-gray-700 border-t-yellow-500 rounded-full animate-spin"></div>
                  <h4 className="text-lg font-bold text-white mt-6">Verifying Proof of Funds</h4>
                  <p className="text-sm text-gray-500">Interfacing with Sovereign Wallet via ZK-Proof...</p>
                </div>
              )}

              {bookingState.step === 'confirmed' && (
                <div className="space-y-6 animate-fade-in text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center text-black text-3xl font-bold shadow-[0_0_30px_rgba(34,197,94,0.6)]">
                    ✓
                  </div>
                  <h4 className="text-2xl font-bold text-white">Allocation Confirmed</h4>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    Your request has been processed. A detailed itinerary and secure access keys have been deposited in your Vault.
                  </p>
                  <div className="pt-6">
                    <button onClick={() => setBookingState({ ...bookingState, isBooking: false })} className="text-gray-400 hover:text-white text-sm underline">Close</button>
                  </div>
                </div>
              )}

            </div>

            {bookingState.step !== 'confirmed' && bookingState.step !== 'auth' && (
              <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end">
                <button 
                  onClick={handleBookingNext}
                  className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Next Step &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ConciergeService;
