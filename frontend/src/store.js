import { create } from 'zustand'

export const useStore = create((set, get) => ({
  activeTab: 'Dashboard',
  selectedDate: '2025-11-05',
  selectedState: 'All',
  selectedDistrict: 'Ambala',
  
  theme: localStorage.getItem('vayu_theme') || 'dark',
  
  // Lists for Dropdowns
  dates: [],
  states: [],
  districts: [],
  
  // Loaded Data caches
  dashboardData: null,
  mapData: null,
  
  loading: false,
  error: null,
  
  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setTheme: (newTheme) => {
    localStorage.setItem('vayu_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    set({ theme: newTheme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  
  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchDashboard();
    get().fetchMapData();
  },
  
  setSelectedState: (state) => {
    set({ selectedState: state });
    get().fetchMapData();
  },
  
  setSelectedDistrict: (district) => {
    set({ selectedDistrict: district });
    get().fetchDashboard();
  },
  
  fetchMetadata: async () => {
    try {
      const res = await fetch('/api/metadata');
      const data = await res.json();
      const availableDates = data.dates || [];
      const latestDate = availableDates.length > 0 ? availableDates[availableDates.length - 1] : '2025-11-05';
      
      set({
        dates: availableDates,
        states: data.states || [],
        districts: data.districts || [],
        selectedDate: latestDate
      });
      
      get().fetchDashboard();
      get().fetchMapData();
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      set({ error: "Failed to load dropdown options from server." });
    }
  },
  
  fetchDashboard: async () => {
    const { selectedDate, selectedDistrict } = get();
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/dashboard?date=${selectedDate}&district=${selectedDistrict}`);
      const data = await res.json();
      set({ dashboardData: data, loading: false });
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      set({ error: "Failed to load dashboard parameters.", loading: false });
    }
  },
  
  fetchMapData: async () => {
    const { selectedDate, selectedState } = get();
    try {
      const res = await fetch(`/api/map-data?date=${selectedDate}&state=${selectedState}`);
      const data = await res.json();
      set({ mapData: data });
    } catch (err) {
      console.error("Failed to fetch map data:", err);
    }
  }
}))
