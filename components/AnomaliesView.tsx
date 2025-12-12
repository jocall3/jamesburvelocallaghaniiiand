/*
    Title: Beyond the Algorithm: 3 Surprising Truths About AI Anomaly Detection from a Developer's View

    Introduction:
    In a world awash with data, the promise of AI to spot the 'needle in the haystack' – those critical anomalies that signal fraud, system failures, or emerging trends – is incredibly compelling. But what does this look like when the rubber meets the road? We recently peeked into a simple React component designed to display financial anomalies, and what we found offers a fascinating, grounded perspective on how these intelligent systems truly deliver value. It's not just about the AI; it's about the human-centric design that makes it actionable.

    **1. Why a Splash of Color Matters More Than You Think**
    You might imagine an AI system simply spitting out a list of detected anomalies with complex probability scores. Yet, our `AnomalyCard` component reveals a more intuitive reality: immediate visual cues are paramount. The `severityStyles` object isn't just for aesthetics; it's a critical design choice that instantly communicates urgency. A red border and a warning triangle for 'High' severity cut through the noise far faster than any numerical risk score could alone. This highlights a core principle in effective AI implementation: the most brilliant algorithm is useless if its insights aren't immediately digestible by a human operator.

    > "The goal isn't just to detect; it's to enable rapid, informed response."

    **2. It's Not Just 'What,' But 'Who,' 'When,' and 'How'**
    An anomaly, by definition, is an outlier. But knowing *something* is wrong isn't enough. The `AnomalyCard` component meticulously displays `description`, `entityDescription`, `details`, and `timestamp`. This isn't overkill; it's essential context. Imagine an alert saying 'Unusual transaction.' Now compare that to 'High severity: Large transfer from dormant account (Entity: John Doe, Details: Transfer to offshore account, Timestamp: 2023-10-26 03:15 AM).' The latter empowers immediate investigation. This component underscores that effective anomaly detection isn't just about flagging an event, but about providing the rich narrative necessary for human understanding and decision-making.

    > "Data without context is just noise; with context, it becomes intelligence."

    **3. Blending Human Intuition with Algorithmic Precision**
    While a `riskScore` provides a quantitative measure, our component also features a `severity` (High, Medium, Low) and a `status`. This multi-layered approach to risk assessment is a subtle but profound insight. A single risk score, while precise, can sometimes lack the intuitive weight of a qualitative label. By combining a numerical score with human-interpretable categories and a clear status, the system caters to different cognitive needs. It's a testament to the idea that the most effective AI solutions often involve a thoughtful blend of algorithmic precision and human-friendly categorization, acknowledging that real-world risk is rarely a monolithic value.

    > "True understanding emerges when numbers meet narrative."

    Conclusion:
    Our brief dive into this seemingly simple UI component reveals that the true power of AI anomaly detection lies not just in its complex algorithms, but in the thoughtful design that makes its insights accessible, contextual, and actionable for humans. It's a powerful reminder that technology, at its best, augments human capabilities rather than replaces them. As AI continues to evolve, how can we further refine this delicate dance between machine intelligence and human intuition to build even more robust and understandable systems?
*/
import React from 'react';
import Card from './Card';
import { MOCK_ANOMALIES } from '../data/mockData';
import { FinancialAnomaly } from '../types';
import { AlertTriangle, Zap, BarChart } from 'lucide-react';

const AnomalyCard: React.FC<{ anomaly: FinancialAnomaly }> = ({ anomaly }) => {
    const severityStyles = {
        High: { icon: <AlertTriangle className="text-red-400" />, border: 'border-red-500' },
        Medium: { icon: <Zap className="text-yellow-400" />, border: 'border-yellow-500' },
        Low: { icon: <BarChart className="text-blue-400" />, border: 'border-blue-500' }
    }
    const styles = severityStyles[anomaly.severity];

    return (
        <div className={`p-4 bg-gray-800/50 rounded-xl border-l-4 ${styles.border} flex gap-4`}>
            <div className="mt-1">
                {styles.icon}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-white">{anomaly.description}</p>
                        <p className="text-xs text-gray-400">{anomaly.entityDescription}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{new Date(anomaly.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-300 mt-2">{anomaly.details}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                    <span>Status: <span className="font-semibold text-white">{anomaly.status}</span></span>
                    <span>Risk Score: <span className="font-mono font-bold text-white">{anomaly.riskScore}</span></span>
                </div>
            </div>
        </div>
    )
}


const AnomaliesView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-wider">AI Anomaly Detection Feed</h2>
            <Card>
                <div className="space-y-4">
                    {MOCK_ANOMALIES.map(anomaly => (
                        <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                    ))}
                </div>
            </Card>
        </div>
    );
}

export default AnomaliesView;