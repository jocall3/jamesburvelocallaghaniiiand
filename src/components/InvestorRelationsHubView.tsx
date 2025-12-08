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
    { date: new Date(Date.Date.now() - 86400000 * 10), value: 12200 },
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
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Investor Relations Hub</h1>

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
              className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contact Email"
              value={newInvestorContact}
              onChange={(e) => setNewInvestorContact(e.target.value)}
            />
            <select
              className="w-full p-2 border rounded-md mb-2 focus:ring-blue-500 focus:border-blue-500"
              value={newInvestorType}
              onChange={(e) => setNewInvestorType(e.target.value)}
            >
              <option value="Institutional">Institutional Investor</option>
              <option value="Analyst">Analyst</option>
              <option value="Retail">Retail Investor</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={handleAddInvestor} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Add Contact
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {investors.map(inv => (
              <div key={inv.id} className="border p-3 rounded-md">
                <p className="font-medium">{inv.name}</p>
                <p className="text-sm text-gray-500">{inv.contact} - {inv.type}</p>
                <button className="text-red-500 hover:underline mr-2">Edit</button>
                <button className="text-red-500 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorRelationsHubView;