import { UserProfile, DailyStats, Meal, Task, AppView, Gender, ActivityLevel } from '../types';

const STORAGE_KEY = 'SS_TRACKER_DB_V1';

export interface AppData {
  userProfile: UserProfile;
  dailyStats: DailyStats;
  meals: Meal[];
  tasks: Task[];
  view: AppView;
  isLoggedIn: boolean;
}

export const DEFAULT_DATA: AppData = {
  userProfile: {
    name: 'Guest User',
    age: 25,
    height: 175,
    weight: 70,
    gender: Gender.Male,
    activityLevel: ActivityLevel.ModeratelyActive,
    bmi: 22.9,
    bmr: 1600,
    dailyCalories: 2200
  },
  dailyStats: {
    steps: 6500,
    stepsGoal: 10000,
    waterIntake: 4,
    waterGoal: 8,
    caloriesBurned: 450,
    caloriesConsumed: 0,
    sleepHours: 7.2,
    activeMinutes: 45
  },
  meals: [
    { id: '1', name: 'Oatmeal & Berries', calories: 350, protein: 12, time: '08:00 AM' },
    { id: '2', name: 'Grilled Chicken Salad', calories: 450, protein: 40, time: '12:30 PM' }
  ],
  tasks: [
    { id: '1', text: 'Drink 500ml Water', completed: false, xp: 50 },
    { id: '2', text: 'Walk 2000 steps', completed: false, xp: 100 },
    { id: '3', text: 'Stretching 5 min', completed: false, xp: 50 },
    { id: '4', text: 'No sugar for 6 hours', completed: false, xp: 75 }
  ],
  view: AppView.Auth,
  isLoggedIn: false
};

export const loadAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge basic objects to ensure structure integrity
      return { 
        ...DEFAULT_DATA, 
        ...parsed, 
        userProfile: { ...DEFAULT_DATA.userProfile, ...parsed.userProfile },
        dailyStats: { ...DEFAULT_DATA.dailyStats, ...parsed.dailyStats }
      };
    }
  } catch (error) {
    console.error('Error loading data from local storage:', error);
  }
  return DEFAULT_DATA;
};

export const saveAppData = (data: Partial<AppData>) => {
  try {
    // We load current data first to ensure we don't overwrite missing keys if we are saving partial data
    // However, for React state syncing, it's often safer to merge in the component or pass full objects.
    // Here we assume 'data' contains the updated chunks.
    const current = loadAppData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving data to local storage:', error);
  }
};

export const clearAppData = () => {
  localStorage.removeItem(STORAGE_KEY);
};