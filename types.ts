
export interface UserProfile {
  // Basics
  name: string;
  age: string;
  height: string;
  currentWeight: string;
  gender: 'male' | 'female' | 'other';
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'performance';
  
  // Social
  instagram?: string;

  // Profile
  profilePicture: string | null;

  // Photos (We store URLs/Base64 for preview, but effectively just tracking presence for this demo)
  photoFront: string | null;
  photoSide: string | null;
  photoBack: string | null;

  // Detailed Info
  dailyRoutine: string;
  currentDiet: string;
  foodSubstitutions: string;
  foodPreferences: string;
  workoutRoutine: string;
  supplementation: string;

  // Measurements
  measurements?: UserMeasurements;
}

export interface UserMeasurements {
  neck: string;
  shoulders: string;
  chest: string;
  arms: string;
  waist: string;
  hips: string;
  thigh: string;
  calf: string;
}

export interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface Meal {
  name: string;
  time: string;
  ingredients: string[];
  instructions?: string;
  macros?: MacroNutrients;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    notes?: string;
  }[];
}

export interface AIPlanResponse {
  nutritionStrategy: string;
  workoutStrategy: string;
  dailyMacros: MacroNutrients;
  mealPlan: Meal[];
  workoutPlan: WorkoutDay[];
  supplementRecommendations: string[];
}

export interface ProgressEntry {
  id: string;
  date: string; // ISO String
  weight: number;
  calories?: number; // New field for calorie tracking
  photos: {
    front: string | null;
    side: string | null;
    back: string | null;
  };
  notes: string;
}

export enum AppStep {
  WELCOME = 0,
  BASICS = 1,
  PHOTOS = 2,
  ASSESSMENT = 3,
  ROUTINE = 4,
  NUTRITION = 5,
  PREFERENCES = 6,
  TRAINING = 7,
  SUPPLEMENTS = 8,
  REGISTER = 9, // New Step for Account Creation
  GENERATING = 10,
  RESULTS = 11,
  DASHBOARD = 12,
  WORKOUT_SESSION = 13, // New Step for Active Workout
}