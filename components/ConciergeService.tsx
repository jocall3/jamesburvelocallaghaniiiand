```typescript
import React, { useState, useEffect, useCallback } from 'react';

// --- THE JAMES BURVEL O’CALLAGHAN III CODE: CONCIERGE SERVICE ---
// --- MODULE: A - ANIMATION STYLES ---
const A_ConciergeAnimationStyles: React.FC = () => {
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
          @keyframes pulse_A {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
          }
          @keyframes fadeIn_A {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes gradientShift_A {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
          }
          @keyframes spin_A {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
          @keyframes scaleUp_A {
              from { transform: scale(0.95); }
              to { transform: scale(1); }
          }
          @keyframes shimmer_A {
              100% {
                mask-position: -150% 0, 150% 0, 150% 0;
              }
          }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return null;
};
// --- MODULE: B - CORE TYPES & INTERFACES ---
type B_Category = 'JETS' | 'YACHTS' | 'RESIDENCES' | 'EXPERIENCES' | 'DINING' | 'SECURITY' | 'ART' | 'AUTOMOBILES' | 'AVIATION' | 'WELLNESS' | 'PHILANTHROPY' | 'TECHNOLOGY' | 'FASHION' | 'COLLECTIBLES' | 'STAFFING' | 'EDUCATION' | 'LEGAL' | 'FINANCE' | 'REAL_ESTATE' | 'TRAVEL' | 'EVENTS' | 'ENTERTAINMENT' | 'SPORTS' | 'HEALTH' | 'GOVERNANCE' | 'RESEARCH' | 'SPACE' | 'MARINE' | 'LAND' | 'AIR' | 'VIRTUAL' | 'CYBERNETICS' | 'ROBOTICS' | 'BIOTECH' | 'NANOTECH' | 'ENERGY' | 'MATERIALS' | 'LOGISTICS' | 'COMMUNICATIONS' | 'MEDIA' | 'ADVISORY' | 'CONSULTING' | 'INSURANCE' | 'INVESTMENTS' | 'VENTURE_CAPITAL' | 'PRIVATE_EQUITY' | 'HEDGE_FUNDS' | 'FAMILY_OFFICE' | 'CONCIERGE_MEDICINE' | 'LONGEVITY' | 'GENOMICS' | 'NEUROSCIENCE' | 'QUANTUM_COMPUTING' | 'AI_SERVICES' | 'DATA_ANALYSIS' | 'BESPOKE_SOFTWARE' | 'HARDWARE_DESIGN' | 'ARCHITECTURAL_DESIGN' | 'INTERIOR_DESIGN' | 'LANDSCAPE_DESIGN' | 'URBAN_PLANNING' | 'SUSTAINABILITY' | 'CONSERVATION' | 'EXPLORATION' | 'ADVENTURE' | 'CULINARY_ARTS' | 'VITICULTURE' | 'DISTILLING' | 'PERFUMERY' | 'HOROLOGY' | 'JEWELRY' | 'GEMOLOGY' | 'HAUTE_COUTURE' | 'AUTOMOTIVE_DESIGN' | 'RACING' | 'EQUESTRIAN' | 'POLO' | 'SAILING' | 'AVIATION_ACROBATICS' | 'MOUNTAINEERING' | 'POLAR_EXPEDITIONS' | 'ARCHAEOLOGY' | 'PALEONTOLOGY' | 'ASTRONOMY' | 'ASTROPHYSICS' | 'OCEANOGRAPHY' | 'METEOROLOGY' | 'GEOLOGY' | 'CARTOGRAPHY' | 'CRYPTOGRAPHY' | 'LINGUISTICS' | 'PHILOSOPHY' | 'HISTORY' | 'ANTHROPOLOGY' | 'SOCIOLOGY' | 'PSYCHOLOGY' | 'THEOLOGY' | 'MYTHOLOGY' | 'LITERATURE' | 'POETRY' | 'MUSIC_COMPOSITION' | 'SCULPTURE' | 'PAINTING' | 'PHOTOGRAPHY';
interface B_Asset {
    id: string;
    title: string;
    description: string;
    specs: string[];
    availability: string;
    image: string;
    demandIndex: number;
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
interface B_BookingState {
    isBooking: boolean;
    asset: B_Asset | null;
    step: 'details' | 'comms' | 'auth' | 'confirmed';
    itinerary: {
        pax: string;
        timeline: string;
        requests: string;
    };
}
// --- MODULE: C - MOCK DATA ENGINE (EXPANDED & FUTURISTIC) ---
const C_NEW_FEATURES_DATA = Array.from({ length: 100 }, (_, i) => i + 1).reduce((acc, i) => {
    const key = `feature_${i}` as keyof B_Asset;
    let value: string | number | boolean;
    const type = i % 3;
    if (type === 0) {
        value = `Generated String Value ${i} - The James Burvel O’Callaghan III Code`;
    } else if (type === 1) {
        value = i * 3.14159;
    } else {
        value = i % 2 === 0;
    }
    acc[key] = value;
    return acc;
}, {} as any);
const C_createPlaceholderAsset = (id: string, title: string, description: string, image: string, demandIndex: number): B_Asset => ({
    id,
    title,
    description,
    specs: ['Bespoke', 'On-Demand', 'Fully Managed', 'The James Burvel O’Callaghan III Code'],
    availability: 'By Arrangement',
    image,
    demandIndex,
    ...C_NEW_FEATURES_DATA,
});
const C_ASSETS: Record<B_Category, B_Asset[]> = {
    JETS: [
        {
            id: 'j1',
            title: 'Gulfstream G800 "Celestial" - The James Burvel O’Callaghan III Code',
            description: 'The flagship of the Balcony fleet. Ultra-long range with four living areas and a private stateroom. Includes advanced AI concierge. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Range: 8,000 nm', 'Speed: Mach 0.925', 'Capacity: 19 Pax', 'Ka-Band WiFi', 'AI Concierge'],
            availability: 'Immediate - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            demandIndex: 1.12,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'j2',
            title: 'Bombardier Global 8000 "Apex" - The James Burvel O’Callaghan III Code',
            description: 'The fastest and longest-range business jet, breaking the sound barrier in tests. A true time machine. Includes augmented reality navigation and holographic displays. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Range: 8,000 nm', 'Top Speed: Mach 1.015', 'Capacity: 17 Pax', 'Smooth Flex Wing', 'AR Navigation'],
            availability: 'In Hangar (London) - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)',
            demandIndex: 1.25,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'j3',
            title: 'Hermes Hypersonic "Helios" - The James Burvel O’Callaghan III Code',
            description: 'Sub-orbital point-to-point transport. London to New York in 90 minutes. The ultimate executive edge. Features a private zero-g cabin. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Range: Global', 'Speed: Mach 5+', 'Capacity: 8 Pax', 'Zero-G Cabin', 'Quantum Entanglement Comms'],
            availability: '24h Pre-Auth - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #8E0E00 0%, #1F1C18 100%)',
            demandIndex: 3.45,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'j4',
            title: 'Sikorsky S-92 "Sanctuary" - The James Burvel O’Callaghan III Code',
            description: 'Executive VTOL for seamless city-to-asset transfers. Fully customized interior with soundproofing.  Includes a secure medical suite and advanced threat-detection systems. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Range: 539 nm', 'Twin-Turbine', 'Capacity: 10 Pax', 'Medical Suite', 'Threat Detection'],
            availability: 'On Standby - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)',
            demandIndex: 0.98,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    YACHTS: [
        {
            id: 'y1',
            title: 'Lürssen "Leviathan" 150m - The James Burvel O’Callaghan III Code',
            description: 'A floating private nation with two helipads, a submarine dock, and a full concert hall. Features integrated AI for navigation and guest services. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Length: 150m', 'Crew: 50', 'Guest Cabins: 14', 'Missile Defense System', 'AI Navigation'],
            availability: 'Docked (Monaco) - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
            demandIndex: 1.88,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'y2',
            title: 'Oceanco "Nautilus" - The James Burvel O’Callaghan III Code',
            description: 'Explorer-class submersible yacht. Capable of 2 weeks fully submerged for ultimate privacy and exploration. Features an oceanographic lab and advanced sonar systems. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Length: 115m', 'Max Depth: 200m', 'Guests: 12', 'Oceanographic Lab', 'Advanced Sonar'],
            availability: 'Pacific Traverse - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #000046 0%, #1CB5E0 100%)',
            demandIndex: 2.15,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'y3',
            title: 'Sunreef 100 Power Eco "Serenity" - The James Burvel O’Callaghan III Code',
            description: 'Fully electric luxury catamaran with proprietary solar skin for silent, unlimited-range cruising. Includes a hydroponic garden and advanced environmental monitoring. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Solar Skin', 'Zero Emission', 'Guests: 12', 'Hydroponic Garden', 'Environmental Monitoring'],
            availability: 'Immediate (Miami) - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)',
            demandIndex: 1.05,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'y4',
            title: 'Wally "Why200" Space Yacht - The James Burvel O’Callaghan III Code',
            description: 'Radical design maximizing volume and stability. A true villa on the water with a 37 mÂ² master suite. Features zero-gravity recreation areas and advanced stabilization systems. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Length: 27m', 'Beam: 7.6m', 'Guests: 8', 'Fold-out Terraces', 'Zero-G Zones'],
            availability: 'Available - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #373B44 0%, #4286f4 100%)',
            demandIndex: 0.92,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    RESIDENCES: [
        {
            id: 'r1',
            title: 'The Sovereign Private Atoll - The James Burvel O’Callaghan III Code',
            description: 'A self-sufficient private island in the Maldives with full staff, private runway, and marine biology center. Includes advanced security systems and bio-dome technology. Part of The James Burvel O’Callaghan III Code.',
            specs: ['7 Villas', 'Full Staff (80)', 'Private Runway', 'Submarine Included', 'Advanced Security'],
            availability: 'Immediate - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            demandIndex: 2.50,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'r2',
            title: 'Aman Penthouse, Central Park Tower - The James Burvel O’Callaghan III Code',
            description: 'The highest residence in the western hemisphere. 360-degree views, private chef, and direct Aman spa access. Features a full smart-home system and secure data network. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Floor: 130', '5 Bedrooms', 'Private Elevator', '24/7 Butler', 'Smart Home'],
            availability: 'Available - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #FDFC47 0%, #24FE41 100%)',
            demandIndex: 1.40,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'r3',
            title: 'Kyoto Imperial Villa "Komorebi" - The James Burvel O’Callaghan III Code',
            description: 'A historically significant private residence with modern amenities, zen gardens, and a private onsen. Includes a high-security perimeter and integrated cultural preservation protocols. Part of The James Burvel O’Callaghan III Code.',
            specs: ['10 Acres', 'Tea House', 'Michelin Chef', 'Art Collection', 'High Security'],
            availability: 'By Request - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #D31027 0%, #EA384D 100%)',
            demandIndex: 1.90,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'r4',
            title: 'Orbital Spire "Ascension" - The James Burvel O’Callaghan III Code',
            description: 'Private residential module on the first commercial space station. Unparalleled views and zero-gravity recreation. Features a private VR dock and advanced life support systems. Part of The James Burvel O’Callaghan III Code.',
            specs: ['LEO', '4 Occupants', 'Full Life Support', 'VR Dock', 'Zero-G Recreation'],
            availability: 'Q4 Launch Window - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #17233c 0%, #27345d 100%)',
            demandIndex: 4.10,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    EXPERIENCES: [
        {
            id: 'e1',
            title: 'Monaco GP - Paddock & Yacht - The James Burvel O’Callaghan III Code',
            description: 'VIP access to the Paddock Club combined with a trackside berth on our "Leviathan" yacht. Includes personalized race analysis and exclusive driver interactions. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Full Hospitality', 'Pit Lane Walk', 'Driver Meet & Greet', 'Yacht Party Access', 'Race Analysis'],
            availability: 'May 23-26 - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #8E0E00 0%, #1F1C18 100%)',
            demandIndex: 1.75,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'e2',
            title: 'Deep Dive: Mariana Trench - The James Burvel O’Callaghan III Code',
            description: 'A piloted descent to the deepest point on Earth in a Triton 36000/2 submersible. A true unique perspective. Features live-streaming capabilities and personalized scientific briefings. Part of The James Burvel O’Callaghan III Code.',
            specs: ['7-Day Expedition', 'Scientific Crew', 'HD Video Log', 'Personalized Sub', 'Live Streaming'],
            availability: 'Limited Slots - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
            demandIndex: 3.20,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'e3',
            title: 'Antarctic Philharmonic - The James Burvel O’Callaghan III Code',
            description: 'A private concert by the Vienna Philharmonic in a custom-built acoustic ice cavern in Antarctica. Includes pre-concert private dinners and after-party events. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Private Charter Flight', 'Luxury Base Camp', 'Climate Gear Provided', 'Post-Concert Gala', 'Pre-Concert Dinner'],
            availability: 'December - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #E0EAFC 0%, #CFDEF3 100%)',
            demandIndex: 2.80,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'e4',
            title: 'Curated Reality Simulation - The James Burvel O’Callaghan III Code',
            description: 'Bespoke, fully immersive sensory experience. Live any life, any time, any place. Powered by Quantum AI. Includes neural interface integration and personalized scenario design. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Neural Interface', 'Haptic Suit', 'Custom Scenarios', '48-Hour Max Duration', 'Quantum AI'],
            availability: 'Beta Access - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #ff00cc, #333399 100%)',
            demandIndex: 4.50,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    DINING: [
        {
            id: 'd1',
            title: 'Noma, Copenhagen - Full Buyout - The James Burvel O’Callaghan III Code',
            description: 'Exclusive access to the world\'s most influential restaurant for a private evening curated by RenÃ© Redzepi. Includes a personalized menu and wine pairings. Part of The James Burvel O’Callaghan III Code.',
            specs: ['20 Guests Max', 'Custom Menu', 'Wine Pairing', 'Kitchen Tour', 'Personalized Service'],
            availability: 'By Arrangement - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
            demandIndex: 1.60,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'd2',
            title: 'Chef\'s Table at Sukiyabashi Jiro - The James Burvel O’Callaghan III Code',
            description: 'A guaranteed reservation at the 10-seat counter of the world\'s most famous sushi master. Features a traditional Omakase menu with sake pairings. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Omakase Menu', 'Sake Pairing', 'Private Translator', '2 Guests', 'Traditional Experience'],
            availability: '3-Month Lead - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #3a6186 0%, #89253e 100%)',
            demandIndex: 2.90,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'd3',
            title: 'Dom PÃ©rignon Vertical Tasting - The James Burvel O’Callaghan III Code',
            description: 'A private tasting of every vintage of Dom PÃ©rignon ever produced, hosted by the Chef de Cave in Ãpernay. Includes access to the cellar and a gourmet dinner. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Rare Vintages', 'Cellar Access', 'Gourmet Dinner', 'Overnight at ChÃ¢teau', 'Expert Guidance'],
            availability: 'Twice Yearly - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #eacda3 0%, #d6ae7b 100%)',
            demandIndex: 2.10,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 'd4',
            title: 'Zero-G Culinary Lab - The James Burvel O’Callaghan III Code',
            description: 'A parabolic flight experience where a Michelin-starred chef prepares a meal in zero gravity. Features a custom menu and flight suit. Part of The James Burvel O’Callaghan III Code.',
            specs: ['15 Parabolas', 'Custom Menu', 'Flight Suit', 'Post-Flight Celebration', 'Zero-G Experience'],
            availability: 'Quarterly - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
            demandIndex: 3.80,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    SECURITY: [
        {
            id: 's1',
            title: 'Executive Protection Detail (Tier 1) - The James Burvel O’Callaghan III Code',
            description: 'A 4-person team of former special forces operators for low-profile, high-capability personal security. Includes threat assessments and secure communications. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Global Coverage', 'Threat Assessment', 'Secure Comms', 'Medical Trained', 'Risk Mitigation'],
            availability: 'Immediate - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
            demandIndex: 1.30,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 's2',
            title: 'Armored Convoy Service - The James Burvel O’Callaghan III Code',
            description: 'Fleet of discreet, B7-rated armored vehicles with trained security drivers for secure ground transport. Features counter-surveillance and route planning. Part of The James Burvel O’Callaghan III Code.',
            specs: ['B7 Armor', 'Counter-Surveillance', 'Convoy Options', 'Route Planning', 'Secure Transport'],
            availability: 'Global Metros - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #536976 0%, #292E49 100%)',
            demandIndex: 1.10,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 's3',
            title: 'Cybersecurity Fortress - The James Burvel O’Callaghan III Code',
            description: 'A personal, quantum-encrypted digital ecosystem for all your devices, communications, and data. Includes a 24/7 SOC and digital decoy systems. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Quantum Encryption', '24/7 SOC', 'Digital Decoy', 'Hardware Provided', 'Data Protection'],
            availability: '72h Setup - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #00F260 0%, #0575E6 100%)',
            demandIndex: 2.40,
            ...C_NEW_FEATURES_DATA,
        },
        {
            id: 's4',
            title: 'Contingency Extraction - The James Burvel O’Callaghan III Code',
            description: 'Global non-permissive environment extraction service. Guaranteed retrieval from any situation. Features ex-Intel assets and covert aircraft. Part of The James Burvel O’Callaghan III Code.',
            specs: ['Ex-Intel Assets', 'Global Network', 'Covert Aircraft', 'Full Discretion', 'Emergency Response'],
            availability: 'On Retainer - The James Burvel O’Callaghan III Code',
            image: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
            demandIndex: 3.95,
            ...C_NEW_FEATURES_DATA,
        }
    ],
    ART: [C_createPlaceholderAsset('art1', 'Private Art Curation - The James Burvel O’Callaghan III Code', 'Acquire or commission masterworks with our expert art advisors. Includes provenance research and secure storage. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #360033, #0b8793)', 2.2)],
    AUTOMOBILES: [C_createPlaceholderAsset('auto1', 'Hypercar Commission - The James Burvel O’Callaghan III Code', 'Design and commission a one-off vehicle from a legendary manufacturer. Includes access to exclusive design studios and test tracks. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #1f1c18, #8e0e00)', 3.1)],
    AVIATION: [C_createPlaceholderAsset('av1', 'Fighter Jet Experience - The James Burvel O’Callaghan III Code', 'Pilot a supersonic fighter jet with a veteran instructor. Includes G-force training and personalized flight plans. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #2c3e50, #d3cce3)', 2.8)],
    WELLNESS: [C_createPlaceholderAsset('well1', 'Longevity Retreat - The James Burvel O’Callaghan III Code', 'A personalized, data-driven wellness program at a private Swiss clinic. Includes genetic analysis and tailored therapies. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #e0eafc, #cfdef3)', 2.5)],
    PHILANTHROPY: [C_createPlaceholderAsset('phil1', 'Foundation Management - The James Burvel O’Callaghan III Code', 'Establish and manage a high-impact philanthropic foundation. Includes legal, financial, and strategic oversight. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #00467f, #a5cc82)', 1.9)],
    TECHNOLOGY: [C_createPlaceholderAsset('tech1', 'Personal Tech Lab - The James Burvel O’Callaghan III Code', 'Build a state-of-the-art research and development lab in your residence. Includes custom hardware and software design. Part of The James Burvel O’Callaghan III Code.', 'linear-gradient(135deg, #0575e6, #00f260)', 3.5)],
    F