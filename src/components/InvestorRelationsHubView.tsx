import React, { useState, useEffect } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// Unified Brand Name
const brandName = "Citibankdemobusinessinc";

// --- Shared Kernel ---
// This section contains utilities and functions shared across all business models.

// Data Generation Utility
const generateRandomData = (count: number, baseValue: number, variance: number) => {
  const data = [];
  let currentValue = baseValue;
  for (let i = 0; i < count; i++) {
    currentValue += (Math.random() - 0.5) * variance;
    data.push({ date: subDays(new Date(), count - i), value: currentValue });
  }
  return data;
};

// Financial Statement Generator (Simplified)
const generateFinancialStatement = () => {
  return {
    revenue: Math.floor(Math.random() * 1000000),
    expenses: Math.floor(Math.random() * 500000),
    netIncome: Math.floor(Math.random() * 500000),
  };
};

// Risk Assessment Utility
const assessRisk = (probability: number, impact: number) => {
  const riskScore = probability * impact;
  let riskLevel = "Low";
  if (riskScore > 0.7) riskLevel = "High";
  else if (riskScore > 0.3) riskLevel = "Medium";
  return { riskScore, riskLevel };
};

// Compliance Check Utility (Placeholder)
const checkCompliance = (regulation: string) => {
  // In a real application, this would check against specific regulatory requirements.
  return Math.random() > 0.1; // Simulate compliance status
};

// --- End Shared Kernel ---

// --- Citibankdemobusinessinc.viewit.movieplayform ---
namespace Citibankdemobusinessinc.viewit {
  export namespace movieplayform {
    // Mission: Revolutionize movie streaming through AI-driven personalization and community engagement.
    // Monetization: Subscription fees, targeted advertising, premium content rentals.
    // IP Moat: Proprietary AI algorithms for content recommendation and user engagement.

    // Generative Data Functions
    const generateMovieData = () => {
      return {
        title: `Movie ${Math.floor(Math.random() * 100)}`,
        genre: ['Action', 'Comedy', 'Drama'][Math.floor(Math.random() * 3)],
        rating: Math.random() * 5,
      };
    };

    // Self-Contained App Logic
    export const MoviePlayformApp = () => {
      const [movies, setMovies] = useState(Array(10).fill(null).map(generateMovieData));

      return (
        <div>
          <h2>{brandName}.viewit.movieplayform</h2>
          <p>Mission: Revolutionize movie streaming through AI-driven personalization and community engagement.</p>
          <ul>
            {movies.map((movie, index) => (
              <li key={index}>
                {movie.title} - {movie.genre} (Rating: {movie.rating.toFixed(1)})
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.invest.roboadvisor ---
namespace Citibankdemobusinessinc.invest {
  export namespace roboadvisor {
    // Mission: Democratize wealth management through AI-powered personalized investment strategies.
    // Monetization: Management fees based on assets under management, premium advisory services.
    // IP Moat: Algorithmic trading strategies and risk assessment models.

    // Generative Data Functions
    const generatePortfolioData = () => {
      return {
        assetType: ['Stocks', 'Bonds', 'Real Estate'][Math.floor(Math.random() * 3)],
        allocation: Math.random(),
      };
    };

    // Self-Contained App Logic
    export const RoboAdvisorApp = () => {
      const [portfolio, setPortfolio] = useState(Array(5).fill(null).map(generatePortfolioData));
      const financialStatement = generateFinancialStatement();
      const riskAssessment = assessRisk(0.4, 0.6);

      return (
        <div>
          <h2>{brandName}.invest.roboadvisor</h2>
          <p>Mission: Democratize wealth management through AI-powered personalized investment strategies.</p>
          <h3>Portfolio Allocation</h3>
          <ul>
            {portfolio.map((asset, index) => (
              <li key={index}>
                {asset.assetType} - {(asset.allocation * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
          <h3>Financial Snapshot</h3>
          <p>Revenue: ${financialStatement.revenue}</p>
          <p>Expenses: ${financialStatement.expenses}</p>
          <p>Net Income: ${financialStatement.netIncome}</p>
           <h3>Risk Assessment</h3>
          <p>Risk Score: {riskAssessment.riskScore.toFixed(2)}</p>
          <p>Risk Level: {riskAssessment.riskLevel}</p>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.health.telemedicine ---
namespace Citibankdemobusinessinc.health {
  export namespace telemedicine {
    // Mission: Provide accessible and affordable healthcare through virtual consultations and remote monitoring.
    // Monetization: Consultation fees, subscription plans, partnerships with healthcare providers.
    // IP Moat: Secure telehealth platform and AI-driven diagnostic tools.

    // Generative Data Functions
    const generatePatientData = () => {
      return {
        name: `Patient ${Math.floor(Math.random() * 100)}`,
        condition: ['Cold', 'Flu', 'Headache'][Math.floor(Math.random() * 3)],
      };
    };

    // Self-Contained App Logic
    export const TelemedicineApp = () => {
      const [patients, setPatients] = useState(Array(5).fill(null).map(generatePatientData));
      const isCompliant = checkCompliance("HIPAA");

      return (
        <div>
          <h2>{brandName}.health.telemedicine</h2>
          <p>Mission: Provide accessible and affordable healthcare through virtual consultations and remote monitoring.</p>
          <h3>Patient List</h3>
          <ul>
            {patients.map((patient, index) => (
              <li key={index}>
                {patient.name} - Condition: {patient.condition}
              </li>
            ))}
          </ul>
          <h3>Compliance Status</h3>
          <p>HIPAA Compliant: {isCompliant ? "Yes" : "No"}</p>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.edu.onlinelearning ---
namespace Citibankdemobusinessinc.edu {
  export namespace onlinelearning {
    // Mission: Transform education through personalized online learning experiences and skill development.
    // Monetization: Course fees, subscription models, corporate training programs.
    // IP Moat: Adaptive learning algorithms and exclusive content partnerships.

    // Generative Data Functions
    const generateCourseData = () => {
      return {
        title: `Course ${Math.floor(Math.random() * 100)}`,
        subject: ['Math', 'Science', 'History'][Math.floor(Math.random() * 3)],
      };
    };

    // Self-Contained App Logic
    export const OnlineLearningApp = () => {
      const [courses, setCourses] = useState(Array(5).fill(null).map(generateCourseData));

      return (
        <div>
          <h2>{brandName}.edu.onlinelearning</h2>
          <p>Mission: Transform education through personalized online learning experiences and skill development.</p>
          <h3>Available Courses</h3>
          <ul>
            {courses.map((course, index) => (
              <li key={index}>
                {course.title} - Subject: {course.subject}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.retail.ecommerce ---
namespace Citibankdemobusinessinc.retail {
  export namespace ecommerce {
    // Mission: Redefine online shopping through personalized experiences and sustainable practices.
    // Monetization: Product sales, marketplace fees, premium subscriptions.
    // IP Moat: AI-driven product recommendation engine and supply chain optimization.

    // Generative Data Functions
    const generateProductData = () => {
      return {
        name: `Product ${Math.floor(Math.random() * 100)}`,
        category: ['Electronics', 'Clothing', 'Home'][Math.floor(Math.random() * 3)],
        price: Math.random() * 100,
      };
    };

    // Self-Contained App Logic
    export const EcommerceApp = () => {
      const [products, setProducts] = useState(Array(5).fill(null).map(generateProductData));

      return (
        <div>
          <h2>{brandName}.retail.ecommerce</h2>
          <p>Mission: Redefine online shopping through personalized experiences and sustainable practices.</p>
          <h3>Featured Products</h3>
          <ul>
            {products.map((product, index) => (
              <li key={index}>
                {product.name} - Category: {product.category} - Price: ${product.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.realestate.proptech ---
namespace Citibankdemobusinessinc.realestate {
  export namespace proptech {
    // Mission: Innovate real estate through AI-powered property management and investment tools.
    // Monetization: Property management fees, transaction fees, investment advisory services.
    // IP Moat: Predictive analytics for property valuation and tenant screening.

    // Generative Data Functions
    const generatePropertyData = () => {
      return {
        address: `Address ${Math.floor(Math.random() * 100)}`,
        type: ['House', 'Apartment', 'Condo'][Math.floor(Math.random() * 3)],
        price: Math.random() * 1000000,
      };
    };

    // Self-Contained App Logic
    export const PropTechApp = () => {
      const [properties, setProperties] = useState(Array(5).fill(null).map(generatePropertyData));

      return (
        <div>
          <h2>{brandName}.realestate.proptech</h2>
          <p>Mission: Innovate real estate through AI-powered property management and investment tools.</p>
          <h3>Featured Properties</h3>
          <ul>
            {properties.map((property, index) => (
              <li key={index}>
                {property.address} - Type: {property.type} - Price: ${property.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.transport.mobilitysolutions ---
namespace Citibankdemobusinessinc.transport {
  export namespace mobilitysolutions {
    // Mission: Transform urban mobility through sustainable and efficient transportation solutions.
    // Monetization: Ride-sharing fees, subscription services, partnerships with cities.
    // IP Moat: AI-driven route optimization and autonomous vehicle technology.

    // Generative Data Functions
    const generateRideData = () => {
      return {
        start: `Start ${Math.floor(Math.random() * 100)}`,
        end: `End ${Math.floor(Math.random() * 100)}`,
        price: Math.random() * 50,
      };
    };

    // Self-Contained App Logic
    export const MobilitySolutionsApp = () => {
      const [rides, setRides] = useState(Array(5).fill(null).map(generateRideData));

      return (
        <div>
          <h2>{brandName}.transport.mobilitysolutions</h2>
          <p>Mission: Transform urban mobility through sustainable and efficient transportation solutions.</p>
          <h3>Recent Rides</h3>
          <ul>
            {rides.map((ride, index) => (
              <li key={index}>
                From: {ride.start} - To: {ride.end} - Price: ${ride.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.energy.cleantech ---
namespace Citibankdemobusinessinc.energy {
  export namespace cleantech {
    // Mission: Accelerate the transition to clean energy through innovative technologies and sustainable practices.
    // Monetization: Energy sales, carbon credits, consulting services.
    // IP Moat: Advanced energy storage solutions and smart grid technology.

    // Generative Data Functions
    const generateEnergyData = () => {
      return {
        type: ['Solar', 'Wind', 'Hydro'][Math.floor(Math.random() * 3)],
        output: Math.random() * 1000,
      };
    };

    // Self-Contained App Logic
    export const CleanTechApp = () => {
      const [energySources, setEnergySources] = useState(Array(5).fill(null).map(generateEnergyData));

      return (
        <div>
          <h2>{brandName}.energy.cleantech</h2>
          <p>Mission: Accelerate the transition to clean energy through innovative technologies and sustainable practices.</p>
          <h3>Energy Output</h3>
          <ul>
            {energySources.map((energy, index) => (
              <li key={index}>
                Type: {energy.type} - Output: {energy.output.toFixed(2)} kWh
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.fintech.paymentprocessing ---
namespace Citibankdemobusinessinc.fintech {
  export namespace paymentprocessing {
    // Mission: Revolutionize payment processing through secure and efficient technology solutions.
    // Monetization: Transaction fees, subscription services, data analytics.
    // IP Moat: Fraud detection algorithms and blockchain-based payment systems.

    // Generative Data Functions
    const generateTransactionData = () => {
      return {
        amount: Math.random() * 100,
        status: ['Success', 'Failed'][Math.floor(Math.random() * 2)],
      };
    };

    // Self-Contained App Logic
    export const PaymentProcessingApp = () => {
      const [transactions, setTransactions] = useState(Array(5).fill(null).map(generateTransactionData));

      return (
        <div>
          <h2>{brandName}.fintech.paymentprocessing</h2>
          <p>Mission: Revolutionize payment processing through secure and efficient technology solutions.</p>
          <h3>Recent Transactions</h3>
          <ul>
            {transactions.map((transaction, index) => (
              <li key={index}>
                Amount: ${transaction.amount.toFixed(2)} - Status: {transaction.status}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// --- Citibankdemobusinessinc.agtech.farminginnovation ---
namespace Citibankdemobusinessinc.agtech {
  export namespace farminginnovation {
    // Mission: Enhance agricultural productivity through data-driven insights and sustainable farming practices.
    // Monetization: Data analytics services, precision farming tools, crop yield optimization.
    // IP Moat: AI-driven crop monitoring and predictive analytics for farming.

    // Generative Data Functions
    const generateCropData = () => {
      return {
        type: ['Corn', 'Wheat', 'Soybean'][Math.floor(Math.random() * 3)],
        yield: Math.random() * 100,
      };
    };

    // Self-Contained App Logic
    export const FarmingInnovationApp = () => {
      const [crops, setCrops] = useState(Array(5).fill(null).map(generateCropData));

      return (
        <div>
          <h2>{brandName}.agtech.farminginnovation</h2>
          <p>Mission: Enhance agricultural productivity through data-driven insights and sustainable farming practices.</p>
          <h3>Crop Yields</h3>
          <ul>
            {crops.map((crop, index) => (
              <li key={index}>
                Type: {crop.type} - Yield: {crop.yield.toFixed(2)} tons
              </li>
            ))}
          </ul>
        </div>
      );
    };
  }
}

// Mock data and functions for demonstration purposes
// In a real application, these would come from an API or state management
const mockStockData = [
  { date: new Date(Date.now() - 86400000 * 30), value: 150 },
  { date: new Date(Date.now() - 86400000 * 20), value: 155 },
  { date: new Date(Date.now() - 86400000 * 10), value: 160 },
  { date: new Date(), value: 162 },
];

const mockIndexData = {
  sp500: [
    { date: new Date(Date.now() - 86400000 * 30), value: 4000 },
    { date: new Date(Date.now() - 86400000 * 20), value: 4050 },
    { date: new Date(Date.now() - 86400000 * 10), value: 4100 },
    { date: new Date(), value: 4120 },
  ],
  nasdaq: [
    { date: new Date(Date.now() - 86400000 * 30), value: 12000 },
    { date: new Date(Date.now() - 86400000 * 20), value: 12100 },
    { date: new Date.Date.now() - 86400000 * 10, value: 12200 },
    { date: new Date(), value: 12250 },
  ],
};

const mockPressReleases = [
  { id: 'pr1', title: 'Q1 Earnings Report', date: '2023-04-15', content: 'Our Q1 earnings were strong...', status: 'Published' },
  { id: 'pr2', title: 'New Product Launch', date: '2023-05-01', content: 'Announcing our latest innovation...', status: 'Draft' },
];

const mockSecFilings = [
  { id: 'sec1', form: '10-K', date: '2023-03-01', description: 'Annual Report', status: 'Filed' },
  { id: 'sec2', form: '8-K', date: '2023-04-20', description: 'Material Event Disclosure', status: 'Filed' },
];

const mockCalendarEvents = [
  { id: 'evt1', title: 'Q2 Earnings Call', date: new Date(2023, 6, 20, 10, 0, 0), type: 'Earnings Call' },
  { id: 'evt2', title: 'Investor Conference', date: new Date(2023, 7, 10), type: 'Conference' },
];

const mockInvestors = [
  { id: 'inv1', name: 'Alpha Investments', contact: 'john.doe@alpha.com', type: 'Institutional' },
  { id: 'inv2', name: 'Beta Fund', contact: 'jane.smith@beta.com', type: 'Institutional' },
  { id: 'inv3', name: 'Gamma Research', contact: 'analyst@gamma.com', type: 'Analyst' },
];

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

const InvestorRelationsHubView: React.FC = () => {
  const [stockChartInstance, setStockChartInstance] = useState<Chart | null>(null);
  const chartRef = React.useRef<HTMLCanvasElement>(null);

  const [pressReleaseContent, setPressReleaseContent] = useState('');
  const [pressReleases, setPressReleases] = useState(mockPressReleases);
  const [selectedPressRelease, setSelectedPressRelease] = useState<typeof mockPressReleases[0] | null>(null);

  const [secFilingForm, setSecFilingForm] = useState('');
  const [secFilingDescription, setSecFilingDescription] = useState('');
  const [secFilings, setSecFilings] = useState(mockSecFilings);

  const [calendarEvents, setCalendarEvents] = useState(mockCalendarEvents);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState<Date>(new Date());
  const [newEventDateError, setNewEventDateError] = useState('');

  const [investors, setInvestors] = useState(mockInvestors);
  const [newInvestorName, setNewInvestorName] = useState('');
  const [newInvestorContact, setNewInvestorContact] = useState('');
  const [newInvestorType, setNewInvestorType] = useState('Institutional');

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        const newChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: mockStockData.map(d => d.date),
            datasets: [
              {
                label: 'Stock Performance',
                data: mockStockData.map(d => d.value),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
              },
              {
                label: 'S&P 500',
                data: mockIndexData.sp500.map(d => d.value),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
                fill: false,
              },
              {
                label: 'Nasdaq',
                data: mockIndexData.nasdaq.map(d => d.value),
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'day',
                  tooltipFormat: 'PPpp',
                  displayFormats: {
                    day: 'MMM d',
                  },
                },
                title: {
                  display: true,
                  text: 'Date',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Value',
                },
              },
            },
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
              },
              legend: {
                position: 'top',
              },
            },
          },
        });
        setStockChartInstance(newChart);
      }
    }

    return () => {
      if (stockChartInstance) {
        stockChartInstance.destroy();
      }
    };
  }, []);

  const handleSavePressRelease = () => {
    if (selectedPressRelease) {
      setPressReleases(pressReleases.map(pr =>
        pr.id === selectedPressRelease.id ? { ...pr, content: pressReleaseContent } : pr
      ));
      setSelectedPressRelease(null);
      setPressReleaseContent('');
    } else {
      const newId = `pr${pressReleases.length + 1}`;
      setPressReleases([...pressReleases, { id: newId, title: 'New Press Release', date: format(new Date(), 'yyyy-MM-dd'), content: pressReleaseContent, status: 'Draft' }]);
      setPressReleaseContent('');
    }
  };

  const handleEditPressRelease = (pr: typeof mockPressReleases[0]) => {
    setSelectedPressRelease(pr);
    setPressReleaseContent(pr.content);
  };

  const handlePublishPressRelease = (id: string) => {
    setPressReleases(pressReleases.map(pr =>
      pr.id === id ? { ...pr, status: 'Published' } : pr
    ));
  };

  const handleSaveSecFiling = () => {
    const newId = `sec${secFilings.length + 1}`;
    setSecFilings([...secFilings, { id: newId, form: secFilingForm, date: format(new Date(), 'yyyy-MM-dd'), description: secFilingDescription, status: 'Draft' }]);
    setSecFilingForm('');
    setSecFilingDescription('');
  };

  const handleFileSecFiling = (id: string) => {
    setSecFilings(secFilings.map(sf =>
      sf.id === id ? { ...sf, status: 'Filed' } : sf
    ));
  };

  const handleAddCalendarEvent = () => {
    if (!newEventTitle || !newEventDate) {
      if (!newEventTitle) alert('Event title is required.');
      if (!newEventDate) alert('Event date is required.');
      return;
    }
    const newId = `evt${calendarEvents.length + 1}`;
    setCalendarEvents([...calendarEvents, { id: newId, title: newEventTitle, date: newEventDate, type: 'Other' }]);
    setNewEventTitle('');
    setNewEventDate(new Date());
  };

  const handleAddInvestor = () => {
    if (!newInvestorName || !newInvestorContact) {
      if (!newInvestorName) alert('Investor name is required.');
      if (!newInvestorContact) alert('Investor contact is required.');
      return;
    }
    const newId = `inv${investors.length + 1}`;
    setInvestors([...investors, { id: newId, name: newInvestorName, contact: newInvestorContact, type: newInvestorType }]);
    setNewInvestorName('');
    setNewInvestorContact('');
    setNewInvestorType('Institutional');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = new Date(e.target.value);
    if (isNaN(dateValue.getTime())) {
      setNewEventDateError('Invalid date format');
      setNewEventDate(new Date()); // Reset to a valid date
    } else {
      setNewEventDateError('');
      setNewEventDate(dateValue);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">{brandName} Investor Relations Hub</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Stock Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Stock Performance</h2>
          <div className="h-80">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Press Releases & SEC Filings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Announcements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-medium mb-3 text-gray-600">Press Releases</h3>
              <div className="space-y-3">
                {pressReleases.map(pr => (
                  <div key={pr.id} className="border p-3 rounded-md">
                    <p className="font-medium">{pr.title}</p>
                    <p className="text-sm text-gray-500">{pr.date} - {pr.status}</p>
                    <button onClick={() => handleEditPressRelease(pr)} className="text-blue-500 hover:underline mr-2">Edit</button>
                    {pr.status === 'Draft' && (
                      <button onClick={() => handlePublishPressRelease(pr.id)} className="text-green-500 hover:underline">Publish</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2 text-gray-600">
                  {selectedPressRelease ? `Editing: ${selectedPressRelease.title}` : 'New Press Release'}
                </h4>
                <textarea
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={5}
                  placeholder="Enter press release content..."
                  value={pressReleaseContent}
                  onChange={(e) => setPressReleaseContent(e.target.value)}
                ></textarea>
                <button onClick={handleSavePressRelease} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  {selectedPressRelease ? 'Update Press Release' : 'Save Draft'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3 text-gray-600">SEC Filings</h3>
              <div className="space-y-3">
                {secFilings.map(sf => (
                  <div key={sf.id} className="border p-3 rounded-md">
                    <p className="font-medium">{sf.form} - {sf.description}</p>
                    <p className="text-sm text-gray-500">{sf.date} - {sf.status}</p>
                    {sf.status === 'Draft' && (
                      <button onClick={() => handleFileSecFiling(sf.id)} className="text-green-500 hover:underline">File Now</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2 text-gray-600">New Filing</h4>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Form Type (e.g., 10-K)"
                  value={secFilingForm}
                  onChange={(e) => setSecFilingForm(e.target.value)}
                />
                <textarea
                  className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Description"
                  value={secFilingDescription}
                  onChange={(e) => setSecFilingDescription(e.target.value)}
                ></textarea>
                <button onClick={handleSaveSecFiling} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Save Draft Filing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* IR Calendar */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">IR Calendar</h2>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-600">Add New Event</h3>
            <input
              type="text"
              className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event Title"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
            />
            <input
              type="datetime-local"
              className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
              value={newEventDate.toISOString().slice(0, 16)}
              onChange={handleDateChange}
            />
            {newEventDateError && <p className="text-red-500 text-sm">{newEventDateError}</p>}
            <button onClick={handleAddCalendarEvent} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Event
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {calendarEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map(event => (
              <div key={event.id} className="border p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">{format(event.date, 'PPpp')} - {event.type}</p>
                </div>
                <button className="text-red-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Investor & Analyst Database */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Investor & Analyst Database</h2>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-600">Add New Contact</h3>
            <input
              type="text"
              className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Name"
              value={newInvestorName}
              onChange={(e) => setNewInvestorName(e.target.value)}
            />
            <input
              type="email"
              className