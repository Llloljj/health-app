export enum Gender {
  Male = 'Male',
  Female = 'Female',
  Other = 'Other'
}

export enum ActivityLevel {
  Sedentary = 'Sedentary', // Little or no exercise
  LightlyActive = 'Lightly Active', // Light exercise 1-3 days/week
  ModeratelyActive = 'Moderately Active', // Moderate exercise 3-5 days/week
  VeryActive = 'Very Active', // Hard exercise 6-7 days/week
  SuperActive = 'Super Active' // Very hard exercise & physical job
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  activityLevel: ActivityLevel;
  bmi: number;
  bmr: number;
  dailyCalories: number;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  time: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  xp: number;
}

export interface DailyStats {
  steps: number;
  stepsGoal: number;
  waterIntake: number; // glasses (250ml)
  waterGoal: number;
  caloriesBurned: number;
  caloriesConsumed: number;
  sleepHours: number;
  activeMinutes: number;
}

export interface AIAdvice {
  nutrition: string[];
  workout: string[];
  motivation: string;
  type: 'General' | 'Recovery';
}

export enum AppView {
  Auth = 'AUTH',
  Onboarding = 'ONBOARDING',
  Dashboard = 'DASHBOARD',
  Analytics = 'ANALYTICS',
  Nutrition = 'NUTRITION',
  Settings = 'SETTINGS'
}