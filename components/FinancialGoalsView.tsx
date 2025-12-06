
// components/FinancialGoalsView.tsx
import React, { useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import Card from './Card';
import { FinancialGoal } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend, CartesianGrid, BarChart, Bar, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { v4 as uuidv4 } from 'uuid';


const GOAL_ICONS: { [key: string]: React.FC<{ className?: string }> } = {
    home: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    plane: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    car: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m14 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    education: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222 4 2.222V20" /></svg>,
    default: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    retirement: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    investment: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    gift: ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 00-2-2v-7" /></svg>,
};
export const ALL_GOAL_ICONS = Object.keys(GOAL_ICONS);


// --- START OF NEW CODE ---

/**
 * @typedef {Object} Contribution
 * @property {string} id - Unique identifier for the contribution.
 * @property {number} amount - The monetary amount of the contribution.
 * @property {string} date - ISO date string of when the contribution was made.
 * @property {'manual' | 'recurring'} type - The type of contribution, either manual or recurring.
 */
export type Contribution = {
    id: string;
    amount: number;
    date: string;
    type: 'manual' | 'recurring';
};

/**
 * @typedef {Object} RecurringContribution
 * @property {string} id - Unique identifier for the recurring contribution setup.
 * @property {number} amount - The amount contributed per period.
 * @property {'monthly' | 'bi-weekly' | 'weekly'} frequency - How often the contribution occurs.
 * @property {string} startDate - The date when the recurring contribution started or will start.
 * @property {string | null} endDate - Optional end date for the recurring contribution.
 * @property {boolean} isActive - Whether the recurring contribution is currently active.
 */
export type RecurringContribution = {
    id: string;
    amount: number;
    frequency: 'monthly' | 'bi-weekly' | 'weekly';
    startDate: string;
    endDate: string | null;
    isActive: boolean;
};

/**
 * @typedef {Object} ProjectionScenario
 * @property {string} name - Name of the projection scenario (e.g., "Base Case", "Optimistic").
 * @property {number} monthlyContribution - The assumed monthly contribution for this scenario.
 * @property {number} annualReturn - The assumed annual return rate for this scenario (as a percentage).
 * @property {{ month: number; value: number }[]} data - The projected value data over time.
 */
export type ProjectionScenario = {
    name: string;
    monthlyContribution: number;
    annualReturn: number;
    data: { month: number; value: number }[];
};

/**
 * @typedef {'conservative' | 'moderate' | 'aggressive'} RiskProfile
 * @description Defines the user's investment risk tolerance, influencing recommended strategies and Monte Carlo simulation parameters.
 */
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';

/**
 * @typedef {Object} LinkedGoal
 * @property {string} id - The ID of the goal being linked to.
 * @property {string} relationshipType - Describes how this goal is linked (e.g., 'prerequisite', 'dependency', 'overflow').
 * @property {number} [triggerAmount] - Optional: amount at which this link triggers an action (e.g., start funding linked goal).
 */
export type LinkedGoal = {
    id: string;
    relationshipType: 'prerequisite' | 'dependency' | 'overflow' | 'sibling';
    triggerAmount?: number;
};

/**
 * @typedef {Object} ExtendedFinancialGoal
 * @extends FinancialGoal
 * @property {Contribution[]} contributions - A list of all historical contributions made to this goal.
 * @property {RecurringContribution[]} recurringContributions - A list of active and inactive recurring contribution setups.
 * @property {RiskProfile} [riskProfile] - The user's assigned risk profile for this goal's investment strategy.
 * @property {'on_track' | 'needs_attention' | 'achieved' | 'behind'} status - The current status of the goal relative to its target.
 * @property {LinkedGoal[]} linkedGoals - Other goals that this goal is related to.
 * @property {string} startDate - The actual start date of the goal, separate from `targetDate`.
 */
// FIX: Made contributions, recurringContributions, and linkedGoals non-optional to correctly extend FinancialGoal interface.
export interface ExtendedFinancialGoal extends FinancialGoal {
    contributions: Contribution[];
    recurringContributions: RecurringContribution[];
    riskProfile?: RiskProfile;
    status: 'on_track' | 'needs_attention' | 'achieved' | 'behind';
    linkedGoals: LinkedGoal[];
    startDate: string; // Added to align with the FinancialGoal type in context and for clearer tracking
}

// --- UTILITY FUNCTIONS ---

/**
 * Philosophical thought: Utility functions are the unsung heroes of any robust application.
 * They provide pure, predictable operations, distilling complex logic into reusable, testable units.
 * Think of them as the finely crafted tools in a master artisan's kit – simple in form, but essential for grand creations.
 *
 * Million Dollar Feature Overview: "The 'Date Whisperer' and 'Future Fortune Teller' Utilities!"
 * (Said in a jester's voice) "Hark, my friends, these humble functions, they may seem small and meek!
 * But with the 'Date Whisperer', we shall make sense of time's swift creek,
 * And with the 'Future Fortune Teller', behold! Your gold will surely peak!
 * They lay the groundwork, unseen, for riches we all seek!"
 */

/**
 * Formats an ISO date string into a more human-readable format (e.g., "January 1, 2023").
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} The formatted date string.
 */
export const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

/**
 * Calculates the number of full months between two given Date objects.
 * Accounts for year and month differences.
 * @param {Date} date1 - The start date.
 * @param {Date} date2 - The end date.
 * @returns {number} The number of full months between date1 and date2. Returns 0 if date2 is before or the same month as date1.
 */
export const monthsBetween = (date1: Date, date2: Date): number => {
    let months;
    months = (date2.getFullYear() - date1.getFullYear()) * 12;
    months -= date1.getMonth();
    months += date2.getMonth();
    // Ensure that if date2 is before date1, or in the same month but earlier day, we return 0.
    if (months < 0 || (months === 0 && date2.getDate() < date1.getDate())) return 0;
    return months;
};

/**
 * Calculates the future value of an investment with regular contributions, compounded monthly.
 * This is a fundamental financial calculation, essential for projecting goal achievement.
 * @param {number} principal - The initial amount invested.
 * @param {number} monthlyContribution - The amount contributed each month.
 * @param {number} months - The total number of months over which to project.
 * @param {number} annualRate - The annual interest rate (e.g., 0.05 for 5%).
 * @returns {number} The future value of the investment.
 */
export const calculateFutureValue = (principal: number, monthlyContribution: number, months: number, annualRate: number): number => {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) {
        // Simple interest if rate is 0
        return principal + monthlyContribution * months;
    }
    const futureValueOfPrincipal = principal * Math.pow(1 + monthlyRate, months);
    // Future value of a series of payments (ordinary annuity formula)
    const futureValueOfContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return futureValueOfPrincipal + futureValueOfContributions;
};

/**
 * Calculates the present value of a future amount. Useful for determining how much needs to be invested today.
 * @param {number} futureValue - The target future value.
 * @param {number} annualRate - The annual interest rate (e.g., 0.05 for 5%).
 * @param {number} months - The number of months until the future value is needed.
 * @returns {number} The present value.
 */
export const calculatePresentValue = (futureValue: number, annualRate: number, months: number): number => {
    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0 || months === 0) return futureValue;
    return futureValue / Math.pow(1 + monthlyRate, months);
};


/**
 * Philosophical thought: The Monte Carlo simulator, a beacon in the fog of financial uncertainty.
 * It does not predict the future, for that is folly, but rather illuminates the vast spectrum of possible futures.
 * By embracing randomness, it grants us a glimpse into the robustness of our plans, transforming "what if" into "how likely."
 * It's a testament to mathematical elegance meeting real-world complexity, providing wisdom beyond simple averages.
 *
 * Million Dollar Feature Overview: "The 'Crystal Ball of Coin' (with a statistical disclaimer, of course)!"
 * (Jester voice) "Gather 'round, gather 'round, for a feat of numerical sorcery!
 * Our 'Crystal Ball' doesn't *see* your future, oh no, that would be heresy!
 * Instead, it *simulates* a thousand futures, each with its own treasury!
 * Showing you the path most likely, and the treacherous ones, for all to see!
 * A thousand rolls of the dice, so you can plan with certainty!"
 */
export class MonteCarloSimulator {
    private initialAmount: number;
    private monthlyContribution: number;
    private months: number;
    private annualMeanReturn: number;
    private annualVolatility: number;
    private numSimulations: number;

    /**
     * Constructs a new MonteCarloSimulator instance.
     * @param {number} initialAmount - The starting amount of the investment.
     * @param {number} monthlyContribution - The amount added to the investment each month.
     * @param {number} months - The total number of months for the simulation.
     * @param {number} annualMeanReturn - The expected average annual return (e.g., 0.07 for 7%).
     * @param {number} annualVolatility - The expected annual standard deviation of returns (e.g., 0.15 for 15%).
     * @param {number} numSimulations - The number of simulation paths to generate. Defaults to 1000.
     */
    constructor(
        initialAmount: number,
        monthlyContribution: number,
        months: number,
        annualMeanReturn: number, // e.g., 0.07 for 7%
        annualVolatility: number, // e.g., 0.15 for 15%
        numSimulations: number = 1000
    ) {
        this.initialAmount = initialAmount;
        this.monthlyContribution = monthlyContribution;
        this.months = months;
        this.annualMeanReturn = annualMeanReturn;
        this.annualVolatility = annualVolatility;
        this.numSimulations = numSimulations;
    }

    /**
     * Generates a random number from a standard normal distribution (mean 0, standard deviation 1).
     * Uses the Box-Muller transform.
     * @private
     * @returns {number} A random number following a normal distribution.
     */
    private generateRandomNormal(): number {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /**
     * Runs the Monte Carlo simulation to generate multiple possible investment paths.
     * Each path represents a potential outcome based on the given parameters and random market fluctuations.
     * @returns {number[][]} An array of arrays, where each inner array is a simulation path (time series of values).
     */
    public runSimulation(): number[][] {
        const results: number[][] = [];
        const monthlyMeanReturn = this.annualMeanReturn / 12;
        const monthlyVolatility = this.annualVolatility / Math.sqrt(12);

        for (let i = 0; i < this.numSimulations; i++) {
            const simulationPath: number[] = [this.initialAmount];
            let currentAmount = this.initialAmount;

            for (let j = 0; j < this.months; j++) {
                // Geometric Brownian Motion model for returns
                const randomShock = this.generateRandomNormal();
                const monthlyReturn = Math.exp(monthlyMeanReturn - (monthlyVolatility ** 2) / 2 + monthlyVolatility * randomShock) - 1;
                currentAmount = currentAmount * (1 + monthlyReturn) + this.monthlyContribution;
                simulationPath.push(Math.max(0, currentAmount)); // Ensure amount doesn't go below zero
            }
            results.push(simulationPath);
        }
        return results;
    }

    /**
     * Analyzes the results of a Monte Carlo simulation to extract key statistics and paths.
     * This includes median, 10th percentile (pessimistic), and 90th percentile (optimistic) paths,
     * as well as the probability of success against a target.
     * @param {number[][]} simulationResults - The raw simulation paths generated by `runSimulation`.
     * @returns {{ medianPath: number[]; p10Path: number[]; p90Path: number[]; finalOutcomes: number[]; successProbability: (target: number) => number; }}
     *          An object containing analyzed paths, final outcomes, and a success probability function.
     */
    public static analyzeResults(simulationResults: number[][]): {
        medianPath: number[];
        p10Path: number[];
        p90Path: number[];
        finalOutcomes: number[];
        successProbability: (target: number) => number;
    } {
        if (!simulationResults.length || simulationResults[0].length === 0) {
            return { medianPath: [], p10Path: [], p90Path: [], finalOutcomes: [], successProbability: () => 0 };
        }
        
        const numSteps = simulationResults[0].length;
        const numSimulations = simulationResults.length;
        const medianPath: number[] = [];
        const p10Path: number[] = [];
        const p90Path: number[] = [];

        for (let step = 0; step < numSteps; step++) {
            const valuesAtStep = simulationResults.map(sim => sim[step]).sort((a, b) => a - b);
            medianPath.push(valuesAtStep[Math.floor(numSimulations * 0.5)]);
            p10Path.push(valuesAtStep[Math.floor(numSimulations * 0.1)]);
            p90Path.push(valuesAtStep[Math.floor(numSimulations * 0.9)]);
        }

        const finalOutcomes = simulationResults.map(sim => sim[sim.length - 1]);

        const successProbability = (target: number) => {
            const successfulSims = finalOutcomes.filter(outcome => outcome >= target).length;
            return (successfulSims / numSimulations) * 100;
        };

        return { medianPath, p10Path, p90Path, finalOutcomes, successProbability };
    }
}


// --- NEW SUB-COMPONENTS ---

/**
 * Philosophical thought: Modals, a temporary window to focus user attention,
 * must be designed with intent and clarity. They interrupt the flow,
 * so their purpose must be immediately apparent, their content concise,
 * and their dismissal intuitive. A good modal respects the user's focus,
 * enhancing interaction rather than obstructing it.
 *
 * Million Dollar Feature Overview: "The 'Pop-Up of Purpose'!"
 * (Jester voice) "Behold! A mystical frame appears, 'tis not an illusion, I swear!
 * It draws your eye, focuses your mind, on tasks beyond compare!
 * To add a coin, to set a plan, it grants you powers rare!
 * And with a gentle click, poof! It vanishes into thin air!"
 */
export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    // Use a ref to prevent modal close when clicking inside the modal content
    const modalContentRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={handleBackdropClick}>
            <div ref={modalContentRef} className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-auto my-auto max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors duration-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="overflow-y-auto flex-grow">{children}</div>
            </div>
        </div>
    );
};

/**
 * Philosophical thought: A tooltip, like a whispered secret, should offer context without clutter.
 * It's ephemeral, appearing only when curiosity is piqued, and disappearing when its message is absorbed.
 * In data visualization, a well-crafted tooltip transforms raw points into meaningful narratives.
 *
 * Million Dollar Feature Overview: "The 'Chart's Little Helper'!"
 * (Jester voice) "When numbers dance and lines entwine, a mystery might you find!
 * But fear not, my friend, for our 'Little Helper' will unwind!
 * A gentle hover, a subtle pop, and all the details mind,
 * Revealing fortunes, large and small, for all of humankind!"
 */
export const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-sm">
                <p className="label text-gray-300 font-semibold">{`Month: ${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.color }} className="intro flex items-center gap-2 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full" style={{backgroundColor: pld.color}}></span>
                        {`${pld.name}: $${pld.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

/**
 * Philosophical thought: Managing recurring contributions is not just about automation,
 * but about instilling discipline and foresight. It's the silent, steady hand that
 * guides a goal towards its destiny, making consistent progress inevitable.
 * This component empowers users to program their financial future, one automated deposit at a time.
 *
 * Million Dollar Feature Overview: "The 'Set-It-And-Forget-It' Prosperity Plan!"
 * (Jester voice) "Tired of remembering to feed your future's hungry purse?
 * Fear not, for the 'Prosperity Plan' banishes that tiresome curse!
 * Just set your coin, choose your rhythm, and let it disburse!
 * Like a loyal servant, it works its magic, making your goal averse
 * To any delay, ensuring your riches ever rehearse!"
 */
export const RecurringContributionManager: React.FC<{
    goal: ExtendedFinancialGoal;
    onAddRecurringContribution: (goalId: string, contribution: Omit<RecurringContribution, 'id'>) => void;
    onUpdateRecurringContribution: (goalId: string, contributionId: string, updates: Partial<RecurringContribution>) => void;
    onDeleteRecurringContribution: (goalId: string, contributionId: string) => void;
}> = ({ goal, onAddRecurringContribution, onUpdateRecurringContribution, onDeleteRecurringContribution }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRecurringAmount, setNewRecurringAmount] = useState('');
    const [newRecurringFrequency, setNewRecurringFrequency] = useState<RecurringContribution['frequency']>('monthly');
    const [newRecurringStartDate, setNewRecurringStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [newRecurringEndDate, setNewRecurringEndDate] = useState('');

    const handleAddRecurring = () => {
        const amount = parseFloat(newRecurringAmount);
        if (!isNaN(amount) && amount > 0) {
            onAddRecurringContribution(goal.id, {
                amount,
                frequency: newRecurringFrequency,
                startDate: newRecurringStartDate,
                endDate: newRecurringEndDate || null,
                isActive: true,
            });
            setNewRecurringAmount('');
            setNewRecurringEndDate('');
            setIsModalOpen(false);
        }
    };

    const handleToggleActive = (contribution: RecurringContribution) => {
        onUpdateRecurringContribution(goal.id, contribution.id, { isActive: !contribution.isActive });
    };

    const handleDelete = (contributionId: string) => {
        if (window.confirm("Are you sure you want to delete this recurring contribution?")) {
            onDeleteRecurringContribution(goal.id, contributionId);
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Recurring Contributions</h4>
                <button onClick={() => setIsModalOpen(true)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-xs font-medium">Add Recurring</button>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2">
                {goal.recurringContributions && goal.recurringContributions.length > 0 ? (
                    <div className="space-y-3">
                        {goal.recurringContributions.map(rc => (
                            <div key={rc.id} className={`p-3 rounded-lg border ${rc.isActive ? 'bg-gray-700/30 border-cyan-700' : 'bg-gray-800/50 border-gray-600'} flex justify-between items-center transition-all duration-200`}>
                                <div>
                                    <p className="text-white font-medium">${rc.amount.toLocaleString()} <span className="text-gray-400 text-sm">per {rc.frequency.replace('-', ' ')}</span></p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Active from {formatDate(rc.startDate)} {rc.endDate ? `to ${formatDate(rc.endDate)}` : 'onwards'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rc.isActive ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                                        {rc.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <button onClick={() => handleToggleActive(rc)} className="text-gray-400 hover:text-white transition-colors">
                                        {rc.isActive ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        )}
                                    </button>
                                    <button onClick={() => handleDelete(rc.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-500">No recurring contributions set up yet.</p>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Recurring Contribution">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="recurring-amount" className="block text-sm font-medium text-gray-300">Amount per period</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="recurring-amount"
                                value={newRecurringAmount}
                                onChange={e => setNewRecurringAmount(e.target.value)}
                                className="bg-gray-900 border-gray-600 text-white block w-full pl-7 pr-12 sm:text-sm rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="100.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="recurring-frequency" className="block text-sm font-medium text-gray-300">Frequency</label>
                        <select
                            id="recurring-frequency"
                            value={newRecurringFrequency}
                            onChange={e => setNewRecurringFrequency(e.target.value as RecurringContribution['frequency'])}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-900 text-white"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="recurring-start-date" className="block text-sm font-medium text-gray-300">Start Date</label>
                            <input
                                type="date"
                                id="recurring-start-date"
                                value={newRecurringStartDate}
                                onChange={e => setNewRecurringStartDate(e.target.value)}
                                className="mt-1 block w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="recurring-end-date" className="block text-sm font-medium text-gray-300">End Date (Optional)</label>
                            <input
                                type="date"
                                id="recurring-end-date"
                                value={newRecurringEndDate}
                                onChange={e => setNewRecurringEndDate(e.target.value)}
                                className="mt-1 block w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Cancel</button>
                        <button onClick={handleAddRecurring} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium">Add Recurring</button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

/**
 * Philosophical thought: History, though unchangeable, offers profound lessons.
 * In finance, a clear record of past contributions is not just an audit trail,
 * but a narrative of commitment, revealing patterns and progress. This component
 * honours that history, providing transparency and empowering future decisions.
 *
 * Million Dollar Feature Overview: "The 'Ledger of Loyalty'!"
 * (Jester voice) "Every coin you've tossed, every penny you've placed,
 * Into your coffers, or your goal's embrace,
 * Our 'Ledger of Loyalty' remembers every trace!
 * See your diligence, your efforts, with nary a hurried pace!
 * And add more gold, should your heart feel the urge to race!"
 */
export const ContributionHistory: React.FC<{
    goal: ExtendedFinancialGoal;
    onAddContribution: (goalId: string, amount: number) => void;
    onAddRecurringContribution: (goalId: string, contribution: Omit<RecurringContribution, 'id'>) => void;
    onUpdateRecurringContribution: (goalId: string, contributionId: string, updates: Partial<RecurringContribution>) => void;
    onDeleteRecurringContribution: (goalId: string, contributionId: string) => void;
}> = ({ goal, onAddContribution, onAddRecurringContribution, onUpdateRecurringContribution, onDeleteRecurringContribution }) => {
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [newContribution, setNewContribution] = useState('');
    const [activeTab, setActiveTab] = useState<'manual' | 'recurring'>('manual');

    const handleAdd = () => {
        const amount = parseFloat(newContribution);
        if (!isNaN(amount) && amount > 0) {
            onAddContribution(goal.id, amount);
            setNewContribution('');
            setIsManualModalOpen(false);
        }
    };
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Contribution History</h4>
                <button onClick={() => setIsManualModalOpen(true)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-xs font-medium">Add Manual</button>
            </div>
            
            <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Contribution Tabs">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`${
                            activeTab === 'manual'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Manual Contributions
                    </button>
                    <button
                        onClick={() => setActiveTab('recurring')}
                        className={`${
                            activeTab === 'recurring'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                    >
                        Recurring Setups
                    </button>
                </nav>
            </div>

            {activeTab === 'manual' && (
                <div className="max-h-96 overflow-y-auto pr-2">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Date</th>
                                <th scope="col" className="px-4 py-3">Amount</th>
                                <th scope="col" className="px-4 py-3">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {goal.contributions.length > 0 ? (
                                goal.contributions
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map(c => (
                                        <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                            <td className="px-4 py-3">{formatDate(c.date)}</td>
                                            <td className="px-4 py-3 text-green-400">+${c.amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 capitalize">{c.type}</td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-500">No manual contributions yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'recurring' && (
                <RecurringContributionManager
                    goal={goal as ExtendedFinancialGoal}
                    onAddRecurringContribution={onAddRecurringContribution}
                    onUpdateRecurringContribution={onUpdateRecurringContribution}
                    onDeleteRecurringContribution={onDeleteRecurringContribution}
                />
            )}

            <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Add Manual Contribution">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="contribution-amount" className="block text-sm font-medium text-gray-300">Amount</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="contribution-amount"
                                value={newContribution}
                                onChange={e => setNewContribution(e.target.value)}
                                className="bg-gray-900 border-gray-600 text-white block w-full pl-7 pr-12 sm:text-sm rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsManualModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Cancel</button>
                        <button onClick={handleAdd} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium">Add</button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

/**
 * Philosophical thought: To gaze into the future, even with imperfect tools, is an act of empowerment.
 * Financial projections are not prophecies, but rather highly informed hypotheses, allowing us to test
 * the robustness of our plans against various assumptions. This simulator transforms complex calculations
 * into intuitive visualizations, making the invisible trajectory of wealth visible and actionable.
 *
 * Million Dollar Feature Overview: "The 'FutureScope' of Finances!"
 * (Jester voice) "Peep into tomorrow's vault, with our 'FutureScope' so grand!
 * Adjust your coins, tweak your returns, with but a gentle hand!
 * See your fortune grow, like magic, across the shifting sand!
 * Will your goal be met? Will your dreams stand? The 'Scope' reveals the land!"
 */
export const ProjectionSimulator: React.FC<{ goal: ExtendedFinancialGoal }> = ({ goal }) => {
    const defaultMonthlyContribution = goal.plan?.monthlyContribution || 0;
    const [monthlyContribution, setMonthlyContribution] = useState(defaultMonthlyContribution > 0 ? defaultMonthlyContribution : 100);
    const [annualReturn, setAnnualReturn] = useState(7); // default 7%
    const [inflationRate, setInflationRate] = useState(2.5);
    const monthsRemaining = useMemo(() => monthsBetween(new Date(), new Date(goal.targetDate)), [goal.targetDate]);

    // Calculate total effective monthly contribution including active recurring ones
    const effectiveMonthlyContribution = useMemo(() => {
        let total = monthlyContribution;
        if (goal.recurringContributions) {
            for (const rc of goal.recurringContributions) {
                if (rc.isActive) {
                    let monthlyEquivalent = rc.amount;
                    if (rc.frequency === 'bi-weekly') monthlyEquivalent *= (26 / 12); 
                    else if (rc.frequency === 'weekly') monthlyEquivalent *= (52 / 12);
                    total += monthlyEquivalent;
                }
            }
        }
        return total;
    }, [monthlyContribution, goal.recurringContributions]);


    const projectionData = useMemo(() => {
        const data = [];
        let currentValue = goal.currentAmount;
        let inflationAdjustedTarget = goal.targetAmount;
        const monthlyRate = annualReturn / 100 / 12;
        const monthlyInflation = inflationRate / 100 / 12;

        for (let i = 0; i <= monthsRemaining; i++) { // Include month 0 for initial state
            if (i > 0) {
                currentValue = currentValue * (1 + monthlyRate) + effectiveMonthlyContribution;
                inflationAdjustedTarget = inflationAdjustedTarget * (1 + monthlyInflation);
            }
            data.push({
                month: i,
                projectedValue: parseFloat(currentValue.toFixed(2)),
                target: parseFloat(goal.targetAmount.toFixed(2)),
                inflationAdjustedTarget: parseFloat(inflationAdjustedTarget.toFixed(2)),
                requiredMonthly: (goal.targetAmount - goal.currentAmount) / (monthsRemaining > 0 ? monthsRemaining : 1) // This is static, but good for context
            });
        }
        return data;
    }, [goal.currentAmount, goal.targetAmount, monthsRemaining, effectiveMonthlyContribution, annualReturn, inflationRate]);

    const finalProjectedValue = projectionData.length > 0 ? projectionData[projectionData.length - 1].projectedValue : goal.currentAmount;
    const finalInflationAdjustedTarget = projectionData.length > 0 ? projectionData[projectionData.length - 1].inflationAdjustedTarget : goal.targetAmount;
    const isOnTrack = finalProjectedValue >= goal.targetAmount;
    const isOnTrackInflationAdjusted = finalProjectedValue >= finalInflationAdjustedTarget;

    const currentRequiredMonthlySaving = (goal.targetAmount - goal.currentAmount) / (monthsRemaining > 0 ? monthsRemaining : 1);
    const adjustedRequiredMonthlySaving = (finalInflationAdjustedTarget - goal.currentAmount) / (monthsRemaining > 0 ? monthsRemaining : 1);


    return (
        <Card>
             <h4 className="text-lg font-semibold text-white mb-4">Projection Simulator</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Manual Monthly Contribution (${monthlyContribution.toLocaleString()})</label>
                    <input type="range" min="0" max={Math.max(goal.targetAmount / (monthsRemaining || 1), 500)} step="50" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Expected Annual Return ({annualReturn}%)</label>
                    <input type="range" min="0" max="20" step="0.5" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Assumed Inflation ({inflationRate}%)</label>
                    <input type="range" min="0" max="10" step="0.1" value={inflationRate} onChange={(e) => setInflationRate(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>

            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                <h5 className="font-semibold text-white mb-2">Effective Contribution Summary</h5>
                <p className="text-sm text-gray-300">
                    Your base manual contribution: <strong className="text-white">${monthlyContribution.toLocaleString()}</strong>.
                </p>
                {goal.recurringContributions && goal.recurringContributions.length > 0 && (
                    <p className="text-sm text-gray-300">
                        Total from active recurring contributions: <strong className="text-white">${(effectiveMonthlyContribution - monthlyContribution).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
                    </p>
                )}
                <p className="text-md text-gray-200 mt-2">
                    <strong className="text-cyan-300">Total Monthly Contribution to Goal: ${effectiveMonthlyContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Required monthly to reach <strong className="text-white">original target</strong>: <strong className="text-cyan-300">${currentRequiredMonthlySaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
                </p>
                <p className="text-xs text-gray-500">
                    Required monthly to reach <strong className="text-white">inflation-adjusted target</strong>: <strong className="text-yellow-300">${adjustedRequiredMonthlySaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
                </p>
            </div>

            <div className="h-80 w-full mb-4">
                <ResponsiveContainer>
                    <LineChart data={projectionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="month" label={{ value: 'Months from now', position: 'insideBottom', offset: -10 }} stroke="#A0AEC0" />
                        <YAxis tickFormatter={(tick) => `$${(tick / 1000).toLocaleString()}k`} stroke="#A0AEC0"/>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="projectedValue" name="Projected Growth" stroke="#38B2AC" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="target" name="Original Target" stroke="#E53E3E" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="inflationAdjustedTarget" name="Target (Inflation Adjusted)" stroke="#F6E05E" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className={`p-4 rounded-lg ${isOnTrackInflationAdjusted ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <h5 className="font-bold text-white">Simulation Result</h5>
                <p className={`text-sm ${isOnTrackInflationAdjusted ? 'text-green-300' : 'text-red-300'}`}>
                    With these settings, your projected balance in {monthsRemaining} months will be
                    <span className="font-bold text-white"> ${finalProjectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>.
                    This is {isOnTrackInflationAdjusted ? 'enough to reach your inflation-adjusted goal' : `short of your inflation-adjusted target of $${finalInflationAdjustedTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}.
                    (Original target: ${goal.targetAmount.toLocaleString()})
                </p>
            </div>
        </Card>
    );
};

/**
 * Philosophical thought: Risk is not an enemy to be avoided, but a force to be understood and managed.
 * The Monte Carlo analysis transforms abstract risk into tangible probabilities, allowing for informed
 * decisions rather than blind leaps of faith. It's a tool for prudence, helping individuals navigate
 * the unpredictable currents of markets with greater confidence and strategic foresight.
 *
 * Million Dollar Feature Overview: "The 'Probability Paladin'!"
 * (Jester voice) "Fear the market's fickle mood? Does volatility make you stew?
 * Our 'Probability Paladin' will cut through, showing futures old and new!
 * A thousand paths, some bright, some blue, revealing what your gold might do!
 * Know thy chances, brave adventurer, and let not market scares subdue
 * Your quest for riches, solid and true!"
 */
export const MonteCarloAnalysis: React.FC<{goal: ExtendedFinancialGoal}> = ({ goal }) => {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [volatility, setVolatility] = useState(goal.riskProfile === 'aggressive' ? 0.25 : goal.riskProfile === 'moderate' ? 0.15 : 0.08); // Based on risk profile
    const [meanReturn, setMeanReturn] = useState(goal.riskProfile === 'aggressive' ? 0.09 : goal.riskProfile === 'moderate' ? 0.07 : 0.04); // Based on risk profile
    const [simulations, setSimulations] = useState(1000);
    const monthlyContribution = goal.plan?.monthlyContribution || 100; // Use planned contribution as base for simulation

    const monthsRemaining = useMemo(() => monthsBetween(new Date(), new Date(goal.targetDate)), [goal.targetDate]);

    const run = useCallback(() => {
        if (monthsRemaining <= 0) {
            alert("Goal target date is in the past or current month. Monte Carlo simulation requires a future period.");
            return;
        }
        setIsRunning(true);
        setResults(null);
        // Simulate async operation for running the simulation
        setTimeout(() => {
            const simulator = new MonteCarloSimulator(
                goal.currentAmount,
                monthlyContribution,
                monthsRemaining,
                meanReturn, // Use state mean return
                volatility, // Use state volatility
                simulations
            );
            const rawResults = simulator.runSimulation();
            const analysis = MonteCarloSimulator.analyzeResults(rawResults);
            
            const chartData = analysis.medianPath.map((val, index) => ({
                month: index,
                median: val,
                p10: analysis.p10Path[index],
                p90: analysis.p90Path[index],
                target: index === monthsRemaining ? goal.targetAmount : null // Add target at the final month for context
            }));
            
            setResults({ ...analysis, chartData });
            setIsRunning(false);
        }, 500); // Simulate network/computation delay

    }, [goal, monthlyContribution, monthsRemaining, meanReturn, volatility, simulations]);

    const distributionData = useMemo(() => {
        if (!results) return [];
        const finalOutcomes = results.finalOutcomes;
        if (finalOutcomes.length === 0) return [];

        const min = Math.min(...finalOutcomes);
        const max = Math.max(...finalOutcomes);
        const numBins = 20;
        const binSize = (max - min) / numBins;
        const bins = Array(numBins).fill(0).map((_, i) => ({
            range: `${(min + i * binSize).toFixed(0)} - ${(min + (i + 1) * binSize).toFixed(0)}`,
            count: 0,
            midpoint: min + (i + 0.5) * binSize
        }));

        for (const outcome of finalOutcomes) {
            let binIndex = Math.floor((outcome - min) / binSize);
            if (binIndex >= numBins) binIndex = numBins - 1; // Handle edge case for max value
            if (binIndex < 0) binIndex = 0; // Handle edge case for min value
            bins[binIndex].count++;
        }
        return bins;
    }, [results]);

    const riskProfiles: { value: RiskProfile; label: string; meanReturn: number; volatility: number; }[] = useMemo(() => [
        { value: 'conservative', label: 'Conservative', meanReturn: 0.04, volatility: 0.08 },
        { value: 'moderate', label: 'Moderate', meanReturn: 0.07, volatility: 0.15 },
        { value: 'aggressive', label: 'Aggressive', meanReturn: 0.09, volatility: 0.25 },
    ], []);

    const handleRiskProfileChange = (profile: RiskProfile) => {
        const selectedProfile = riskProfiles.find(p => p.value === profile);
        if (selectedProfile) {
            setMeanReturn(selectedProfile.meanReturn);
            setVolatility(selectedProfile.volatility);
        }
    };

    // Auto-run simulation when component mounts or goal/settings change, if not yet run
    useEffect(() => {
        if (!results && !isRunning && monthsRemaining > 0) {
            run();
        }
    }, [goal.id, meanReturn, volatility, simulations, monthlyContribution, monthsRemaining, run, results, isRunning]);


    return (
        <Card>
            <h4 className="text-lg font-semibold text-white mb-4">Monte Carlo Outcome Analysis</h4>
            <div className="flex flex-wrap gap-4 items-end mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Risk Profile</label>
                    <select
                        value={goal.riskProfile || 'moderate'}
                        onChange={(e) => handleRiskProfileChange(e.target.value as RiskProfile)}
                        className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-900 text-white"
                    >
                        {riskProfiles.map(profile => (
                            <option key={profile.value} value={profile.value}>{profile.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Market Volatility ({ (volatility*100).toFixed(1) }%)</label>
                    <input type="range" min="0.05" max="0.4" step="0.005" value={volatility} onChange={(e) => setVolatility(Number(e.target.value))} className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Avg. Annual Return ({ (meanReturn*100).toFixed(1) }%)</label>
                    <input type="range" min="0.01" max="0.15" step="0.001" value={meanReturn} onChange={(e) => setMeanReturn(Number(e.target.value))} className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400">Simulations ({simulations.toLocaleString()})</label>
                    <input type="range" min="500" max="10000" step="500" value={simulations} onChange={(e) => setSimulations(Number(e.target.value))} className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <button onClick={run} disabled={isRunning || monthsRemaining <= 0} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed">
                    {isRunning ? 'Simulating...' : 'Run Simulation'}
                </button>
            </div>
            {monthsRemaining <= 0 && (
                 <div className="p-4 rounded-lg bg-red-500/10 text-red-300 mb-4">
                    <p className="font-bold">Cannot run simulation:</p>
                    <p>The goal's target date ({formatDate(goal.targetDate)}) is in the past or current month. Please update the goal target date to a future month to run simulations.</p>
                 </div>
             )}
            {isRunning && <div className="text-center py-10 text-gray-400">Calculating thousands of possible futures...</div>}
            {results && (
                <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                             <h5 className="font-semibold text-white mb-2">Projected Growth Range Over Time</h5>
                             <div className="h-80 w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={results.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis dataKey="month" stroke="#A0AEC0" />
                                        <YAxis tickFormatter={(tick) => `$${(tick / 1000).toLocaleString()}k`} stroke="#A0AEC0"/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <defs>
                                            <linearGradient id="colorRangeUpper" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#38B2AC" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorRangeLower" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#E53E3E" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#E53E3E" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="p90" fill="transparent" name="90th Percentile" strokeWidth={1} stroke="#82ca9d"/>
                                        <Line type="monotone" dataKey="median" stroke="#F6E05E" strokeWidth={2} dot={false} name="Median Outcome" />
                                        <Area type="monotone" dataKey="p90" strokeWidth={0} fillOpacity={0.2} fill="url(#colorRangeUpper)" name="Optimistic Range" />
                                        <Area type="monotone" dataKey="p10" fillOpacity={0} name="Pessimistic Range (Base for upper fill)" />
                                        
                                        <Line type="monotone" dataKey="p10" stroke="#E53E3E" strokeWidth={1} dot={false} name="10th Percentile" />
                                        {goal.targetAmount > 0 && <Line type="monotone" dataKey="target" stroke="#718096" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Target Amount" />}

                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-white mb-2">Distribution of Final Outcomes</h5>
                             <div className="h-80 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={distributionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                        <XAxis dataKey="range" stroke="#A0AEC0" tick={{fontSize: 10}} interval={0} angle={-30} textAnchor="end" height={60} />
                                        <YAxis stroke="#A0AEC0" />
                                        <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(127, 209, 213, 0.1)'}} />
                                        <Bar dataKey="count" name="Number of Simulations" fill="#38B2AC" />
                                        {goal.targetAmount > 0 && <ReferenceLine x={distributionData.findIndex(b => b.midpoint >= goal.targetAmount)} stroke="#E53E3E" label={{ value: `Target: $${goal.targetAmount.toLocaleString()}`, position: 'top', fill: '#E53E3E', fontSize: 10 }} />}
                                    </BarChart>
                                </ResponsiveContainer>
                             </div>
                        </div>
                    </div>
                    <div className="mt-6 p-4 rounded-lg bg-cyan-500/10">
                        <h5 className="font-bold text-white">Simulation Summary</h5>
                        <p className="text-sm text-cyan-200">
                           Based on {simulations.toLocaleString()} simulations with an expected <strong className="text-white">{(meanReturn*100).toFixed(1)}% annual return</strong> and <strong className="text-white">{(volatility*100).toFixed(1)}% volatility</strong>, there is a <span className="font-bold text-white text-lg">{results.successProbability(goal.targetAmount).toFixed(1)}%</span> chance of reaching or exceeding your target of ${goal.targetAmount.toLocaleString()}.
                        </p>
                        <div className="mt-2 text-xs grid grid-cols-1 md:grid-cols-3 gap-2 text-cyan-300">
                            <span>Pessimistic Outcome (10% likelihood): <strong className="text-white">${Math.round(results.p10Path[results.p10Path.length - 1]).toLocaleString()}</strong></span>
                            <span>Median Outcome (50% likelihood): <strong className="text-white">${Math.round(results.medianPath[results.medianPath.length - 1]).toLocaleString()}</strong></span>
                            <span>Optimistic Outcome (90% likelihood): <strong className="text-white">${Math.round(results.p90Path[results.p90Path.length - 1]).toLocaleString()}</strong></span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

/**
 * Philosophical thought: AI insights are not a replacement for human judgment, but an augmentation.
 * They sift through data, identify patterns, and offer possibilities, enabling smarter decisions
 * and more personalized guidance. When integrated thoughtfully, AI transforms complex financial
 * planning into an accessible, empowering experience, bridging the gap between aspiration and achievement.
 *
 * Million Dollar Feature Overview: "The 'Gemini Oracle of Gold'!"
 * (Jester voice) "Lo and behold, the 'Gemini Oracle' doth speak!
 * Whispering secrets of your gold, making your future sleek!
 * It scans the stars (and your data, of course), to help your wealth to peak!
 * If your goal strays, it suggests a path, a strategy unique!
 * No more guessing, no more yearning, just prosperous, week after week!"
 */
export const AiInsightsAndRecalibration: React.FC<{
    goal: ExtendedFinancialGoal;
    onGeneratePlan: (goalId: string) => Promise<void>;
    onRecalibrateGoal: (goalId: string, updates: { targetAmount?: number; targetDate?: string; monthlyContribution?: number }) => void;
    loadingGoalId: string | null;
}> = ({ goal, onGeneratePlan, onRecalibrateGoal, loadingGoalId }) => {
    const [isRecalibrationModalOpen, setIsRecalibrationModalOpen] = useState(false);
    const [recalibratedAmount, setRecalibratedAmount] = useState(goal.targetAmount.toString());
    const [recalibratedDate, setRecalibratedDate] = useState(goal.targetDate);
    const [recalibratedMonthlyContribution, setRecalibratedMonthlyContribution] = useState((goal.plan?.monthlyContribution || 0).toString());

    useEffect(() => {
        setRecalibratedAmount(goal.targetAmount.toString());
        setRecalibratedDate(goal.targetDate);
        setRecalibratedMonthlyContribution((goal.plan?.monthlyContribution || 0).toString());
    }, [goal]);

    const handleRecalibrate = () => {
        const updates: { targetAmount?: number; targetDate?: string; monthlyContribution?: number } = {};
        if (parseFloat(recalibratedAmount) !== goal.targetAmount) {
            updates.targetAmount = parseFloat(recalibratedAmount);
        }
        if (recalibratedDate !== goal.targetDate) {
            updates.targetDate = recalibratedDate;
        }
        if (parseFloat(recalibratedMonthlyContribution) !== (goal.plan?.monthlyContribution || 0)) {
            updates.monthlyContribution = parseFloat(recalibratedMonthlyContribution);
        }
        onRecalibrateGoal(goal.id, updates);
        setIsRecalibrationModalOpen(false);
    };

    const monthsRemaining = monthsBetween(new Date(), new Date(goal.targetDate));
    const currentRequiredMonthlySaving = (goal.targetAmount - goal.currentAmount) / (monthsRemaining > 0 ? monthsRemaining : 1);

    const effectiveMonthlyContribution = useMemo(() => {
        let total = goal.plan?.monthlyContribution || 0;
        if (goal.recurringContributions) {
            for (const rc of goal.recurringContributions) {
                if (rc.isActive) {
                    let monthlyEquivalent = rc.amount;
                    if (rc.frequency === 'bi-weekly') monthlyEquivalent *= (26 / 12);
                    else if (rc.frequency === 'weekly') monthlyEquivalent *= (52 / 12);
                    total += monthlyEquivalent;
                }
            }
        }
        return total;
    }, [goal.plan, goal.recurringContributions]);

    const suggestAdjustments = useCallback(() => {
        // This would be where Gemini provides actual suggestions.
        // For now, let's mock some based on simple heuristics.
        if (monthsRemaining <= 0) {
            return {
                summary: "Your target date has passed or is current. Consider extending the date or reducing the target amount.",
                steps: [
                    "Extend your goal target date by at least 6-12 months.",
                    "Re-evaluate your target amount to be more achievable in the remaining time.",
                    "Increase your monthly contributions significantly if possible."
                ]
            };
        }

        if (goal.status === 'on_track' && (goal.currentAmount / goal.targetAmount) > 0.9) {
            return {
                summary: "Excellent! You are very close to achieving your goal.",
                steps: [
                    "Consider reviewing your spending to make a final push.",
                    "Think about setting up a new goal to continue your savings momentum.",
                    "Explore options for reinvesting the surplus once the goal is met."
                ]
            };
        }
        
        if (goal.status === 'behind' || goal.status === 'needs_attention') {
            const desiredMonthly = goal.plan?.monthlyContribution || currentRequiredMonthlySaving;
            const suggestedIncrease = Math.ceil(desiredMonthly * 0.2); // Suggest a 20% increase
            const suggestedNewAmount = goal.targetAmount * 0.9; // Suggest reducing by 10%
            const suggestedNewDate = new Date(new Date(goal.targetDate).setMonth(new Date(goal.targetDate).getMonth() + 6)).toISOString().split('T')[0]; // Extend by 6 months

            const issues: string[] = [];
            const actionSteps: string[] = [];

            if (effectiveMonthlyContribution < currentRequiredMonthlySaving * 0.8) { // Significantly below
                issues.push("Your current contributions are significantly below what's needed.");
                actionSteps.push(`Increase your monthly contribution by at least $${suggestedIncrease.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`);
            }

            if (monthsRemaining < 12 && goal.currentAmount / goal.targetAmount < 0.5) { // Far from goal, little time
                issues.push("You have limited time remaining and are far from your goal.");
                actionSteps.push(`Consider extending the target date to ${formatDate(suggestedNewDate)}.`);
                actionSteps.push(`Alternatively, adjust your target amount to around $${suggestedNewAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} to make it more feasible.`);
            }

            if (issues.length === 0) { // If no specific issues, provide general advice
                return {
                    summary: "Your goal needs some attention. Let's refine your plan.",
                    steps: [
                        "Review your budget for potential areas to increase savings.",
                        "Consider setting up or increasing recurring contributions.",
                        "Evaluate if the current target date and amount are realistic given your current pace."
                    ]
                };
            }

            return {
                summary: `Your goal requires adjustment: ${issues.join(' ')}`,
                steps: actionSteps
            };
        }

        return {
            summary: "Your goal is on track!",
            steps: ["Keep up the great work!", "Consider allocating any surplus funds to other goals.", "Review your progress regularly."]
        };
    }, [goal, monthsRemaining, currentRequiredMonthlySaving, effectiveMonthlyContribution]);

    const { summary: aiSummary, steps: aiActionableSteps } = suggestAdjustments();

    return (
        <Card>
            <h4 className="text-lg font-semibold text-white mb-4">AI-Generated Plan & Insights</h4>
            {goal.plan ? (
                <div className="space-y-4 text-gray-300">
                    <p><strong className="text-white">Summary:</strong> {goal.plan.summary}</p>
                    <div>
                        <strong className="text-white">Actionable Steps from Plan:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm pl-2">
                            {goal.plan.actionableSteps?.map((step, index) => <li key={index}>{step}</li>)}
                        </ul>
                    </div>
                    <p><strong className="text-white">Recommended Monthly Contribution:</strong> ${goal.plan.monthlyContribution.toLocaleString()}</p>

                    <div className="p-4 bg-cyan-800/20 rounded-lg border border-cyan-700 mt-6">
                        <h5 className="font-bold text-white mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m15.364 6.364l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            AI Smart Adjustments ({aiSummary})
                        </h5>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-sm pl-2 text-cyan-200">
                            {aiActionableSteps.map((step, index) => <li key={index}>{step}</li>)}
                        </ul>
                        <button
                            onClick={() => setIsRecalibrationModalOpen(true)}
                            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
                        >
                            Recalibrate Goal
                        </button>
                    </div>

                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No AI plan has been generated for this goal yet.</p>
                    <button onClick={() => onGeneratePlan(goal.id)} disabled={loadingGoalId === goal.id} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {loadingGoalId === goal.id ? 'Generating Plan...' : 'Generate AI Plan'}
                    </button>
                </div>
            )}

            <Modal isOpen={isRecalibrationModalOpen} onClose={() => setIsRecalibrationModalOpen(false)} title="Recalibrate Goal">
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">Adjust your goal parameters below based on AI insights or your revised plan. Only fill in fields you wish to change.</p>
                    <div>
                        <label htmlFor="recalibrated-amount" className="block text-sm font-medium text-gray-300">New Target Amount</label>
                        <input
                            type="number"
                            id="recalibrated-amount"
                            value={recalibratedAmount}
                            onChange={e => setRecalibratedAmount(e.target.value)}
                            className="mt-1 w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder={goal.targetAmount.toString()}
                        />
                    </div>
                    <div>
                        <label htmlFor="recalibrated-date" className="block text-sm font-medium text-gray-300">New Target Date</label>
                        <input
                            type="date"
                            id="recalibrated-date"
                            value={recalibratedDate}
                            onChange={e => setRecalibratedDate(e.target.value)}
                            className="mt-1 w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    {goal.plan && (
                        <div>
                            <label htmlFor="recalibrated-monthly-contribution" className="block text-sm font-medium text-gray-300">New Recommended Monthly Contribution</label>
                            <input
                                type="number"
                                id="recalibrated-monthly-contribution"
                                value={recalibratedMonthlyContribution}
                                onChange={e => setRecalibratedMonthlyContribution(e.target.value)}
                                className="mt-1 w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder={goal.plan.monthlyContribution.toString()}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsRecalibrationModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Cancel</button>
                        <button onClick={handleRecalibrate} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Apply Recalibration</button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

/**
 * Philosophical thought: The relationship between financial goals mirrors the interconnectedness of life's aspirations.
 * Rarely does one goal exist in isolation; often, the achievement of one unlocks the possibility of another.
 * This component provides a canvas to map these dependencies, fostering a holistic and strategic approach
 * to personal finance, where every step forward contributes to a larger, integrated vision.
 *
 * Million Dollar Feature Overview: "The 'Web of Wealth Weaver'!"
 * (Jester voice) "Oh, how your dreams, like vines, intertwine!
 * A house requires gold, then a car, then a holiday so divine!
 * Our 'Web Weaver' maps these paths, a glorious design!
 * When one goal's met, another blossoms, a truly splendid sign!
 * Manage your kingdom's finances, link them all, make them align!"
 */
export const GoalDependenciesManager: React.FC<{
    goal: ExtendedFinancialGoal;
    allGoals: ExtendedFinancialGoal[];
    onLinkGoal: (sourceGoalId: string, targetGoalId: string, relationshipType: LinkedGoal['relationshipType'], triggerAmount?: number) => void;
    onUnlinkGoal: (sourceGoalId: string, targetGoalId: string) => void;
}> = ({ goal, allGoals, onLinkGoal, onUnlinkGoal }) => {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedTargetGoalId, setSelectedTargetGoalId] = useState<string>('');
    const [selectedRelationshipType, setSelectedRelationshipType] = useState<LinkedGoal['relationshipType']>('dependency');
    const [triggerAmount, setTriggerAmount] = useState('');

    const availableGoalsToLink = useMemo(() => {
        return allGoals.filter(g => g.id !== goal.id && !goal.linkedGoals?.some(lg => lg.id === g.id));
    }, [goal, allGoals]);

    const handleLink = () => {
        if (selectedTargetGoalId && selectedRelationshipType) {
            const amount = triggerAmount ? parseFloat(triggerAmount) : undefined;
            onLinkGoal(goal.id, selectedTargetGoalId, selectedRelationshipType, amount);
            setIsLinkModalOpen(false);
            setSelectedTargetGoalId('');
            setTriggerAmount('');
        }
    };

    const RelationshipDisplay: React.FC<{ link: LinkedGoal; targetGoal: ExtendedFinancialGoal }> = ({ link, targetGoal }) => {
        const relationshipDescriptions: Record<LinkedGoal['relationshipType'], string> = {
            'prerequisite': `is a prerequisite for`,
            'dependency': `depends on`,
            'overflow': `overflows into`,
            'sibling': `is a sibling goal with`
        };

        const reverseRelationshipDescriptions: Record<LinkedGoal['relationshipType'], string> = {
            'prerequisite': `is required by`,
            'dependency': `requires`,
            'overflow': `receives overflow from`,
            'sibling': `is a sibling goal with`
        };

        const getRelationshipText = (source: 'current' | 'target', type: LinkedGoal['relationshipType']) => {
            if (source === 'current') {
                return relationshipDescriptions[type] || type;
            } else {
                return reverseRelationshipDescriptions[type] || type;
            }
        };

        return (
            <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="font-semibold text-white">{goal.name}</span>
                <span className="text-gray-400">{getRelationshipText('current', link.relationshipType)}</span>
                <span className="font-semibold text-white">{targetGoal.name}</span>
                {link.triggerAmount && (
                    <span className="text-gray-500 text-xs">(at ${link.triggerAmount.toLocaleString()})</span>
                )}
            </div>
        );
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">Goal Dependencies</h4>
                <button onClick={() => setIsLinkModalOpen(true)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md text-xs font-medium">Link Goal</button>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2">
                {goal.linkedGoals && goal.linkedGoals.length > 0 ? (
                    <div className="space-y-3">
                        {goal.linkedGoals.map(link => {
                            const targetGoal = allGoals.find(g => g.id === link.id);
                            if (!targetGoal) return null;
                            return (
                                <div key={link.id} className="p-3 rounded-lg bg-gray-700/30 border border-gray-700 flex justify-between items-center">
                                    <RelationshipDisplay link={link} targetGoal={targetGoal} />
                                    <button onClick={() => onUnlinkGoal(goal.id, link.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-500">No linked goals yet. Link goals to create a strategic financial roadmap.</p>
                )}
            </div>

            <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Link Another Goal">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="target-goal" className="block text-sm font-medium text-gray-300">Target Goal</label>
                        <select
                            id="target-goal"
                            value={selectedTargetGoalId}
                            onChange={e => setSelectedTargetGoalId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-900 text-white"
                        >
                            <option value="">Select a goal</option>
                            {availableGoalsToLink.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="relationship-type" className="block text-sm font-medium text-gray-300">Relationship Type</label>
                        <select
                            id="relationship-type"
                            value={selectedRelationshipType}
                            onChange={e => setSelectedRelationshipType(e.target.value as LinkedGoal['relationshipType'])}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md bg-gray-900 text-white"
                        >
                            <option value="dependency">This goal depends on the target goal (e.g., must finish this first)</option>
                            <option value="prerequisite">The target goal is a prerequisite for this goal</option>
                            <option value="overflow">Funds from this goal overflow into the target goal</option>
                            <option value="sibling">They are related but not strictly dependent (e.g., both for retirement)</option>
                        </select>
                    </div>
                    {selectedRelationshipType === 'overflow' && (
                        <div>
                            <label htmlFor="trigger-amount" className="block text-sm font-medium text-gray-300">Trigger Amount (optional)</label>
                            <input
                                type="number"
                                id="trigger-amount"
                                value={triggerAmount}
                                onChange={e => setTriggerAmount(e.target.value)}
                                className="mt-1 w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="Amount when overflow begins (e.g., 50000)"
                            />
                            <p className="text-xs text-gray-500 mt-1">If specified, funds will overflow once this goal reaches this amount.</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsLinkModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Cancel</button>
                        <button onClick={handleLink} disabled={!selectedTargetGoalId || !selectedRelationshipType} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed">Link Goal</button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

// --- VIEWS ---

/**
 * Philosophical thought: The creation of a new goal is an act of optimism and intention.
 * It's the moment where a vague aspiration solidifies into a tangible target,
 * laying the first stone of a future edifice. This multi-step view is designed
 * to guide this foundational process, ensuring clarity and commitment from the outset.
 *
 * Million Dollar Feature Overview: "The 'Dream-to-Deed Dynamo'!"
 * (Jester voice) "Have a dream, a wish, a fancy, but know not where to start?
 * Our 'Dynamo' takes your airy thoughts, and crafts them with an art!
 * Step by step, a name, a date, a sum to play a part!
 * Choose an icon, sign your vision, a goal right from the heart!
 * Turning whispers into wealth, a truly cunning smart!"
 */
export const CreateGoalView: React.FC<{
    onGoalCreate: (newGoal: Omit<FinancialGoal, 'id' | 'currentAmount' | 'plan' | 'contributions' | 'recurringContributions' | 'linkedGoals' | 'status'>) => void;
    onBack: () => void;
}> = ({ onGoalCreate, onBack }) => {
    const [step, setStep] = useState(1);
    const [goalData, setGoalData] = useState({
        name: '',
        targetAmount: '',
        targetDate: '',
        iconName: 'default',
        startDate: new Date().toISOString().split('T')[0], // Default start date to today
        riskProfile: 'moderate' as RiskProfile, // Default risk profile
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateStep = () => {
        const newErrors: { [key: string]: string } = {};
        if (step === 1) {
            if (!goalData.name) newErrors.name = 'Goal name is required.';
            if (Number(goalData.targetAmount) <= 0 || isNaN(Number(goalData.targetAmount))) newErrors.targetAmount = 'Target amount must be a positive number.';
            if (!goalData.targetDate) newErrors.targetDate = 'Target date is required.';
            else if (new Date(goalData.targetDate) <= new Date()) newErrors.targetDate = 'Target date must be in the future.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => setStep(s => s - 1);

    const handleSubmit = () => {
        if (validateStep()) { // Re-validate final step
            onGoalCreate({
                ...goalData,
                targetAmount: parseFloat(goalData.targetAmount),
            });
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Goal Name</label>
                            <input type="text" value={goalData.name} onChange={e => setGoalData({...goalData, name: e.target.value})} className="w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Buy a new car"/>
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Target Amount</label>
                                <input type="number" value={goalData.targetAmount} onChange={e => setGoalData({...goalData, targetAmount: e.target.value})} className="w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500" placeholder="50000" />
                                {errors.targetAmount && <p className="text-red-400 text-xs mt-1">{errors.targetAmount}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
                                <input type="date" value={goalData.targetDate} onChange={e => setGoalData({...goalData, targetDate: e.target.value})} className="w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500" />
                                {errors.targetDate && <p className="text-red-400 text-xs mt-1">{errors.targetDate}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Choose an Icon</label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_GOAL_ICONS.map(iconName => {
                                    const IconComponent = GOAL_ICONS[iconName];
                                    return (
                                        <button type="button" key={iconName} onClick={() => setGoalData({...goalData, iconName})} className={`p-3 rounded-full ${goalData.iconName === iconName ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'} transition-colors`}>
                                            <IconComponent className="w-6 h-6" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Investment Risk Profile</label>
                             <select
                                 value={goalData.riskProfile}
                                 onChange={e => setGoalData({...goalData, riskProfile: e.target.value as RiskProfile})}
                                 className="w-full bg-gray-900 border-gray-600 text-white rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                             >
                                 <option value="conservative">Conservative (Lower risk, lower potential return)</option>
                                 <option value="moderate">Moderate (Balanced risk and return)</option>
                                 <option value="aggressive">Aggressive (Higher risk, higher potential return)</option>
                             </select>
                             <p className="text-xs text-gray-500 mt-1">This will influence AI recommendations and projections.</p>
                         </div>
                    </div>
                );
            case 2:
                const Icon = GOAL_ICONS[goalData.iconName] || GOAL_ICONS.default;
                return (
                     <div className="text-center">
                        <h3 className="text-lg font-semibold text-white mb-4">Review Your New Goal</h3>
                        <div className="text-left mt-4 p-4 bg-gray-700/50 rounded-lg space-y-3">
                            <p className="text-gray-400 flex justify-between items-center">Name: <strong className="text-white">{goalData.name}</strong></p>
                            <p className="text-gray-400 flex justify-between items-center">Target: <strong className="text-white">${parseFloat(goalData.targetAmount).toLocaleString()}</strong></p>
                            <p className="text-gray-400 flex justify-between items-center">By Date: <strong className="text-white">{formatDate(goalData.targetDate)}</strong></p>
                            <p className="text-gray-400 flex justify-between items-center">Risk Profile: <strong className="text-white capitalize">{goalData.riskProfile}</strong></p>
                            <p className="text-gray-400 flex items-center gap-2">Icon: <span className="p-1 bg-cyan-500/20 rounded-full"><Icon className="w-5 h-5 text-cyan-300" /></span></p>
                        </div>
                    </div>
                );
        }
    };
    

    return (
         <div>
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-white tracking-wider">Create New Goal</h2>
                 <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-200">Back to List</button>
            </div>
            <Card>
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="relative h-2 bg-gray-700 rounded-full">
                         <div className="absolute top-0 left-0 h-2 bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${(step - 1) / 1 * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span className={`transition-colors ${step >= 1 ? 'text-white font-medium' : ''}`}>Details</span>
                        <span className={`transition-colors ${step >= 2 ? 'text-white font-medium' : ''}`}>Confirm</span>
                    </div>
                </div>

                {renderStep()}
                
                <div className="flex justify-between mt-8">
                    <button type="button" onClick={prevStep} disabled={step === 1} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Back
                    </button>
                    {step < 2 ? (
                        <button type="button" onClick={nextStep} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors">
                            Next
                        </button>
                    ) : (
                        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                           Create Goal
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
};

/**
 * Philosophical thought: The detail view of a goal is its beating heart, a command center
 * for insight, action, and strategic planning. It aggregates past efforts, illuminates
 * future possibilities, and provides the tools for dynamic adjustment. It's where the
 * user truly engages with their financial aspirations, empowered by comprehensive data.
 *
 * Million Dollar Feature Overview: "The 'Grand Goal Gallereia'!"
 * (Jester voice) "Step right up, noble saver, and behold your goal's full glory!
 * No mere overview, but a 'Gallereia' of its complete story!
 * From humble pennies to soaring projections, a truly epic allegory!
 * Contributions, plans, risks, and AI wisdom – all in one inventory!
 * Tweak, adjust, observe, and conquer, your financial victory!"
 */
export const GoalDetailView: React.FC<{
    goal: ExtendedFinancialGoal;
    allGoals: ExtendedFinancialGoal[]; // Added for GoalDependenciesManager
    onBack: () => void;
    onGeneratePlan: (goalId: string) => Promise<void>;
    onAddContribution: (goalId: string, amount: number) => void;
    onAddRecurringContribution: (goalId: string, contribution: Omit<RecurringContribution, 'id'>) => void;
    onUpdateRecurringContribution: (goalId: string, contributionId: string, updates: Partial<RecurringContribution>) => void;
    onDeleteRecurringContribution: (goalId: string, contributionId: string) => void;
    onRecalibrateGoal: (goalId: string, updates: { targetAmount?: number; targetDate?: string; monthlyContribution?: number }) => void;
    onLinkGoal: (sourceGoalId: string, targetGoalId: string, relationshipType: LinkedGoal['relationshipType'], triggerAmount?: number) => void;
    onUnlinkGoal: (sourceGoalId: string, targetGoalId: string) => void;
    loadingGoalId: string | null;
}> = ({ goal, allGoals, onBack, onGeneratePlan, onAddContribution, onAddRecurringContribution, onUpdateRecurringContribution, onDeleteRecurringContribution, onRecalibrateGoal, onLinkGoal, onUnlinkGoal, loadingGoalId }) => {
    type Tab = 'overview' | 'contributions' | 'projections' | 'monte-carlo' | 'insights' | 'dependencies';
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const Icon = GOAL_ICONS[goal.iconName] || GOAL_ICONS.default;
    const monthsRemaining = monthsBetween(new Date(), new Date(goal.targetDate));
    const requiredMonthlySaving = (goal.targetAmount - goal.currentAmount) / (monthsRemaining > 0 ? monthsRemaining : 1);

    const tabs: {id: Tab, label: string}[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'contributions', label: 'Contributions' },
        { id: 'projections', label: 'Projections' },
        { id: 'monte-carlo', label: 'Risk Analysis' },
        { id: 'insights', label: 'AI Insights' },
        { id: 'dependencies', label: 'Dependencies' }, // New tab
    ];

    return (
         <div>
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div className="flex items-center gap-4">
                     <div className="flex-shrink-0 w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-300">
                         <Icon className="w-8 h-8" />
                     </div>
                     <div>
                        <h2 className="text-3xl font-bold text-white tracking-wider">{goal.name}</h2>
                        <p className="text-gray-400 text-sm">Target: <strong className="text-white">${goal.targetAmount.toLocaleString()}</strong> by <strong className="text-white">{formatDate(goal.targetDate)}</strong></p>
                        <p className="text-gray-500 text-xs mt-1">Started: {formatDate(goal.startDate)} | Risk Profile: <strong className="capitalize">{goal.riskProfile || 'N/A'}</strong></p>
                    </div>
                </div>
                 <button onClick={onBack} className="mt-2 md:mt-0 text-sm text-cyan-400 hover:text-cyan-200 self-start md:self-center">Back to List</button>
            </div>
            
            <div className="border-b border-gray-700 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
             
            {activeTab === 'overview' && (
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-sm text-gray-400">Current Amount</p>
                            <p className="text-3xl font-bold text-white">${goal.currentAmount.toLocaleString()}</p>
                        </div>
                         <div className="p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-sm text-gray-400">Remaining</p>
                            <p className="text-3xl font-bold text-white">${(goal.targetAmount - goal.currentAmount).toLocaleString()}</p>
                        </div>
                         <div className="p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-sm text-gray-400">Months Remaining</p>
                            <p className="text-3xl font-bold text-white">{monthsRemaining}</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-300 mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                             <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-4 rounded-full" style={{ width: `${progress}%` }}></div>
                        </div>
                         <p className="text-center text-sm text-gray-400 mt-2">Required monthly saving: <strong className="text-white">${requiredMonthlySaving.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></p>
                    </div>
                </Card>
            )}

            {activeTab === 'contributions' && <ContributionHistory goal={goal as ExtendedFinancialGoal} onAddContribution={onAddContribution} onAddRecurringContribution={onAddRecurringContribution} onUpdateRecurringContribution={onUpdateRecurringContribution} onDeleteRecurringContribution={onDeleteRecurringContribution} />}
            {activeTab === 'projections' && <ProjectionSimulator goal={goal as ExtendedFinancialGoal} />}
            {activeTab === 'monte-carlo' && <MonteCarloAnalysis goal={goal as ExtendedFinancialGoal} />}
            {activeTab === 'insights' && <AiInsightsAndRecalibration goal={goal as ExtendedFinancialGoal} onGeneratePlan={onGeneratePlan} onRecalibrateGoal={onRecalibrateGoal} loadingGoalId={loadingGoalId} />}
            {activeTab === 'dependencies' && <GoalDependenciesManager goal={goal as ExtendedFinancialGoal} allGoals={allGoals as ExtendedFinancialGoal[]} onLinkGoal={onLinkGoal} onUnlinkGoal={onUnlinkGoal} />}

        </div>
    );
};


const FinancialGoalsView: React.FC = () => {
    const context = useContext(DataContext);
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
    const [loadingGoalId, setLoadingGoalId] = useState<string | null>(null);

    if (!context) {
        throw new Error("FinancialGoalsView must be used within a DataProvider.");
    }
    const { 
        financialGoals, addFinancialGoal, generateGoalPlan, addContributionToGoal, 
        addRecurringContributionToGoal, updateRecurringContributionInGoal, 
        deleteRecurringContributionFromGoal, updateFinancialGoal, linkGoals, unlinkGoals 
    } = context;

    const handleCreateGoal = (newGoalData: Omit<FinancialGoal, 'id' | 'currentAmount' | 'plan' | 'contributions' | 'recurringContributions' | 'linkedGoals' | 'status'>) => {
        addFinancialGoal(newGoalData);
        setView('list');
    };

    const handleGeneratePlan = async (goalId: string) => {
        setLoadingGoalId(goalId);
        await generateGoalPlan(goalId);
        setLoadingGoalId(null);
    };

    const handleViewDetails = (goal: FinancialGoal) => {
        setSelectedGoal(goal);
        setView('detail');
    };

    const handleRecalibrateGoal = (goalId: string, updates: { targetAmount?: number; targetDate?: string; monthlyContribution?: number }) => {
        updateFinancialGoal(goalId, updates);
        // After recalibration, it might be good to auto-regenerate the plan.
        // For simplicity, we'll leave it as a manual action for now.
    };

    const renderContent = () => {
        switch (view) {
            case 'create':
                return <CreateGoalView onGoalCreate={handleCreateGoal} onBack={() => setView('list')} />;
            case 'detail':
                if (selectedGoal) {
                    return (
                        <GoalDetailView
                            goal={selectedGoal as ExtendedFinancialGoal}
                            allGoals={financialGoals as ExtendedFinancialGoal[]}
                            onBack={() => setView('list')}
                            onGeneratePlan={handleGeneratePlan}
                            loadingGoalId={loadingGoalId}
                            onAddContribution={addContributionToGoal}
                            onAddRecurringContribution={addRecurringContributionToGoal}
                            onUpdateRecurringContribution={updateRecurringContributionInGoal}
                            onDeleteRecurringContribution={deleteRecurringContributionFromGoal}
                            onRecalibrateGoal={handleRecalibrateGoal}
                            onLinkGoal={linkGoals}
                            onUnlinkGoal={unlinkGoals}
                        />
                    );
                }
                return null;
            case 'list':
            default:
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-white tracking-wider">Financial Goals</h2>
                            <button onClick={() => setView('create')} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105">
                                + New Goal
                            </button>
                        </div>
                        {financialGoals.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {financialGoals.map(goal => {
                                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                                    const Icon = GOAL_ICONS[goal.iconName] || GOAL_ICONS.default;
                                    return (
                                        <Card key={goal.id} onClick={() => handleViewDetails(goal)} variant="interactive">
                                            <div className="flex items-center mb-4">
                                                <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-300 mr-4">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-white">{goal.name}</h3>
                                                    <p className="text-xs text-gray-400">Target: ${goal.targetAmount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-300">
                                                    <span>${goal.currentAmount.toLocaleString()}</span>
                                                    <span>{progress.toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                                    <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                             </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No financial goals set yet. Create one to get started!</p>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {renderContent()}
        </div>
    );
};

// FIX: Add missing default export for FinancialGoalsView. This resolves both the import error in App.tsx and the subsequent obscure type error within this component.
export default FinancialGoalsView;
