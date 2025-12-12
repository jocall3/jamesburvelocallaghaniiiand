import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import clsx from 'clsx';
import { styled } from '@mui/material/styles';

// Namespace for Citibankdemobusinessinc
namespace Citibankdemobusinessinc {

  // Shared Kernel: Core Utilities and Types
  export namespace Kernel {
    export interface Message {
      text: string;
      isUser: boolean;
    }

    export const generateId = (): string => {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    export const simulateLatency = (min: number, max: number): Promise<void> => {
      const delay = Math.random() * (max - min) + min;
      return new Promise(resolve => setTimeout(resolve, delay));
    };

    export const encryptData = (data: string): string => {
      // Simplified encryption (replace with a real algorithm)
      return btoa(data);
    };

    export const decryptData = (encryptedData: string): string => {
      // Simplified decryption (replace with a real algorithm)
      return atob(encryptedData);
    };
  }

  // 1. Citibankdemobusinessinc.personalFinance.budgetBuddy
  export namespace personalFinance {
    export namespace budgetBuddy {
      // Mission: Empower users to achieve financial wellness through intelligent budgeting and personalized insights.
      // Monetization: Premium features, personalized financial advice, and partnerships with financial institutions.
      // IP Moat: Proprietary algorithms for budget optimization and predictive financial modeling.

      interface BudgetState {
        income: number;
        expenses: { [category: string]: number };
        savingsGoal: number;
      }

      const generateInitialBudgetState = (): BudgetState => ({
        income: Math.floor(Math.random() * 5000) + 2000,
        expenses: {
          "Housing": Math.floor(Math.random() * 1500) + 500,
          "Food": Math.floor(Math.random() * 800) + 300,
          "Transportation": Math.floor(Math.random() * 400) + 100,
          "Utilities": Math.floor(Math.random() * 300) + 50,
          "Entertainment": Math.floor(Math.random() * 200) + 50,
        },
        savingsGoal: Math.floor(Math.random() * 1000) + 200,
      });

      const analyzeBudget = (state: BudgetState): string => {
        const totalExpenses = Object.values(state.expenses).reduce((sum, expense) => sum + expense, 0);
        const remaining = state.income - totalExpenses;

        if (remaining > state.savingsGoal) {
          return `Your budget is healthy. You have $${remaining} remaining after expenses and savings.`;
        } else if (remaining >= 0) {
          return `You are meeting your savings goal, but have little remaining. Consider reducing expenses.`;
        } else {
          return `You are over budget by $${Math.abs(remaining)}. Review your expenses immediately.`;
        }
      };

      export const BudgetBuddyApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const budgetState = generateInitialBudgetState();

        if (message.toLowerCase().includes("budget analysis")) {
          return analyzeBudget(budgetState);
        } else {
          return "BudgetBuddy: How can I help you manage your finances?";
        }
      };
    }
  }

  // 2. Citibankdemobusinessinc.investmentInsights.roboAdvisor
  export namespace investmentInsights {
    export namespace roboAdvisor {
      // Mission: Democratize investment by providing personalized, data-driven investment advice to users of all levels.
      // Monetization: Management fees based on assets under management, premium investment strategies.
      // IP Moat: AI-powered portfolio optimization algorithms and risk assessment models.

      interface InvestmentProfile {
        riskTolerance: 'low' | 'medium' | 'high';
        investmentHorizon: 'short' | 'medium' | 'long';
        capital: number;
      }

      const generateInvestmentProfile = (): InvestmentProfile => {
        const riskLevels = ['low', 'medium', 'high'];
        const horizons = ['short', 'medium', 'long'];

        return {
          riskTolerance: riskLevels[Math.floor(Math.random() * riskLevels.length)] as 'low' | 'medium' | 'high',
          investmentHorizon: horizons[Math.floor(Math.random() * horizons.length)] as 'short' | 'medium' | 'long',
          capital: Math.floor(Math.random() * 50000) + 10000,
        };
      };

      const recommendPortfolio = (profile: InvestmentProfile): string => {
        let recommendation = "Based on your profile, we recommend: ";

        switch (profile.riskTolerance) {
          case 'low':
            recommendation += "A conservative portfolio with mostly bonds.";
            break;
          case 'medium':
            recommendation += "A balanced portfolio with a mix of stocks and bonds.";
            break;
          case 'high':
            recommendation += "An aggressive portfolio with mostly stocks.";
            break;
        }

        recommendation += ` Given your capital of $${profile.capital}, consider diversifying across multiple sectors.`;
        return recommendation;
      };

      export const RoboAdvisorApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const investmentProfile = generateInvestmentProfile();

        if (message.toLowerCase().includes("investment advice")) {
          return recommendPortfolio(investmentProfile);
        } else {
          return "RoboAdvisor: Ready to provide personalized investment insights.";
        }
      };
    }
  }

  // 3. Citibankdemobusinessinc.creditSolutions.creditScoreBooster
  export namespace creditSolutions {
    export namespace creditScoreBooster {
      // Mission: Help users improve their credit scores through personalized advice and actionable strategies.
      // Monetization: Subscription fees for premium credit monitoring and score improvement tools.
      // IP Moat: Proprietary credit score analysis algorithms and personalized recommendation engine.

      interface CreditReport {
        score: number;
        derogatoryMarks: number;
        creditUtilization: number;
      }

      const generateCreditReport = (): CreditReport => ({
        score: Math.floor(Math.random() * 300) + 550,
        derogatoryMarks: Math.floor(Math.random() * 3),
        creditUtilization: Math.random() * 0.5,
      });

      const analyzeCreditReport = (report: CreditReport): string => {
        let analysis = `Your credit score is ${report.score}. `;

        if (report.score < 600) {
          analysis += "This is considered a poor score. Focus on paying down debt and disputing errors.";
        } else if (report.score < 700) {
          analysis += "This is a fair score. Continue to make on-time payments and keep credit utilization low.";
        } else {
          analysis += "This is a good score. Maintain your responsible credit habits.";
        }

        if (report.derogatoryMarks > 0) {
          analysis += ` You have ${report.derogatoryMarks} derogatory marks. Address these immediately.`;
        }

        analysis += ` Your credit utilization is ${report.creditUtilization * 100}%. Aim to keep it below 30%.`;
        return analysis;
      };

      export const CreditScoreBoosterApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const creditReport = generateCreditReport();

        if (message.toLowerCase().includes("credit report analysis")) {
          return analyzeCreditReport(creditReport);
        } else {
          return "CreditScoreBooster: Let's boost your credit score!";
        }
      };
    }
  }

  // 4. Citibankdemobusinessinc.insuranceProducts.riskAssessor
  export namespace insuranceProducts {
    export namespace riskAssessor {
      // Mission: Provide personalized insurance recommendations based on comprehensive risk assessments.
      // Monetization: Commissions from insurance product sales, premium risk assessment reports.
      // IP Moat: Proprietary risk modeling algorithms and personalized insurance recommendation engine.

      interface RiskProfile {
        age: number;
        location: string;
        assets: number;
        healthConditions: number;
      }

      const generateRiskProfile = (): RiskProfile => ({
        age: Math.floor(Math.random() * 60) + 20,
        location: "Anytown, USA",
        assets: Math.floor(Math.random() * 500000) + 100000,
        healthConditions: Math.floor(Math.random() * 3),
      });

      const assessRisk = (profile: RiskProfile): string => {
        let riskLevel = "Moderate";
        if (profile.age > 60 || profile.healthConditions > 1) {
          riskLevel = "High";
        } else if (profile.assets > 300000) {
          riskLevel = "Low";
        }

        return `Based on your profile, your risk level is ${riskLevel}. Consider comprehensive insurance coverage.`;
      };

      export const RiskAssessorApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const riskProfile = generateRiskProfile();

        if (message.toLowerCase().includes("risk assessment")) {
          return assessRisk(riskProfile);
        } else {
          return "RiskAssessor: Get a personalized risk assessment for your insurance needs.";
        }
      };
    }
  }

  // 5. Citibankdemobusinessinc.realEstate.propertyValuator
  export namespace realEstate {
    export namespace propertyValuator {
      // Mission: Provide accurate and reliable property valuations using advanced data analytics.
      // Monetization: Fees for property valuation reports, premium market analysis tools.
      // IP Moat: Proprietary valuation algorithms and real-time market data integration.

      interface PropertyDetails {
        location: string;
        size: number;
        bedrooms: number;
        bathrooms: number;
        condition: 'poor' | 'fair' | 'good' | 'excellent';
      }

      const generatePropertyDetails = (): PropertyDetails => {
        const conditions = ['poor', 'fair', 'good', 'excellent'];
        return {
          location: "Anytown, USA",
          size: Math.floor(Math.random() * 2000) + 1000,
          bedrooms: Math.floor(Math.random() * 4) + 1,
          bathrooms: Math.floor(Math.random() * 3) + 1,
          condition: conditions[Math.floor(Math.random() * conditions.length)] as 'poor' | 'fair' | 'good' | 'excellent',
        };
      };

      const evaluateProperty = (details: PropertyDetails): string => {
        let baseValue = details.size * 150;
        if (details.bedrooms > 3) baseValue += 20000;
        if (details.bathrooms > 2) baseValue += 15000;

        switch (details.condition) {
          case 'poor': baseValue *= 0.7; break;
          case 'fair': baseValue *= 0.85; break;
          case 'excellent': baseValue *= 1.2; break;
        }

        return `Based on the details provided, the estimated property value is $${Math.floor(baseValue)}.`;
      };

      export const PropertyValuatorApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const propertyDetails = generatePropertyDetails();

        if (message.toLowerCase().includes("property valuation")) {
          return evaluateProperty(propertyDetails);
        } else {
          return "PropertyValuator: Get an instant property valuation.";
        }
      };
    }
  }

  // 6. Citibankdemobusinessinc.taxOptimization.taxAssistant
  export namespace taxOptimization {
    export namespace taxAssistant {
      // Mission: Help users optimize their tax strategies and maximize their returns.
      // Monetization: Subscription fees for tax planning tools, premium tax advice services.
      // IP Moat: Proprietary tax optimization algorithms and personalized tax planning engine.

      interface TaxProfile {
        income: number;
        deductions: number;
        credits: number;
      }

      const generateTaxProfile = (): TaxProfile => ({
        income: Math.floor(Math.random() * 80000) + 30000,
        deductions: Math.floor(Math.random() * 10000) + 2000,
        credits: Math.floor(Math.random() * 3000) + 500,
      });

      const calculateTaxLiability = (profile: TaxProfile): string => {
        const taxableIncome = profile.income - profile.deductions;
        let taxLiability = taxableIncome * 0.25; // Simplified tax calculation
        taxLiability -= profile.credits;

        return `Based on your profile, your estimated tax liability is $${Math.max(0, Math.floor(taxLiability))}.`;
      };

      export const TaxAssistantApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const taxProfile = generateTaxProfile();

        if (message.toLowerCase().includes("tax liability")) {
          return calculateTaxLiability(taxProfile);
        } else {
          return "TaxAssistant: Let's optimize your tax strategy.";
        }
      };
    }
  }

  // 7. Citibankdemobusinessinc.retirementPlanning.retirementAdvisor
  export namespace retirementPlanning {
    export namespace retirementAdvisor {
      // Mission: Help users plan for a secure and comfortable retirement.
      // Monetization: Management fees for retirement accounts, premium retirement planning services.
      // IP Moat: Proprietary retirement planning algorithms and personalized retirement projection engine.

      interface RetirementProfile {
        age: number;
        currentSavings: number;
        annualContribution: number;
        retirementAge: number;
      }

      const generateRetirementProfile = (): RetirementProfile => ({
        age: Math.floor(Math.random() * 40) + 25,
        currentSavings: Math.floor(Math.random() * 100000) + 10000,
        annualContribution: Math.floor(Math.random() * 15000) + 3000,
        retirementAge: 65,
      });

      const projectRetirementSavings = (profile: RetirementProfile): string => {
        const yearsToRetirement = profile.retirementAge - profile.age;
        let projectedSavings = profile.currentSavings;

        for (let i = 0; i < yearsToRetirement; i++) {
          projectedSavings += profile.annualContribution;
          projectedSavings *= 1.07; // Assume 7% annual return
        }

        return `Based on your profile, your projected retirement savings at age ${profile.retirementAge} is $${Math.floor(projectedSavings)}.`;
      };

      export const RetirementAdvisorApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const retirementProfile = generateRetirementProfile();

        if (message.toLowerCase().includes("retirement projection")) {
          return projectRetirementSavings(retirementProfile);
        } else {
          return "RetirementAdvisor: Let's plan for your secure retirement.";
        }
      };
    }
  }

  // 8. Citibankdemobusinessinc.estatePlanning.estatePlanner
  export namespace estatePlanning {
    export namespace estatePlanner {
      // Mission: Help users plan for the efficient transfer of their assets to future generations.
      // Monetization: Fees for estate planning documents, premium estate planning services.
      // IP Moat: Proprietary estate planning templates and personalized estate planning engine.

      interface EstateProfile {
        assets: number;
        beneficiaries: number;
        willExists: boolean;
      }

      const generateEstateProfile = (): EstateProfile => ({
        assets: Math.floor(Math.random() * 1000000) + 200000,
        beneficiaries: Math.floor(Math.random() * 5) + 1,
        willExists: Math.random() > 0.5,
      });

      const assessEstatePlan = (profile: EstateProfile): string => {
        let recommendation = "Based on your profile, we recommend: ";

        if (!profile.willExists) {
          recommendation += "Creating a will to ensure your assets are distributed according to your wishes.";
        } else {
          recommendation += "Reviewing your existing will to ensure it still meets your needs.";
        }

        if (profile.assets > 500000) {
          recommendation += " Consider establishing a trust to minimize estate taxes.";
        }

        return recommendation;
      };

      export const EstatePlannerApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const estateProfile = generateEstateProfile();

        if (message.toLowerCase().includes("estate planning advice")) {
          return assessEstatePlan(estateProfile);
        } else {
          return "EstatePlanner: Let's plan for the future of your assets.";
        }
      };
    }
  }

  // 9. Citibankdemobusinessinc.studentLoans.loanRefinancer
  export namespace studentLoans {
    export namespace loanRefinancer {
      // Mission: Help users refinance their student loans to lower interest rates and monthly payments.
      // Monetization: Commissions from loan refinancing, premium loan analysis services.
      // IP Moat: Proprietary loan analysis algorithms and personalized refinancing recommendation engine.

      interface LoanProfile {
        loanBalance: number;
        interestRate: number;
        loanTerm: number;
        creditScore: number;
      }

      const generateLoanProfile = (): LoanProfile => ({
        loanBalance: Math.floor(Math.random() * 80000) + 20000,
        interestRate: Math.random() * 0.08 + 0.03,
        loanTerm: Math.floor(Math.random() * 10) + 5,
        creditScore: Math.floor(Math.random() * 300) + 650,
      });

      const analyzeRefinancingOptions = (profile: LoanProfile): string => {
        let potentialSavings = profile.loanBalance * (profile.interestRate - 0.05) * profile.loanTerm; // Simplified calculation
        return `Based on your profile, you could potentially save $${Math.floor(potentialSavings)} by refinancing your student loans.`;
      };

      export const LoanRefinancerApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const loanProfile = generateLoanProfile();

        if (message.toLowerCase().includes("refinancing options")) {
          return analyzeRefinancingOptions(loanProfile);
        } else {
          return "LoanRefinancer: Let's explore your student loan refinancing options.";
        }
      };
    }
  }

  // 10. Citibankdemobusinessinc.financialEducation.financeTutor
  export namespace financialEducation {
    export namespace financeTutor {
      // Mission: Provide accessible and engaging financial education to users of all ages.
      // Monetization: Subscription fees for premium courses, personalized financial coaching.
      // IP Moat: Proprietary financial education content and personalized learning paths.

      interface UserProfile {
        age: number;
        financialKnowledge: 'beginner' | 'intermediate' | 'advanced';
        learningGoals: string[];
      }

      const generateUserProfile = (): UserProfile => {
        const knowledgeLevels = ['beginner', 'intermediate', 'advanced'];
        return {
          age: Math.floor(Math.random() * 50) + 18,
          financialKnowledge: knowledgeLevels[Math.floor(Math.random() * knowledgeLevels.length)] as 'beginner' | 'intermediate' | 'advanced',
          learningGoals: ["Budgeting", "Investing", "Saving"],
        };
      };

      const recommendLearningPath = (profile: UserProfile): string => {
        let recommendation = "Based on your profile, we recommend: ";

        if (profile.financialKnowledge === 'beginner') {
          recommendation += "Starting with our introductory course on budgeting and saving.";
        } else if (profile.financialKnowledge === 'intermediate') {
          recommendation += "Exploring our course on investing and retirement planning.";
        } else {
          recommendation += "Diving into advanced topics such as tax optimization and estate planning.";
        }

        return recommendation;
      };

      export const FinanceTutorApp = async (message: string): Promise<string> => {
        await Kernel.simulateLatency(500, 1000);
        const userProfile = generateUserProfile();

        if (message.toLowerCase().includes("learning path")) {
          return recommendLearningPath(userProfile);
        } else {
          return "FinanceTutor: Let's start your financial education journey.";
        }
      };
    }
  }

  // Unified Orchestration Layer
  export const orchestrate = async (message: string): Promise<string> => {
    if (message.startsWith("BudgetBuddy:")) {
      return personalFinance.budgetBuddy.BudgetBuddyApp(message.substring("BudgetBuddy:".length).trim());
    } else if (message.startsWith("RoboAdvisor:")) {
      return investmentInsights.roboAdvisor.RoboAdvisorApp(message.substring("RoboAdvisor:".length).trim());
    } else if (message.startsWith("CreditScoreBooster:")) {
      return creditSolutions.creditScoreBooster.CreditScoreBoosterApp(message.substring("CreditScoreBooster:".length).trim());
    } else if (message.startsWith("RiskAssessor:")) {
      return insuranceProducts.riskAssessor.RiskAssessorApp(message.substring("RiskAssessor:".length).trim());
    } else if (message.startsWith("PropertyValuator:")) {
      return realEstate.propertyValuator.PropertyValuatorApp(message.substring("PropertyValuator:".length).trim());
    } else if (message.startsWith("TaxAssistant:")) {
      return taxOptimization.taxAssistant.TaxAssistantApp(message.substring("TaxAssistant:".length).trim());
    } else if (message.startsWith("RetirementAdvisor:")) {
      return retirementPlanning.retirementAdvisor.RetirementAdvisorApp(message.substring("RetirementAdvisor:".length).trim());
    } else if (message.startsWith("EstatePlanner:")) {
      return estatePlanning.estatePlanner.EstatePlannerApp(message.substring("EstatePlanner:".length).trim());
    } else if (message.startsWith("LoanRefinancer:")) {
      return studentLoans.loanRefinancer.LoanRefinancerApp(message.substring("LoanRefinancer:".length).trim());
    } else if (message.startsWith("FinanceTutor:")) {
      return financialEducation.financeTutor.FinanceTutorApp(message.substring("FinanceTutor:".length).trim());
    } else {
      return "Citibankdemobusinessinc: How can I assist you with your financial needs?";
    }
  };
}

// Mock API for demonstration purposes
const mockApiCall = async (message: string): Promise<{ response: string }> => {
  await Citibankdemobusinessinc.Kernel.simulateLatency(300, 800);
  const response = await Citibankdemobusinessinc.orchestrate(message);
  return { response };
};

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '70vh', // Adjust height as needed
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

const MessagesArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const MessageBubble = styled(Box)<{ isUser?: boolean }>(({ theme, isUser }) => ({
  display: 'inline-block',
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  maxWidth: '80%',
  wordWrap: 'break-word',
  textAlign: isUser ? 'right' : 'left',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.action.hover,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  marginLeft: isUser ? 'auto' : 0,
  marginRight: isUser ? 0 : 'auto',
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.default,
}));

const StyledTextField = styled(TextField)({
  flexGrow: 1,
  marginRight: '8px',
});


const CoPilotChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Citibankdemobusinessinc.Kernel.Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const newUserMessage: Citibankdemobusinessinc.Kernel.Message = { text: inputValue, isUser: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await mockApiCall(inputValue);
      const aiMessage: Citibankdemobusinessinc.Kernel.Message = { text: response.response, isUser: false };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Citibankdemobusinessinc.Kernel.Message = { text: 'Sorry, I encountered an error. Please try again.', isUser: false };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <MessagesArea>
        {messages.map((message, index) => (
          <MessageBubble key={index} isUser={message.isUser}>
            <Typography variant="body1">{message.text}</Typography>
          </MessageBubble>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </MessagesArea>
      <InputArea>
        <StyledTextField
          placeholder="Ask your financial questions..."
          variant="outlined"
          fullWidth
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <IconButton
          color="primary"
          aria-label="send message"
          onClick={handleSendMessage}
          disabled={isLoading || inputValue.trim() === ''}
        >
          <SendIcon />
        </IconButton>
      </InputArea>
    </ChatContainer>
  );
};

export default CoPilotChatInterface;