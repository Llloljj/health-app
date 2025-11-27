import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Droplet, Flame, Moon, User, Settings, 
  Watch, TrendingUp, Award, Zap, MessageSquare, LogOut, CheckCircle, Scale, Plus, Trash2, Save, Target, Check
} from 'lucide-react';
import { AppView, UserProfile, Gender, ActivityLevel, DailyStats, AIAdvice, Meal, Task } from './types';
import { getHealthInsights, getChatResponse } from './services/geminiService';
import { ActivityChart, CaloriesChart, MacroChart, WeightChart, SleepChart } from './components/Charts';

// --- Helper Components ---

const InputField = ({ label, type, value, onChange, options, className }: any) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-gray-400 text-sm font-bold mb-2">{label}</label>
    {options ? (
      <select 
        value={value} 
        onChange={onChange}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded py-2 px-3 focus:outline-none focus:border-brand-500 transition-colors"
      >
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input 
        type={type} 
        value={value} 
        onChange={onChange}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded py-2 px-3 focus:outline-none focus:border-brand-500 transition-colors"
      />
    )}
  </div>
);

const StatCard = ({ icon: Icon, title, value, subtext, color }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`bg-gray-800 p-6 rounded-2xl border border-gray-700 relative overflow-hidden`}
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-500`}>
      <Icon size={64} />
    </div>
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
        <Icon size={20} />
      </div>
      <h3 className="text-gray-400 font-medium">{title}</h3>
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-xs text-gray-500">{subtext}</div>
  </motion.div>
);

const FeatureCard = ({ title, children, className, action }: any) => (
  <div className={`bg-gray-800 p-6 rounded-2xl border border-gray-700 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

const getBMICategoryInfo = (bmi: number) => {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400',
      advice: 'Prioritize calorie-dense, nutritious foods like nuts, avocados, and whole grains. Incorporate strength training to build muscle mass.'
    };
  } else if (bmi >= 18.5 && bmi < 24.9) {
    return {
      category: 'Healthy',
      color: 'text-green-400',
      bgColor: 'bg-green-500',
      advice: 'Excellent work! Maintain your current balanced diet and stay consistent with your mix of cardio and resistance workouts.'
    };
  } else if (bmi >= 25 && bmi < 29.9) {
    return {
      category: 'Overweight',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400',
      advice: 'Aim for a lower-calorie diet rich in fiber and protein. Try increasing your cardio duration to 30+ minutes daily to boost fat loss.'
    };
  } else {
    return {
      category: 'Obese',
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      advice: 'Focus on low-impact activities like swimming or walking to protect joints. Consult a nutritionist for a sustainable, structured meal plan.'
    };
  }
};

const calculateHealthMetrics = (profile: UserProfile): UserProfile => {
  // BMI
  const heightM = profile.height / 100;
  const bmi = profile.weight / (heightM * heightM);

  // BMR (Mifflin-St Jeor)
  let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
  if (profile.gender === Gender.Male) bmr += 5;
  else bmr -= 161;

  // TDEE
  const multipliers = {
    [ActivityLevel.Sedentary]: 1.2,
    [ActivityLevel.LightlyActive]: 1.375,
    [ActivityLevel.ModeratelyActive]: 1.55,
    [ActivityLevel.VeryActive]: 1.725,
    [ActivityLevel.SuperActive]: 1.9,
  };
  const dailyCalories = Math.round(bmr * multipliers[profile.activityLevel]);

  return { ...profile, bmi, bmr, dailyCalories };
};

const App = () => {
  // --- State ---
  const [view, setView] = useState<AppView>(AppView.Auth);
  const [loading, setLoading] = useState(false);
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // User Data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Guest User',
    age: 25,
    height: 175,
    weight: 70,
    gender: Gender.Male,
    activityLevel: ActivityLevel.ModeratelyActive,
    bmi: 0,
    bmr: 0,
    dailyCalories: 0
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>({
    steps: 6500,
    stepsGoal: 10000,
    waterIntake: 4,
    waterGoal: 8,
    caloriesBurned: 450,
    caloriesConsumed: 0,
    sleepHours: 7.2,
    activeMinutes: 45
  });

  const [meals, setMeals] = useState<Meal[]>([
    { id: '1', name: 'Oatmeal & Berries', calories: 350, protein: 12, time: '08:00 AM' },
    { id: '2', name: 'Grilled Chicken Salad', calories: 450, protein: 40, time: '12:30 PM' }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Drink 500ml Water', completed: false, xp: 50 },
    { id: '2', text: 'Walk 2000 steps', completed: false, xp: 100 },
    { id: '3', text: 'Stretching 5 min', completed: false, xp: 50 },
    { id: '4', text: 'No sugar for 6 hours', completed: false, xp: 75 }
  ]);

  // AI & Chat
  const [aiAdvice, setAiAdvice] = useState<AIAdvice | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user'|'bot', text: string}[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Device Integration Mock
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Nutrition Form State
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealProtein, setNewMealProtein] = useState('');

  // --- Effects ---

  useEffect(() => {
    // Recalculate total calories consumed whenever meals change
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    setDailyStats(prev => ({ ...prev, caloriesConsumed: totalCalories }));
  }, [meals]);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setView(AppView.Onboarding);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = calculateHealthMetrics(userProfile);
    setUserProfile(updatedProfile);
    
    setLoading(true);
    const advice = await getHealthInsights(updatedProfile);
    setAiAdvice(advice);
    setLoading(false);
    
    setView(AppView.Dashboard);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = calculateHealthMetrics(userProfile);
    setUserProfile(updatedProfile);
    alert('Profile updated successfully! Metrics recalculated.');
  };

  const connectDevice = () => {
    setSyncing(true);
    setTimeout(() => {
      setIsWatchConnected(true);
      setSyncing(false);
      setDailyStats(prev => ({
        ...prev,
        steps: prev.steps + 2300,
        caloriesBurned: prev.caloriesBurned + 150,
        activeMinutes: prev.activeMinutes + 25
      }));
    }, 2000);
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;
    const newHistory = [...chatHistory, { sender: 'user' as const, text: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage('');
    
    const response = await getChatResponse(chatMessage, newHistory.map(h => h.text));
    setChatHistory([...newHistory, { sender: 'bot' as const, text: response }]);
  };

  const addMeal = () => {
    if (newMealName && newMealCalories) {
      const meal: Meal = {
        id: Date.now().toString(),
        name: newMealName,
        calories: parseInt(newMealCalories),
        protein: parseInt(newMealProtein) || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMeals([...meals, meal]);
      setNewMealName('');
      setNewMealCalories('');
      setNewMealProtein('');
    }
  };

  const deleteMeal = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  // --- Render Functions ---

  const renderAuth = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-neon-purple rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-brand-500 p-3 rounded-xl shadow-lg shadow-brand-500/30">
            <Activity className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-white">SS-Tracker</h2>
        <p className="text-center text-gray-400 mb-8">Your Ultimate Health Companion</p>

        <form onSubmit={handleLogin} className="space-y-4">
          {authMode === 'register' && (
             <InputField label="Full Name" type="text" value={userProfile.name} onChange={(e: any) => setUserProfile({...userProfile, name: e.target.value})} />
          )}
          <InputField label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
          <InputField label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} />
          
          <button type="submit" className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]">
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-brand-400 hover:text-brand-300 font-semibold"
          >
            {authMode === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 p-8 rounded-2xl border border-gray-700 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-white">Let's Calibrate Your Profile</h2>
        <form onSubmit={handleProfileSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Age" type="number" value={userProfile.age} onChange={(e: any) => setUserProfile({...userProfile, age: parseInt(e.target.value)})} />
            <InputField label="Height (cm)" type="number" value={userProfile.height} onChange={(e: any) => setUserProfile({...userProfile, height: parseInt(e.target.value)})} />
            <InputField label="Weight (kg)" type="number" value={userProfile.weight} onChange={(e: any) => setUserProfile({...userProfile, weight: parseInt(e.target.value)})} />
            <InputField 
              label="Gender" 
              options={Object.values(Gender)}
              value={userProfile.gender} 
              onChange={(e: any) => setUserProfile({...userProfile, gender: e.target.value as Gender})} 
            />
          </div>
          <InputField 
            label="Activity Level" 
            options={Object.values(ActivityLevel)}
            value={userProfile.activityLevel} 
            onChange={(e: any) => setUserProfile({...userProfile, activityLevel: e.target.value as ActivityLevel})} 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 bg-brand-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : "Generate Dashboard"}
          </button>
        </form>
      </motion.div>
    </div>
  );

  const renderDashboardContent = () => {
     const bmiInfo = getBMICategoryInfo(userProfile.bmi);
     return (
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-6">
              <FeatureCard title="Activity Trend">
                <ActivityChart />
              </FeatureCard>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard title="Calorie Balance">
                  <CaloriesChart />
                </FeatureCard>
                <FeatureCard title="Macro Split">
                  <MacroChart />
                </FeatureCard>
              </div>

               {/* Gamification Strip */}
               <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <div className="text-purple-300 text-sm font-bold uppercase tracking-wider mb-1">Current Level</div>
                    <div className="text-3xl font-black text-white italic">BEAST MODE</div>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                        <Award className="text-yellow-400 mx-auto mb-1" size={20} />
                        <span className="text-xs text-gray-400">Streak: 12</span>
                     </div>
                     <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                        <Zap className="text-yellow-400 mx-auto mb-1" size={20} />
                        <span className="text-xs text-gray-400">XP: 4500</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: AI Coach & Tasks */}
            <div className="space-y-6">
              
              {/* AI Insight Card */}
              <div className="rounded-2xl p-6 border bg-brand-900/20 border-brand-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <Award className="text-brand-400" />
                  </div>
                  <h3 className="font-bold text-brand-400">
                    Coach's Insight
                  </h3>
                </div>
                
                {aiAdvice ? (
                   <div className="space-y-4">
                     <p className="text-white text-lg font-medium italic">"{aiAdvice.motivation}"</p>
                     
                     <div>
                       <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Today's Focus</h4>
                       <ul className="space-y-2">
                         {aiAdvice.workout.slice(0, 2).map((tip, i) => (
                           <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                             <CheckCircle size={16} className="mt-0.5 text-green-500 shrink-0" />
                             {tip}
                           </li>
                         ))}
                       </ul>
                     </div>
                   </div>
                ) : (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BMI Analysis Card */}
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Scale className="text-brand-500" size={20} />
                  BMI Analysis
                </h3>
                <div className="flex items-end gap-3 mb-3">
                  <span className="text-4xl font-black text-white">{userProfile.bmi.toFixed(1)}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${bmiInfo.bgColor} text-gray-900 mb-2`}>
                    {bmiInfo.category}
                  </div>
                </div>
                
                {/* Gauge */}
                <div className="relative h-3 bg-gray-700 rounded-full mb-6 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-yellow-400 w-1/4"></div>
                  <div className="absolute top-0 bottom-0 left-1/4 bg-green-500 w-1/4"></div>
                  <div className="absolute top-0 bottom-0 left-2/4 bg-orange-400 w-1/6"></div>
                  <div className="absolute top-0 bottom-0 right-0 bg-red-500 w-1/3"></div>
                   <div 
                      className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,1)] z-10 transition-all duration-1000"
                      style={{ left: `${Math.min(Math.max(((userProfile.bmi - 15) / 25) * 100, 0), 100)}%` }}
                   ></div>
                </div>

                {/* Tailored Advice Section */}
                <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="text-brand-400" size={16} />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recommended Action Plan</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed font-medium">
                     {bmiInfo.advice}
                  </p>
                </div>
              </div>

              {/* Quick Tasks */}
              <FeatureCard title="Daily Tasks">
                 <ul className="space-y-3">
                   {tasks.map((task) => (
                     <li 
                        key={task.id} 
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center justify-between group cursor-pointer hover:bg-gray-700/30 p-2 rounded-lg transition-all"
                     >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${
                            task.completed 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-500 group-hover:border-brand-500 bg-gray-800'
                          }`}>
                            {task.completed && <Check size={16} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm transition-colors ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                            {task.text}
                          </span>
                        </div>
                        <span className={`text-xs font-bold transition-all ${
                          task.completed 
                            ? 'text-green-400 opacity-100' 
                            : 'text-brand-500 opacity-0 group-hover:opacity-100'
                        }`}>
                          {task.completed ? 'DONE' : `+${task.xp} XP`}
                        </span>
                     </li>
                   ))}
                 </ul>
              </FeatureCard>

              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <MessageSquare size={20} />
                Ask Health Assistant
              </button>

            </div>
       </div>
     )
  };

  const renderAnalyticsContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
      <div className="lg:col-span-2">
        <FeatureCard title="Weekly Activity Deep Dive">
          <ActivityChart />
        </FeatureCard>
      </div>
      <FeatureCard title="Weight History (kg)">
        <WeightChart />
      </FeatureCard>
      <FeatureCard title="Sleep Quality Trends">
        <SleepChart />
      </FeatureCard>
      <FeatureCard title="Health Summary">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-xl">
             <div className="text-gray-400 text-sm">Avg. Steps</div>
             <div className="text-2xl font-bold text-white">8,432</div>
             <div className="text-green-400 text-xs">+12% vs last week</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl">
             <div className="text-gray-400 text-sm">Avg. Sleep</div>
             <div className="text-2xl font-bold text-white">7h 12m</div>
             <div className="text-red-400 text-xs">-5% vs last week</div>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-xl">
             <div className="text-gray-400 text-sm">Est. VO2 Max</div>
             <div className="text-2xl font-bold text-white">42</div>
             <div className="text-gray-500 text-xs">Good</div>
          </div>
           <div className="bg-gray-900/50 p-4 rounded-xl">
             <div className="text-gray-400 text-sm">Resting HR</div>
             <div className="text-2xl font-bold text-white">62 bpm</div>
             <div className="text-green-400 text-xs">Improving</div>
          </div>
        </div>
      </FeatureCard>
    </div>
  );

  const renderNutritionContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
      <div className="lg:col-span-2 space-y-6">
        <FeatureCard title="Meal Logger">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
             <InputField 
               className="flex-1 mb-0" 
               type="text" 
               value={newMealName} 
               onChange={(e: any) => setNewMealName(e.target.value)} 
               label="Meal Name" 
             />
             <div className="flex gap-4">
               <InputField 
                 className="w-24 mb-0" 
                 type="number" 
                 value={newMealCalories} 
                 onChange={(e: any) => setNewMealCalories(e.target.value)} 
                 label="Cals" 
               />
               <InputField 
                 className="w-24 mb-0" 
                 type="number" 
                 value={newMealProtein} 
                 onChange={(e: any) => setNewMealProtein(e.target.value)} 
                 label="Protein (g)" 
               />
             </div>
             <div className="flex items-end">
               <button 
                  onClick={addMeal}
                  className="bg-brand-600 hover:bg-brand-500 text-white p-2.5 rounded-lg mb-0.5 transition-colors"
               >
                 <Plus size={20} />
               </button>
             </div>
          </div>
          
          <div className="space-y-3">
             {meals.length === 0 && <p className="text-gray-500 text-center py-4">No meals logged today.</p>}
             {meals.map((meal) => (
               <div key={meal.id} className="bg-gray-900/50 p-3 rounded-xl flex justify-between items-center border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg">
                      <Flame size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{meal.name}</p>
                      <p className="text-xs text-gray-400">{meal.time} • {meal.protein}g Protein</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="font-bold text-white">{meal.calories} kcal</span>
                     <button onClick={() => deleteMeal(meal.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                       <Trash2 size={16} />
                     </button>
                  </div>
               </div>
             ))}
          </div>
        </FeatureCard>

        <FeatureCard title="Hydration">
           <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-xl border border-blue-500/30">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-500/20 p-3 rounded-full text-blue-400">
                    <Droplet size={24} />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold text-white">{dailyStats.waterIntake} / {dailyStats.waterGoal}</h4>
                    <span className="text-xs text-blue-300">Glasses (250ml)</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={() => setDailyStats(prev => ({ ...prev, waterIntake: Math.max(0, prev.waterIntake - 1) }))}
                    className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center border border-gray-600"
                 >-</button>
                 <button 
                    onClick={() => setDailyStats(prev => ({ ...prev, waterIntake: prev.waterIntake + 1 }))}
                    className="w-10 h-10 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center"
                 >+</button>
              </div>
           </div>
        </FeatureCard>
      </div>

      <div className="space-y-6">
        <FeatureCard title="Daily Breakdown">
           <MacroChart />
           <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Calories Goal</span>
                <span className="text-white font-medium">{userProfile.dailyCalories}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Consumed</span>
                <span className="text-white font-medium">{dailyStats.caloriesConsumed}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mt-1">
                 <div 
                   className={`h-full ${dailyStats.caloriesConsumed > userProfile.dailyCalories ? 'bg-red-500' : 'bg-brand-500'}`} 
                   style={{ width: `${Math.min((dailyStats.caloriesConsumed / userProfile.dailyCalories) * 100, 100)}%` }}
                 ></div>
              </div>
           </div>
        </FeatureCard>
      </div>
    </div>
  );

  const renderSettingsContent = () => (
     <div className="max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
        <FeatureCard title="Profile Settings" action={<button onClick={handleProfileUpdate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Save size={16}/> Save Changes</button>}>
           <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Name" type="text" value={userProfile.name} onChange={(e: any) => setUserProfile({...userProfile, name: e.target.value})} />
                <InputField label="Age" type="number" value={userProfile.age} onChange={(e: any) => setUserProfile({...userProfile, age: parseInt(e.target.value)})} />
                <InputField label="Height (cm)" type="number" value={userProfile.height} onChange={(e: any) => setUserProfile({...userProfile, height: parseInt(e.target.value)})} />
                <InputField label="Weight (kg)" type="number" value={userProfile.weight} onChange={(e: any) => setUserProfile({...userProfile, weight: parseInt(e.target.value)})} />
              </div>
              <InputField 
                label="Activity Level" 
                options={Object.values(ActivityLevel)}
                value={userProfile.activityLevel} 
                onChange={(e: any) => setUserProfile({...userProfile, activityLevel: e.target.value as ActivityLevel})} 
              />
           </form>
        </FeatureCard>

        <div className="mt-6 bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">App Preferences</h3>
          
          <div className="space-y-6">
             <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                   <div className="bg-brand-500/20 text-brand-500 p-2 rounded-lg">
                      <Moon size={20} />
                   </div>
                   <div>
                      <p className="font-medium text-white">Dark Mode</p>
                      <p className="text-xs text-gray-400">System default</p>
                   </div>
                </div>
                <div className="w-11 h-6 bg-brand-600 rounded-full flex items-center justify-end px-1"><div className="w-5 h-5 bg-white rounded-full"></div></div>
             </div>
          </div>
        </div>
     </div>
  );

  const renderApp = () => (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <Activity className="text-brand-500 w-8 h-8" />
          <span className="text-xl font-bold tracking-tight">SS-Tracker</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div 
             onClick={() => setView(AppView.Dashboard)}
             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${view === AppView.Dashboard ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
              <TrendingUp size={20} />
              <span className="font-medium">Dashboard</span>
          </div>
           <div 
             onClick={() => setView(AppView.Analytics)}
             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${view === AppView.Analytics ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
              <Activity size={20} />
              <span className="font-medium">Analytics</span>
          </div>
           <div 
             onClick={() => setView(AppView.Nutrition)}
             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${view === AppView.Nutrition ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
              <Droplet size={20} />
              <span className="font-medium">Nutrition</span>
          </div>
           <div 
             onClick={() => setView(AppView.Settings)}
             className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${view === AppView.Settings ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-700">
           <div className="flex items-center gap-3 p-3 text-red-400 cursor-pointer hover:bg-red-500/10 rounded-xl" onClick={() => setView(AppView.Auth)}>
             <LogOut size={20} />
             <span>Sign Out</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="bg-gray-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-700 px-8 py-4 flex justify-between items-center">
          <div className="md:hidden">
            <Activity className="text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold hidden md:block">
             {view === AppView.Dashboard && `Welcome back, ${userProfile.name}`}
             {view === AppView.Analytics && "Health Analytics"}
             {view === AppView.Nutrition && "Nutrition Tracker"}
             {view === AppView.Settings && "Account Settings"}
          </h1>
          
          <div className="flex items-center gap-4">
             {/* Device Sync Button */}
             <button 
                onClick={connectDevice}
                disabled={syncing || isWatchConnected}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isWatchConnected 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/50' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
                }`}
             >
                <Watch size={16} />
                {syncing ? 'Syncing...' : isWatchConnected ? 'Device Connected' : 'Connect Device'}
             </button>

             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold">
               {userProfile.name.charAt(0)}
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Top Stats Grid - Only on Dashboard */}
          {view === AppView.Dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={TrendingUp} 
                title="Steps" 
                value={dailyStats.steps.toLocaleString()} 
                subtext={`Goal: ${dailyStats.stepsGoal.toLocaleString()}`} 
                color="blue" 
              />
              <StatCard 
                icon={Flame} 
                title="Calories" 
                value={dailyStats.caloriesBurned} 
                subtext={`${dailyStats.caloriesConsumed} Consumed`} 
                color="orange" 
              />
              <StatCard 
                icon={Droplet} 
                title="Water" 
                value={`${dailyStats.waterIntake} / ${dailyStats.waterGoal}`} 
                subtext="Glasses (250ml)" 
                color="cyan" 
              />
              <StatCard 
                icon={Moon} 
                title="Sleep" 
                value={`${dailyStats.sleepHours}h`} 
                subtext="Deep sleep: 2h" 
                color="purple" 
              />
            </div>
          )}

          {/* View Routing */}
          {view === AppView.Dashboard && renderDashboardContent()}
          {view === AppView.Analytics && renderAnalyticsContent()}
          {view === AppView.Nutrition && renderNutritionContent()}
          {view === AppView.Settings && renderSettingsContent()}

        </div>
      </main>

      {/* AI Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 AI Assistant
               </h3>
               <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand-600 text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask for advice..."
                  className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                />
                <button 
                  onClick={sendChatMessage}
                  className="bg-brand-600 hover:bg-brand-500 text-white p-2 rounded-lg"
                >
                  <TrendingUp size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="text-gray-200 font-sans antialiased selection:bg-brand-500 selection:text-white">
      {view === AppView.Auth && renderAuth()}
      {view === AppView.Onboarding && renderOnboarding()}
      {/* Group main views together */}
      {(view === AppView.Dashboard || view === AppView.Analytics || view === AppView.Nutrition || view === AppView.Settings) && renderApp()}
    </div>
  );
};

export default App;