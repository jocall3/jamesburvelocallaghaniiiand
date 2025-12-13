```typescript
import React, { useState, useEffect, useCallback, useMemo, useRef, Reducer, useReducer } from 'react';
import { GoogleGenAI } from "@google/genai";
import Card from './Card';

// --- The James Burvel O'Callaghan III Code - AI Ad Studio View ---
// A. Constants and Configuration
const A1_POLLING_MESSAGES_VEHICLE = [
    "Initializing Sovereign Quantum Core (SQC)...",
    "Assembling Neural Aesthetic Vectors (NAV)...",
    "Constructing Scene Graph Polyhedra...",
    "Orchestrating Temporal Resonance Algorithms...",
    "Harmonizing Stylistic Chroma Filters...",
    "Optimizing Data Labyrinth Compression (DLC)...",
    "Manifesting Primordial Asset Lattice (PAL)...",
    "Synthesizing Hyper-Dimensional Textures...",
    "Allocating Fractal Rendering Pipelines...",
    "Verifying Causal Integrity Protocols..."
];
const A2_MAX_SCENE_DURATION = 90;
const A3_MIN_SCENE_DURATION = 1;
const A4_MAX_PROJECTS_DISPLAY = 75;
const A5_DEFAULT_API_QUOTA = 25000;
const A6_THUMBNAIL_FALLBACK_URL = "https://via.placeholder.com/320x180?text=Preview+Unavailable";

// B. Type Definitions for The James Burvel O'Callaghan III Code
export type B1_GenerationState = 'idle' | 'generating' | 'polling' | 'done' | 'error';
export type B2_AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9' | '3:2' | '2:3';
export type B3_VideoModel = 'veo-3.1-ultra-hq' | 'imagen-video-4-pro' | 'lumiere-hd-001-enterprise' | 'phoenix-v2-stable';
export type B4_GenerationMode = 'single_prompt' | 'storyboard_sequence' | 'ai_script_to_video';
export type B5_AppTheme = 'dark' | 'light' | 'system';
export type B6_AssetType = 'video' | 'image_sequence' | 'audio_track';
export type B7_MotionControl = 'default' | 'smooth' | 'dynamic' | 'hyperkinetic';
export type B8_FidelityLevel = 'standard' | 'high_res' | '4k_preview' | '8k_experimental';
export type B9_AudioStyle = 'none' | 'cinematic_orchestral' | 'upbeat_synthwave' | 'corporate_minimal' | 'lofi_chillhop' | 'ambient_soundscape';
export type BA_FilterPreset = 'none' | 'vintage_film' | 'cyberpunk_glow' | 'monochrome_noir';

export interface BB_GenerationSettings {
    model: B3_VideoModel;
    aspectRatio: B2_AspectRatio;
    duration: number;
    negativePrompt: string;
    seed: number;
    stylizationStrength: number;
    motionControl: B7_MotionControl;
    fidelityLevel: B8_FidelityLevel;
    audioStyle: B9_AudioStyle;
    filterPreset: BA_FilterPreset;
    cameraMotion: 'static' | 'dolly' | 'pan' | 'tilt' | 'zoom';
    lightingStyle: 'natural' | 'studio' | 'dramatic' | 'abstract';
    subjectMatter: 'product' | 'landscape' | 'portrait' | 'abstract';
}

export interface BC_StoryboardScene {
    id: string;
    prompt: string;
    aiDirectorNotes: string;
    duration: number;
    visualReferenceUrl?: string;
    cameraAngle: 'wide' | 'medium' | 'close_up' | 'extreme_close_up';
    lightingMood: 'bright' | 'dim' | 'eerie' | 'romantic';
    audioCue: string;
}

export interface BD_VideoAsset {
    id: string;
    projectId: string;
    assetType: B6_AssetType;
    url: string;
    thumbnailUrl: string;
    metadataUrl?: string;
    prompt: string;
    creationDate: string;
    lastAccessed: string;
    settings: BB_GenerationSettings;
    generationMode: B4_GenerationMode;
    storyboard?: BC_StoryboardScene[];
    isFavorite: boolean;
    costCredits: number;
    resolution: string;
    frameRate: number;
    fileSize: string;
    encodingFormat: string;
}

export interface BE_AdProject {
    id: string;
    name: string;
    clientName: string;
    creationDate: string;
    lastModified: string;
    assets: BD_VideoAsset[];
    aiSummary: string;
    projectDescription: string;
    targetAudience: string;
    campaignGoal: string;
    budgetAllocation: number;
    performanceMetrics: string;
    feedbackNotes: string[];
}

export interface BF_AppConfig {
    apiKey: string | null;
    theme: B5_AppTheme;
    autoSave: boolean;
    defaultSettings: BB_GenerationSettings;
    aiQuotaRemaining: number;
    showAdvancedSettings: boolean;
    enableNotifications: boolean;
    autoDownloadAssets: boolean;
    useHardwareAcceleration: boolean;
}

// C. Mock Backend API by The James Burvel O'Callaghan III
export class C1_MockBackendAPI {
    private projects: BE_AdProject[] = [];
    private latency: number = 75;
    private readonly STORAGE_KEY = 'jbo3_ai_ad_studio_projects_v3';

    constructor() { this.loadFromLocalStorage(); }

    private async simulateLatency(minMs: number = this.latency): Promise<void> { return new Promise(resolve => setTimeout(resolve, minMs + Math.random() * 50)); }

    private saveToLocalStorage = (): void => { try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.projects)); } catch (error) { console.error("CRITICAL: LocalStorage Persist Failure:", error); } };

    private loadFromLocalStorage = (): void => { try { const storedProjects = localStorage.getItem(this.STORAGE_KEY); if (storedProjects) { this.projects = JSON.parse(storedProjects); } else { this.initializeDefaultData(); } } catch (error) { console.error("CRITICAL: LocalStorage Load Failure. Starting Fresh:", error); this.initializeDefaultData(); } };

    private initializeDefaultData = (): void => {
        const defaultSettings: BB_GenerationSettings = {
            model: 'veo-3.1-ultra-hq', aspectRatio: '16:9', duration: 15, negativePrompt: 'blurry, low quality, watermark, text, artifacts, noise, low frame rate', seed: -1, stylizationStrength: 80, motionControl: 'dynamic', fidelityLevel: 'high_res', audioStyle: 'cinematic_orchestral', filterPreset: 'none', cameraMotion: 'dolly', lightingStyle: 'natural', subjectMatter: 'product'
        };
        const defaultProject: BE_AdProject = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name: 'Winter 2025 Apparel Line', clientName: 'Alpine Outfitters Inc.', creationDate: new Date().toISOString(), lastModified: new Date().toISOString(), assets: [], aiSummary: 'Target Gen Z audience with dynamic winter apparel showcase.', projectDescription: 'High-impact video campaign for winter apparel.', targetAudience: 'Gen Z', campaignGoal: 'Drive online sales', budgetAllocation: 50000, performanceMetrics: 'CTR, Conversion Rate', feedbackNotes: []
        };
        this.projects.push(defaultProject);
        this.saveToLocalStorage();
    };

    public async getProjects(): Promise<BE_AdProject[]> { await this.simulateLatency(); return JSON.parse(JSON.stringify(this.projects)).slice(0, A4_MAX_PROJECTS_DISPLAY); }

    public async getProjectById(id: string): Promise<BE_AdProject | null> { await this.simulateLatency(); const project = this.projects.find(p => p.id === id); return project ? JSON.parse(JSON.stringify(project)) : null; }

    public async createProject(name: string, clientName: string = 'Unassigned Client'): Promise<BE_AdProject> {
        await this.simulateLatency();
        const newProject: BE_AdProject = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, name, clientName, creationDate: new Date().toISOString(), lastModified: new Date().toISOString(), assets: [], aiSummary: `New project "${name}" awaiting director input.`, projectDescription: 'Initial project setup', targetAudience: 'Undefined', campaignGoal: 'Brand awareness', budgetAllocation: 10000, performanceMetrics: 'Impressions', feedbackNotes: []
        };
        this.projects.push(newProject);
        this.saveToLocalStorage();
        return { ...newProject };
    }

    public async renameProject(id: string, newName: string): Promise<BE_AdProject | null> { await this.simulateLatency(); const project = this.projects.find(p => p.id === id); if (project) { project.name = newName; project.lastModified = new Date().toISOString(); this.saveToLocalStorage(); return { ...project }; } return null; }

    public async deleteProject(id: string): Promise<boolean> { await this.simulateLatency(); const initialLength = this.projects.length; this.projects = this.projects.filter(p => p.id !== id); this.saveToLocalStorage(); return this.projects.length < initialLength; }

    public async addAssetToProject(projectId: string, asset: Omit<BD_VideoAsset, 'id' | 'projectId' | 'creationDate' | 'lastAccessed' | 'thumbnailUrl'>): Promise<BD_VideoAsset> {
        await this.simulateLatency(400);
        const project = this.projects.find(p => p.id === projectId);
        if (!project) { throw new Error('Project not found during asset addition'); }
        const now = new Date().toISOString();
        const newAsset: BD_VideoAsset = {
            ...asset, id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, projectId, creationDate: now, lastAccessed: now, thumbnailUrl: A6_THUMBNAIL_FALLBACK_URL
        };
        project.assets.unshift(newAsset);
        project.lastModified = now;
        this.saveToLocalStorage();
        return { ...newAsset };
    }

    public async deleteAsset(projectId: string, assetId: string): Promise<boolean> { await this.simulateLatency(); const project = this.projects.find(p => p.id === projectId); if (project) { const initialLength = project.assets.length; project.assets = project.assets.filter(a => a.id !== assetId); project.lastModified = new Date().toISOString(); this.saveToLocalStorage(); return project.assets.length < initialLength; } return false; }

    public async toggleFavoriteAsset(projectId: string, assetId: string): Promise<BD_VideoAsset | null> { await this.simulateLatency(); const project = this.projects.find(p => p.id === projectId); if (project) { const asset = project.assets.find(a => a.id === assetId); if (asset) { asset.isFavorite = !asset.isFavorite; asset.lastAccessed = new Date().toISOString(); project.lastModified = new Date().toISOString(); this.saveToLocalStorage(); return { ...asset }; } } return null; }

    public async updateAssetAccessTime(projectId: string, assetId: string): Promise<void> { await this.simulateLatency(60); const project = this.projects.find(p => p.id === projectId); if (project) { const asset = project.assets.find(a => a.id === assetId); if (asset) { asset.lastAccessed = new Date().toISOString(); project.lastModified = new Date().toISOString(); this.saveToLocalStorage(); } } }

    public async updateProjectMetadata(projectId: string, updates: Partial<BE_AdProject>): Promise<BE_AdProject | null> {
        await this.simulateLatency(120);
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return null;
        this.projects[projectIndex] = { ...this.projects[projectIndex], ...updates, lastModified: new Date().toISOString() };
        this.saveToLocalStorage();
        return { ...this.projects[projectIndex] };
    }

    public async updateAssetThumbnail(projectId: string, assetId: string, thumbnailUrl: string): Promise<BD_VideoAsset | null> {
        await this.simulateLatency(200);
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return null;
        const assetIndex = project.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) return null;
        project.assets[assetIndex].thumbnailUrl = thumbnailUrl;
        project.lastModified = new Date().toISOString();
        this.saveToLocalStorage();
        return { ...project.assets[assetIndex] };
    }
}

export const C2_mockApi = new C1_MockBackendAPI();

// D. Utility Functions by The James Burvel O'Callaghan III
export const D1_generateUniqueId = (): string => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const D2_formatBytes = (bytes: number, decimals = 2): string => { if (bytes === 0) return '0 Bytes'; const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]; };

export const D3_formatDate = (isoString: string): string => { try { return new Date(isoString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }); } catch { return 'Invalid Timestamp'; } };

export const D4_getAspectRatioClass = (aspectRatio: B2_AspectRatio): string => { switch (aspectRatio) { case '16:9': return 'aspect-[16/9]'; case '9:16': return 'aspect-[9/16]'; case '1:1': return 'aspect-square'; case '4:5': return 'aspect-[4/5]'; case '21:9': return 'aspect-[21/9]'; case '3:2': return 'aspect-[3/2]'; case '2:3': return 'aspect-[2/3]'; default: return 'aspect-video'; } };

export const D5_synthesizeDirectorPrompt = (mode: B4_GenerationMode, singlePrompt: string, scenes: BC_StoryboardScene[]): string => {
    if (mode === 'single_prompt') { return `[SINGLE_SHOT_AD] ${singlePrompt}`; }
    if (mode === 'storyboard_sequence') {
        const scenePrompts = scenes.map((scene, index) => `Scene ${index + 1} (${scene.duration}s): [VISUAL_FOCUS] ${scene.prompt}. [DIRECTOR_NOTES] ${scene.aiDirectorNotes || 'Maintain visual consistency.'}`).join(' ||| ');
        return `[STORYBOARD_AD] Total Scenes: ${scenes.length}. Sequence: ${scenePrompts}`;
    }
    if (mode === 'ai_script_to_video') { return `[SCRIPT_AD] Execute the provided script with cinematic visuals: ${singlePrompt}`; }
    return singlePrompt;
};

// E. Reducer for Complex State Management by The James Burvel O'Callaghan III
type E1_AppState = { projects: BE_AdProject[]; currentProjectId: string | null; isLoading: boolean; error: string | null; config: BF_AppConfig; assetDetailViewId: string | null; };

type E2_AppAction =
    | { type: 'SET_PROJECTS'; payload: BE_AdProject[] }
    | { type: 'SET_CURRENT_PROJECT'; payload: string | null }
    | { type: 'ADD_PROJECT'; payload: BE_AdProject }
    | { type: 'UPDATE_PROJECT'; payload: BE_AdProject }
    | { type: 'REMOVE_PROJECT'; payload: string }
    | { type: 'ADD_ASSET'; payload: { projectId: string; asset: BD_VideoAsset } }
    | { type: 'REMOVE_ASSET'; payload: { projectId: string; assetId: string } }
    | { type: 'UPDATE_ASSET'; payload: { projectId: string; asset: BD_VideoAsset } }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'UPDATE_CONFIG'; payload: Partial<BF_AppConfig> }
    | { type: 'UPDATE_PROJECT_METADATA'; payload: { projectId: string; updates: Partial<BE_AdProject> } }
    | { type: 'SET_ASSET_DETAIL_VIEW'; payload: string | null }
    | { type: 'UPDATE_ASSET_THUMBNAIL'; payload: { projectId: string; assetId: string; thumbnailUrl: string } };

const E3_initialAppState: E1_AppState = {
    projects: [], currentProjectId: null, isLoading: true, error: null, assetDetailViewId: null, config: {
        apiKey: null, theme: 'dark', autoSave: true, aiQuotaRemaining: A5_DEFAULT_API_QUOTA, showAdvancedSettings: false, enableNotifications: true, autoDownloadAssets: false, useHardwareAcceleration: true, defaultSettings: {
            model: 'veo-3.1-ultra-hq', aspectRatio: '16:9', duration: 15, negativePrompt: 'blurry, low quality, watermark, text, artifacts, noise, low frame rate', seed: -1, stylizationStrength: 80, motionControl: 'dynamic', fidelityLevel: 'high_res', audioStyle: 'cinematic_orchestral', filterPreset: 'none', cameraMotion: 'dolly', lightingStyle: 'natural', subjectMatter: 'product'
        }
    }
};

const E4_appReducer: Reducer<E1_AppState, E2_AppAction> = (state, action): E1_AppState => {
    switch (action.type) {
        case 'SET_PROJECTS': const firstProjectId = action.payload.length > 0 ? action.payload[0].id : null; return { ...state, projects: action.payload, currentProjectId: state.currentProjectId && action.payload.some(p => p.id === state.currentProjectId) ? state.currentProjectId : firstProjectId, isLoading: false };
        case 'SET_CURRENT_PROJECT': return { ...state, currentProjectId: action.payload };
        case 'ADD_PROJECT': return { ...state, projects: [...state.projects, action.payload] };
        case 'UPDATE_PROJECT': return { ...state, projects: state.projects.map(p => (p.id === action.payload.id ? action.payload : p)) };
        case 'REMOVE_PROJECT': const remainingProjects = state.projects.filter(p => p.id !== action.payload); const newCurrentProjectId = state.currentProjectId === action.payload ? remainingProjects.length > 0 ? remainingProjects[0].id : null : state.currentProjectId; return { ...state, projects: remainingProjects, currentProjectId: newCurrentProjectId };
        case 'ADD_ASSET': return { ...state, projects: state.projects.map(p => p.id !== action.payload.projectId ? p : { ...p, assets: [action.payload.asset, ...p.assets], lastModified: new Date().toISOString() }) };
        case 'REMOVE_ASSET': return { ...state, projects: state.projects.map(p => p.id !== action.payload.projectId ? p : { ...p, assets: p.assets.filter(a => a.id !== action.payload.assetId), lastModified: new Date().toISOString() }) };
        case 'UPDATE_ASSET': return { ...state, projects: state.projects.map(p => p.id !== action.payload.projectId ? p : { ...p, assets: p.assets.map(a => a.id === action.payload.asset.id ? action.payload.asset : a), lastModified: new Date().toISOString() }) };
        case 'UPDATE_CONFIG': return { ...state, config: { ...state.config, ...action.payload } };
        case 'SET_LOADING': return { ...state, isLoading: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload, isLoading: false };
        case 'UPDATE_PROJECT_METADATA': return { ...state, projects: state.projects.map(p => (p.id === action.payload.projectId ? { ...p, ...action.payload.updates, lastModified: new Date().toISOString() } : p)) };
        case 'SET_ASSET_DETAIL_VIEW': return { ...state, assetDetailViewId: action.payload };
        case 'UPDATE_ASSET_THUMBNAIL': return { ...state, projects: state.projects.map(p => p.id === action.payload.projectId ? { ...p, assets: p.assets.map(a => a.id === action.payload.assetId ? { ...a, thumbnailUrl: action.payload.thumbnailUrl } : a), lastModified: new Date().toISOString() } : p) };
        default: return state;
    }
};

// F. Child Components by The James Burvel O'Callaghan III
export const F1_ProjectSidebar: React.FC<{ projects: BE_AdProject[]; currentProjectId: string | null; onSelectProject: (id: string) => void; onCreateProject: (name: string, client: string) => void; onDeleteProject: (id: string) => void; onRenameProject: (id: string, newName: string) => void; }> = ({ projects, currentProjectId, onSelectProject, onCreateProject, onDeleteProject, onRenameProject }) => {
    const [newProjectName, setF1A_NewProjectName] = useState('');
    const [newClientName, setF1B_NewClientName] = useState('');
    const [renamingId, setF1C_RenamingId] = useState<string | null>(null);
    const [renamingText, setF1D_RenamingText] = useState('');
    const F1E_handleCreateProject = () => { if (newProjectName.trim()) { onCreateProject(newProjectName.trim(), newClientName.trim() || 'Unassigned Client'); setF1A_NewProjectName(''); setF1B_NewClientName(''); } };
    const F1F_handleRename = (id: string) => { if (renamingText.trim() && renamingId) { onRenameProject(id, renamingText.trim()); } setF1C_RenamingId(null); setF1D_RenamingText(''); };
    return (
        <div className="bg-gray-900 border-r border-gray-700 w-72 p-4 flex flex-col h-full shadow-2xl">
            <h3 className="text-2xl font-extrabold text-cyan-400 mb-4 border-b border-gray-700 pb-2">Project Nexus</h3>
            <div className="mb-4 p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">New Initiative</h4>
                <input type="text" value={newProjectName} onChange={(e) => setF1A_NewProjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && F1E_handleCreateProject()} placeholder="Project Name (e.g., Q2 Campaign)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white mb-2 focus:ring-cyan-500" />
                <input type="text" value={newClientName} onChange={(e) => setF1B_NewClientName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && F1E_handleCreateProject()} placeholder="Client Name (Optional)" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm text-white mb-2 focus:ring-cyan-500" />
                <button onClick={F1E_handleCreateProject} disabled={!newProjectName.trim()} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white p-2 rounded-md text-sm font-medium disabled:opacity-30">Initiate Project</button>
            </div>
            <h4 className="text-md font-semibold text-gray-300 mb-2 uppercase tracking-wider">Active Projects ({projects.length})</h4>
            <ul className="space-y-1 overflow-y-auto flex-grow custom-scrollbar">
                {projects.map(project => (
                    <li key={project.id}>
                        <div className={`group flex flex-col p-2 rounded-lg cursor-pointer transition-colors ${currentProjectId === project.id ? 'bg-cyan-700/50 text-white shadow-lg border border-cyan-500' : 'text-gray-300 hover:bg-gray-800/50 border border-transparent'}`} onClick={() => onSelectProject(project.id)}>
                            <div className="flex items-center justify-between w-full">
                                {renamingId === project.id ? (
                                    <input type="text" value={renamingText} onChange={(e) => setF1D_RenamingText(e.target.value)} onBlur={() => F1F_handleRename(project.id)} onKeyPress={(e) => e.key === 'Enter' && F1F_handleRename(project.id)} className="bg-gray-600 text-white w-full text-sm p-1 rounded focus:outline-none" autoFocus />
                                ) : (
                                    <span className="truncate font-medium text-sm">{project.name}</span>
                                )}
                                <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button title="Rename" onClick={(e) => { e.stopPropagation(); setF1C_RenamingId(project.id); setF1D_RenamingText(project.name); }} className="text-gray-400 hover:text-yellow-400 text-xs p-1">Edit</button>
                                    <button title="Delete" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Confirm deletion of Project: "${project.name}"?`)) onDeleteProject(project.id); }} className="text-gray-400 hover:text-red-500 text-xs p-1">Delete</button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">Client: {project.clientName}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const F2_GenerationControls: React.FC<{ settings: BB_GenerationSettings; onSettingsChange: (newSettings: Partial<BB_GenerationSettings>) => void; isGenerating: boolean; aiQuota: number; showAdvancedSettings: boolean; onToggleAdvancedSettings: () => void; }> = ({ settings, onSettingsChange, isGenerating, aiQuota, showAdvancedSettings, onToggleAdvancedSettings }) => {
    const F2A_handleRangeChange = (key: keyof BB_GenerationSettings, value: string) => { onSettingsChange({ [key]: parseInt(value, 10) }); };
    const F2B_handleSelectChange = (key: keyof BB_GenerationSettings, value: string) => { onSettingsChange({ [key]: value }); };
    const F2C_handleInputChange = (key: keyof BB_GenerationSettings, value: string) => { onSettingsChange({ [key]: value }); };

    return (
        <Card title="AI Generation Matrix Configuration" className="shadow-xl border-cyan-800/50">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">AI Model Core</label>
                    <select value={settings.model} onChange={e => F2B_handleSelectChange('model', e.target.value)} disabled={isGenerating} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm focus:ring-cyan-500">
                        <option value="veo-3.1-ultra-hq">Veo 3.1 (Ultra HQ)</option>
                        <option value="imagen-video-4-pro">Imagen Video 4 (Pro)</option>
                        <option value="lumiere-hd-001-enterprise">Lumiere HD (Enterprise)</option>
                        <option value="phoenix-v2-stable">Phoenix v2 (Stable)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Output Ratio</label>
                    <select value={settings.aspectRatio} onChange={e => F2B_handleSelectChange('aspectRatio', e.target.value)} disabled={isGenerating} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm">
                        <option value="16:9">16:9 (Widescreen)</option>
                        <option value="9:16">9:16 (Vertical/Mobile)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:5">4:5 (Portrait)</option>
                        <option value="21:9">21:9 (Cinematic)</option>
                        <option value="3:2">3:2 (Standard Photo)</option>
                        <option value="2:3">2:3 (Poster)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Duration (s): {settings.duration}</label>
                    <input type="range" min={A3_MIN_SCENE_DURATION} max={60} step="1" value={settings.duration} onChange={e => F2A_handleRangeChange('duration', e.target.value)} disabled={isGenerating} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-500 [&::-moz-range-thumb]:bg-cyan-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Fidelity Level</label>
                    <select value={settings.fidelityLevel} onChange={e => F2B_handleSelectChange('fidelityLevel', e.target.value)} disabled={isGenerating} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm">
                        <option value="standard">Standard (Fast)</option>
                        <option value="high_res">High Resolution</option>
                        <option value="4k_preview">4K Preview (High Cost)</option>
                        <option value="8k_experimental">8K Experimental (Extreme Cost)</option>
                    </select>
                </div>
                <div className="col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Creativity/Adherence: {settings.stylizationStrength}%</label>
                    <input type="range" min="0" max="100" step="1" value={settings.stylizationStrength} onChange={e => F2A_handleRangeChange('stylizationStrength', e.target.value)} disabled={isGenerating} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyan-500 [&::-moz-range-thumb]:bg-cyan-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Motion Profile</label>
                    <select value={settings.motionControl} onChange={e => F2B_handleSelectChange('motionControl', e.target.value)} disabled={isGenerating} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm">
                        <option value="dynamic">Dynamic (Complex)</option>
                        <option value="smooth">Smooth (Subtle)</option>
                        <option value="default">Default</option>
                        <option value="hyperkinetic">Hyperkinetic (Experimental)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-cyan-400 mb-1 uppercase">Audio Track</label>
                    <select value={settings.audioStyle} onChange={e => F2B_handleSelectChange('audioStyle', e.target.value)} disabled={isGenerating} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white text-sm">
                        <option value="none">None (Muted)</option>
                        <option value="cinematic_orchestral">Cinematic Orchestral</option>
                        <option value="upbeat_synthwave">Upbeat Synthwave</option>
                        <option value="corporate_minimal">Corporate Minimal</option>
                        <option value="lofi_chillhop">Lo-Fi Chillhop</option>
                        <option value="ambient_