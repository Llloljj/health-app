import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const dataSteps = [
  { name: 'Mon', steps: 4000 },
  { name: 'Tue', steps: 3000 },
  { name: 'Wed', steps: 2000 },
  { name: 'Thu', steps: 2780 },
  { name: 'Fri', steps: 1890 },
  { name: 'Sat', steps: 2390 },
  { name: 'Sun', steps: 3490 },
];

const dataCalories = [
  { name: 'Mon', in: 2400, out: 2400 },
  { name: 'Tue', in: 1398, out: 2210 },
  { name: 'Wed', in: 9800, out: 2290 }, // Cheat day?
  { name: 'Thu', in: 3908, out: 2000 },
  { name: 'Fri', in: 4800, out: 2181 },
  { name: 'Sat', in: 3800, out: 2500 },
  { name: 'Sun', in: 4300, out: 2100 },
];

const dataWeight = [
  { name: 'Week 1', weight: 75 },
  { name: 'Week 2', weight: 74.5 },
  { name: 'Week 3', weight: 73.8 },
  { name: 'Week 4', weight: 73.2 },
  { name: 'Week 5', weight: 72.5 },
  { name: 'Current', weight: 72.1 },
];

const dataSleep = [
  { name: 'Mon', hours: 6.5 },
  { name: 'Tue', hours: 7.0 },
  { name: 'Wed', hours: 5.5 },
  { name: 'Thu', hours: 8.0 },
  { name: 'Fri', hours: 7.2 },
  { name: 'Sat', hours: 9.0 },
  { name: 'Sun', hours: 8.5 },
];

const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-xl text-xs">
        <p className="label text-gray-300 font-bold">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
           <p key={index} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
           </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={dataSteps}>
        <defs>
          <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="steps" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSteps)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const CaloriesChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={dataCalories}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="in" fill="#ec4899" radius={[4, 4, 0, 0]} name="Consumed" />
        <Bar dataKey="out" fill="#10b981" radius={[4, 4, 0, 0]} name="Burned" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MacroChart: React.FC = () => {
  const data = [
    { name: 'Protein', value: 150 },
    { name: 'Carbs', value: 200 },
    { name: 'Fats', value: 60 },
  ];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export const WeightChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={dataWeight}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#9ca3af" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4}} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const SleepChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={dataSleep}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
        <YAxis stroke="#9ca3af" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Sleep Hours">
          {dataSleep.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.hours >= 7 ? '#10b981' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};