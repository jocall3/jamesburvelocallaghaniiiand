```typescript
import React, { useContext, useState } from 'react';
import { View, NavItem } from '../types';
import { NAV_ITEMS } from '../constants';
import { DataContext } from '../context/DataContext';

// The James Burvel O’Callaghan III Code - Citibankdemobusinessinc - Sidebar Component

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const A_CitibankLogo: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20,50 C20,20 80,20 80,50 C80,80 20,80 20,50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        <path d="M20,50 C20,80 80,80 80,50 C80,20 20,20 20,50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
    </svg>
);

const B_SidebarHeader: React.FC<{ setIsOpen: (isOpen: boolean) => void }> = ({ setIsOpen }) => (
    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700/50">
        <div className="flex items-center">
            <A_CitibankLogo className="h-8 w-8 text-cyan-400" />
            <span className="ml-3 text-lg font-bold text-white tracking-tight">Citibankdemobusinessinc</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
);

const C_SidebarNavigationItem: React.FC<{ item: NavItem, isActive: boolean, handleNavClick: (view: View) => void }> = ({ item, isActive, handleNavClick }) => (
    <button
        onClick={() => handleNavClick(item.view)}
        className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
            isActive
                ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-500'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border-l-2 border-transparent'
        }`}
    >
        {item.icon && <item.icon className="w-5 h-5 mr-3"/>}
        <span>{item.title}</span>
    </button>
);


const D_SidebarNavigationGroup: React.FC<{ groupTitle?: string, items: NavItem[], activeView: View, handleNavClick: (view: View) => void }> = ({ groupTitle, items, activeView, handleNavClick }) => (
    <div >
        {groupTitle && <h3 className="px-2 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{groupTitle}</h3>}
        {items.map((subItem, index) => {
            const isActive = activeView === subItem.view;
            return (
                <C_SidebarNavigationItem key={index} item={subItem} isActive={isActive} handleNavClick={handleNavClick} />
            );
        })}
    </div>
);

const E_Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
    const context = useContext(DataContext);
    if (!context) throw new Error("Sidebar must be used within a DataProvider");
    const { activeView, setActiveView } = context;

    const handleNavClick = (view: View) => {
        setActiveView(view);
        setIsOpen(false);
    };

    const F_renderNavigation = () => (
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map((item, index) => (
                <D_SidebarNavigationGroup
                    key={index}
                    groupTitle={item.group}
                    items={item.items}
                    activeView={activeView}
                    handleNavClick={handleNavClick}
                />
            ))}
        </nav>
    );

    const G_renderOverlay = () => (
        <div
            className={`fixed inset-0 bg-black/60 z-30 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsOpen(false)}
        ></div>
    );

    const H_renderSidebar = () => (
        <div className={`flex flex-col w-64 bg-gray-900/50 backdrop-blur-lg border-r border-gray-700/50 fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
            <B_SidebarHeader setIsOpen={setIsOpen} />
            {F_renderNavigation()}
        </div>
    );

    return (
        <>
            {G_renderOverlay()}
            {H_renderSidebar()}
        </>
    );
};

export default E_Sidebar;
```