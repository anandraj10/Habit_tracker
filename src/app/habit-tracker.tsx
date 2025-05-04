"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Inter } from "next/font/google"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"] })

// Add this after the imports
const globalStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: #374151;
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #6B7280;
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9CA3AF;
  }
`

// Types
interface Habit {
  id: string
  name: string
  icon: string
  target: number
  unit: string
  frequency: "daily" | "weekly"
  color: string
  entries: HabitEntry[]
  streak: number
  category: "health" | "productivity" | "mindfulness" | "fitness"
}

interface HabitEntry {
  date: string
  value: number
  completed: boolean
}

interface User {
  name: string
  avatar: string
  joinDate: string
  streakDays: number
  completionRate: number
}

// Utility functions
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

const getDaysBetween = (start: Date, end: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000
  return Math.round(Math.abs((start.getTime() - end.getTime()) / oneDay))
}

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const generateMockData = (): Habit[] => {
  const today = new Date()
  const habits: Habit[] = [
    {
      id: "1",
      name: "Water Intake",
      icon: "💧",
      target: 8,
      unit: "glasses",
      frequency: "daily",
      color: "#3b82f6",
      entries: [],
      streak: 5,
      category: "health",
    },
    {
      id: "2",
      name: "Sleep",
      icon: "😴",
      target: 8,
      unit: "hours",
      frequency: "daily",
      color: "#8b5cf6",
      entries: [],
      streak: 3,
      category: "health",
    },
    {
      id: "3",
      name: "Exercise",
      icon: "🏃‍♂️",
      target: 30,
      unit: "minutes",
      frequency: "daily",
      color: "#ef4444",
      entries: [],
      streak: 2,
      category: "fitness",
    },
    {
      id: "4",
      name: "Meditation",
      icon: "🧘‍♂️",
      target: 10,
      unit: "minutes",
      frequency: "daily",
      color: "#10b981",
      entries: [],
      streak: 7,
      category: "mindfulness",
    },
    {
      id: "5",
      name: "Reading",
      icon: "📚",
      target: 20,
      unit: "pages",
      frequency: "daily",
      color: "#f59e0b",
      entries: [],
      streak: 4,
      category: "productivity",
    },
    {
      id: "6",
      name: "Screen Time",
      icon: "📱",
      target: 120,
      unit: "minutes",
      frequency: "daily",
      color: "#6366f1",
      entries: [],
      streak: 0,
      category: "productivity",
    },
  ]

  // Generate 14 days of mock data for each habit
  for (let i = 0; i < habits.length; i++) {
    for (let j = 13; j >= 0; j--) {
      const date = new Date()
      date.setDate(date.getDate() - j)
      const dateStr = date.toISOString().split("T")[0]

      // Randomize completion but make more recent days more likely to be completed
      const randomFactor = j < 3 ? 0.9 : j < 7 ? 0.7 : 0.5
      const completed = Math.random() < randomFactor

      // Value is either close to target (if completed) or lower
      const value = completed
        ? habits[i].target * (0.8 + Math.random() * 0.4)
        : habits[i].target * (0.2 + Math.random() * 0.5)

      habits[i].entries.push({
        date: dateStr,
        value: Math.round(value * 10) / 10,
        completed,
      })
    }
  }

  return habits
}

const generateUserData = (): User => {
  return {
    name: "Alex Johnson",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    joinDate: "2023-09-15",
    streakDays: 7,
    completionRate: 78,
  }
}

// Main Component
export default function HabitTracker() {
  // State
  const [habits, setHabits] = useState<Habit[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
  const [showAddHabitModal, setShowAddHabitModal] = useState<boolean>(false)
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false)
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: "",
    icon: "📝",
    target: 1,
    unit: "",
    frequency: "daily",
    color: "#3b82f6",
    category: "productivity",
  })
  const [checkInValues, setCheckInValues] = useState<Record<string, number>>({})
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false)
  const [darkMode, setDarkMode] = useState<boolean>(false)
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true)

  // Add these new state variables after the existing state declarations
  const [notifications, setNotifications] = useState<{
    dailyReminders: boolean
    weeklyReports: boolean
  }>({ dailyReminders: true, weeklyReports: false })
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false)
  const [editedUser, setEditedUser] = useState<User | null>(null)
  const [showConfirmResetModal, setShowConfirmResetModal] = useState<boolean>(false)

  // Add this after the state declarations
  useEffect(() => {
    // Add the global styles
    const styleElement = document.createElement("style")
    styleElement.innerHTML = globalStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  // Refs
  const modalRef = useRef<HTMLDivElement>(null)

  // Effects
  useEffect(() => {
    // Load data from localStorage or generate mock data
    const storedHabits = localStorage.getItem("habits")
    const storedUser = localStorage.getItem("user")
    const storedDarkMode = localStorage.getItem("darkMode")
    const storedFirstVisit = localStorage.getItem("firstVisit")

    if (storedHabits) {
      setHabits(JSON.parse(storedHabits))
    } else {
      const mockHabits = generateMockData()
      setHabits(mockHabits)
      localStorage.setItem("habits", JSON.stringify(mockHabits))
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    } else {
      const mockUser = generateUserData()
      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
    }

    if (storedDarkMode) {
      setDarkMode(JSON.parse(storedDarkMode))
    }

    // Inside the first useEffect, add this after loading darkMode
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications))
    }

    if (storedFirstVisit) {
      setIsFirstVisit(JSON.parse(storedFirstVisit))
    } else {
      localStorage.setItem("firstVisit", "false")
    }

    // Initialize check-in values with today's entries
    const today = new Date().toISOString().split("T")[0]
    const initialCheckInValues: Record<string, number> = {}

    if (storedHabits) {
      const parsedHabits: Habit[] = JSON.parse(storedHabits)
      parsedHabits.forEach((habit) => {
        const todayEntry = habit.entries.find((entry) => entry.date === today)
        initialCheckInValues[habit.id] = todayEntry?.value || 0
      })
    }

    setCheckInValues(initialCheckInValues)

    // Close modals when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowAddHabitModal(false)
        setShowCheckInModal(false)
        setShowSettingsModal(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update the editedUser state when user changes
  useEffect(() => {
    if (user) {
      setEditedUser(user)
    }
  }, [user])

  useEffect(() => {
    // Save habits to localStorage whenever they change
    if (habits.length > 0) {
      localStorage.setItem("habits", JSON.stringify(habits))
    }
  }, [habits])

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  // Add this function to handle notification toggles
  const toggleNotification = (type: "dailyReminders" | "weeklyReports") => {
    const updatedNotifications = {
      ...notifications,
      [type]: !notifications[type],
    }
    setNotifications(updatedNotifications)
    localStorage.setItem("notifications", JSON.stringify(updatedNotifications))
  }

  // Add this function to handle profile updates
  const handleUpdateProfile = () => {
    if (editedUser) {
      setUser(editedUser)
      localStorage.setItem("user", JSON.stringify(editedUser))
      setShowEditProfileModal(false)
    }
  }

  // Add this function to handle data export
  const handleExportData = () => {
    const exportData = {
      user,
      habits,
      notifications,
      darkMode,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = `habit-tracker-data-${new Date().toISOString().split("T")[0]}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Add this function to handle data reset
  const handleResetData = () => {
    localStorage.removeItem("habits")
    localStorage.removeItem("user")
    localStorage.removeItem("notifications")

    // Generate new mock data
    const mockHabits = generateMockData()
    const mockUser = generateUserData()

    setHabits(mockHabits)
    setUser(mockUser)
    setNotifications({ dailyReminders: true, weeklyReports: false })

    localStorage.setItem("habits", JSON.stringify(mockHabits))
    localStorage.setItem("user", JSON.stringify(mockUser))
    localStorage.setItem("notifications", JSON.stringify({ dailyReminders: true, weeklyReports: false }))

    setShowConfirmResetModal(false)
    setShowSettingsModal(false)
  }

  // Handlers
  const handleAddHabit = () => {
    if (!newHabit.name || !newHabit.unit) return

    const newHabitObj: Habit = {
      id: Date.now().toString(),
      name: newHabit.name || "",
      icon: newHabit.icon || "📝",
      target: newHabit.target || 1,
      unit: newHabit.unit || "",
      frequency: newHabit.frequency || "daily",
      color: newHabit.color || "#3b82f6",
      entries: [],
      streak: 0,
      category: newHabit.category || "productivity",
    }

    // Add 14 days of empty entries
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      newHabitObj.entries.push({
        date: dateStr,
        value: 0,
        completed: false,
      })
    }

    setHabits([...habits, newHabitObj])
    setShowAddHabitModal(false)
    setNewHabit({
      name: "",
      icon: "📝",
      target: 1,
      unit: "",
      frequency: "daily",
      color: "#3b82f6",
      category: "productivity",
    })
  }

  const handleCheckIn = () => {
    const today = new Date().toISOString().split("T")[0]

    const updatedHabits = habits.map((habit) => {
      const value = checkInValues[habit.id] || 0
      const completed = value >= habit.target

      // Find today's entry or create a new one
      const entryIndex = habit.entries.findIndex((entry) => entry.date === today)

      if (entryIndex >= 0) {
        // Update existing entry
        const updatedEntries = [...habit.entries]
        updatedEntries[entryIndex] = {
          ...updatedEntries[entryIndex],
          value,
          completed,
        }

        // Calculate streak
        let streak = 0
        let currentIndex = updatedEntries.length - 1

        while (currentIndex >= 0 && updatedEntries[currentIndex].completed) {
          streak++
          currentIndex--
        }

        return {
          ...habit,
          entries: updatedEntries,
          streak,
        }
      } else {
        // Add new entry for today
        const updatedEntries = [...habit.entries, { date: today, value, completed }]

        // Calculate streak
        let streak = 0
        let currentIndex = updatedEntries.length - 1

        while (currentIndex >= 0 && updatedEntries[currentIndex].completed) {
          streak++
          currentIndex--
        }

        return {
          ...habit,
          entries: updatedEntries,
          streak,
        }
      }
    })

    setHabits(updatedHabits)
    setShowCheckInModal(false)

    // Update user's streak days and completion rate
    if (user) {
      const totalEntries = updatedHabits.reduce((sum, habit) => sum + habit.entries.length, 0)
      const completedEntries = updatedHabits.reduce(
        (sum, habit) => sum + habit.entries.filter((entry) => entry.completed).length,
        0,
      )
      const completionRate = Math.round((completedEntries / totalEntries) * 100)

      const maxStreak = Math.max(...updatedHabits.map((habit) => habit.streak))

      const updatedUser = {
        ...user,
        streakDays: maxStreak,
        completionRate,
      }

      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
  }

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  const getWeeklyProgress = () => {
    const today = new Date()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split("T")[0])
    }

    return dates.map((date) => {
      const dayName = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
      })

      const completedHabits = habits.filter((habit) => {
        const entry = habit.entries.find((e) => e.date === date)
        return entry && entry.completed
      }).length

      const totalHabits = habits.length
      const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0

      return {
        date: dayName,
        completionRate: Math.round(completionRate),
      }
    })
  }

  const getCategoryDistribution = () => {
    const categories = ["health", "productivity", "mindfulness", "fitness"]
    const distribution = categories.map((category) => {
      const count = habits.filter((habit) => habit.category === category).length
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
      }
    })

    return distribution.filter((item) => item.value > 0)
  }

  const getHabitProgress = (habit: Habit) => {
    return habit.entries.slice(-7).map((entry) => {
      const date = new Date(entry.date)
      return {
        date: date.toLocaleDateString("en-US", { weekday: "short" }),
        value: entry.value,
        target: habit.target,
      }
    })
  }

  const getCompletionRate = () => {
    if (!habits.length) return 0

    const totalEntries = habits.reduce((sum, habit) => sum + habit.entries.length, 0)
    const completedEntries = habits.reduce(
      (sum, habit) => sum + habit.entries.filter((entry) => entry.completed).length,
      0,
    )

    return Math.round((completedEntries / totalEntries) * 100)
  }

  // Render functions
  const renderLandingPage = () => (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 text-white py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Track Your Habits, Transform Your Life</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Monitor your daily habits, visualize your progress, and achieve your goals.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("dashboard")}
              className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Started
            </motion.button>
          </motion.div>
        </div>
      </header>

      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "📊",
                title: "Visual Analytics",
                description: "Track your progress with beautiful charts and visualizations",
              },
              {
                icon: "🔔",
                title: "Daily Check-ins",
                description: "Log your activities and maintain your streaks",
              },
              {
                icon: "🏆",
                title: "Goal Setting",
                description: "Set targets and watch yourself achieve them day by day",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2"
            >
              <h2 className="text-3xl font-bold mb-4 dark:text-white">Track What Matters to You</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Whether it's drinking water, exercising, reading, or meditation - track any habit that contributes to
                your wellbeing and productivity.
              </p>
              <ul className="space-y-2">
                {["Water intake", "Sleep duration", "Exercise", "Reading", "Meditation"].map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center dark:text-white"
                  >
                    <span className="text-green-500 mr-2">✓</span> {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="md:w-1/2"
            >
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl overflow-hidden shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1176&q=80"
                  alt="Habit tracking illustration"
                  width={500}
                  height={300}
                  className="rounded-lg w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Habits?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start tracking your habits today and see the difference in your life.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("dashboard")}
            className="bg-white text-purple-600 font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Now
          </motion.button>
        </div>
      </section>
    </div>
  )

  const renderDashboard = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
              <Image
                src={user?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                alt="User avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">{user?.name || "User"}</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Member since {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Current Streak</p>
              <p className="text-2xl font-bold dark:text-white">{user?.streakDays || 0} days</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Completion Rate</p>
              <p className="text-2xl font-bold dark:text-white">{user?.completionRate || 0}%</p>
            </div>
          </div>
        </motion.div>

        {/* Weekly Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:col-span-2"
        >
          <h3 className="text-xl font-bold mb-4 dark:text-white">Weekly Progress</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getWeeklyProgress()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: darkMode ? "#374151" : "#E5E7EB",
                    color: darkMode ? "#F9FAFB" : "#111827",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Completion Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Habits Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">Your Habits</h2>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCheckInModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <span className="mr-1">✓</span> Check In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddHabitModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center"
            >
              <span className="mr-1">+</span> Add Habit
            </motion.button>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You don't have any habits yet.</p>
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg"
            >
              Add Your First Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit, index) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
              >
                <div className="h-2" style={{ backgroundColor: habit.color }}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{habit.icon}</span>
                      <h3 className="text-lg font-bold dark:text-white">{habit.name}</h3>
                    </div>
                    <div className="flex items-center">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {habit.category}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                      <span>Today's Progress</span>
                      <span>
                        {habit.entries[habit.entries.length - 1]?.value || 0} / {habit.target} {habit.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full"
                        style={{
                          backgroundColor: habit.color,
                          width: `${Math.min(
                            ((habit.entries[habit.entries.length - 1]?.value || 0) / habit.target) * 100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium dark:text-white">{habit.streak} day streak</span>
                      <span className="ml-1 text-yellow-500">🔥</span>
                    </div>
                    <button
                      onClick={() => setSelectedHabit(habit)}
                      className="text-purple-500 hover:text-purple-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <h3 className="text-xl font-bold mb-4 dark:text-white">Habit Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCategoryDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getCategoryDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#3b82f6", "#ef4444", "#10b981", "#f59e0b"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: darkMode ? "#374151" : "#E5E7EB",
                    color: darkMode ? "#F9FAFB" : "#111827",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
        >
          <h3 className="text-xl font-bold mb-4 dark:text-white">Completion Stats</h3>
          <div className="flex flex-col items-center justify-center h-64">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 dark:text-gray-700 stroke-current"
                  strokeWidth="10"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                ></circle>
                <circle
                  className="text-purple-500 stroke-current"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray={`${getCompletionRate() * 2.51} 251.2`}
                  strokeDashoffset="0"
                  transform="rotate(-90 50 50)"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold dark:text-white">{getCompletionRate()}%</span>
              </div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Overall completion rate</p>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const renderHabitDetail = () => {
    if (!selectedHabit) return null

    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedHabit(null)}
          className="flex items-center text-purple-500 hover:text-purple-700 mb-6"
        >
          <span className="mr-1">←</span> Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
          <div className="h-2" style={{ backgroundColor: selectedHabit.color }}></div>
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <span className="text-3xl mr-3">{selectedHabit.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">{selectedHabit.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Target: {selectedHabit.target} {selectedHabit.unit} {selectedHabit.frequency}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
                  {selectedHabit.category}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Weekly Progress</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getHabitProgress(selectedHabit)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? "#1F2937" : "#FFFFFF",
                          borderColor: darkMode ? "#374151" : "#E5E7EB",
                          color: darkMode ? "#F9FAFB" : "#111827",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill={selectedHabit.color}
                        name={`${selectedHabit.name} (${selectedHabit.unit})`}
                      />
                      <Bar dataKey="target" fill="#9CA3AF" name={`Target (${selectedHabit.unit})`} opacity={0.3} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Current Streak</p>
                    <p className="text-2xl font-bold dark:text-white">{selectedHabit.streak} days 🔥</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Completion Rate</p>
                    <p className="text-2xl font-bold dark:text-white">
                      {Math.round(
                        (selectedHabit.entries.filter((entry) => entry.completed).length /
                          selectedHabit.entries.length) *
                          100,
                      )}
                      %
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Average Value</p>
                    <p className="text-2xl font-bold dark:text-white">
                      {(
                        selectedHabit.entries.reduce((sum, entry) => sum + entry.value, 0) /
                        selectedHabit.entries.length
                      ).toFixed(1)}{" "}
                      {selectedHabit.unit}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Best Day</p>
                    <p className="text-2xl font-bold dark:text-white">
                      {Math.max(...selectedHabit.entries.map((entry) => entry.value))} {selectedHabit.unit}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Actions</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCheckInModal(true)}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex-1"
                    >
                      Check In
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(selectedHabit.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg flex-1"
                    >
                      Delete Habit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 dark:text-white">History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedHabit.entries
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">
                        {entry.value} {selectedHabit.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.completed ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                            Missed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Modals
  const renderAddHabitModal = () => (
    <AnimatePresence>
      {showAddHabitModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Add New Habit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Drink Water"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                  <select
                    value={newHabit.icon}
                    onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    {["📝", "💧", "😴", "🏃‍♂️", "🧘‍♂️", "📚", "📱", "🍎", "💪", "🎯"].map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={newHabit.category}
                    onChange={(e) =>
                      setNewHabit({
                        ...newHabit,
                        category: e.target.value as "health" | "productivity" | "mindfulness" | "fitness",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="health">Health</option>
                    <option value="productivity">Productivity</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="fitness">Fitness</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newHabit.target}
                    onChange={(e) => setNewHabit({ ...newHabit, target: Number.parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                  <input
                    type="text"
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., glasses, hours"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex justify-between">
                  {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`w-10 h-10 rounded-full ${
                        newHabit.color === color ? "ring-2 ring-offset-2 ring-gray-500" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddHabit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Add Habit
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const renderCheckInModal = () => (
    <AnimatePresence>
      {showCheckInModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col"
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Daily Check-In</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Update your progress for today, {formatDate(new Date())}
            </p>

            <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {habits.map((habit) => (
                <div key={habit.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{habit.icon}</span>
                      <label htmlFor={`habit-${habit.id}`} className="text-sm font-medium dark:text-white">
                        {habit.name}
                      </label>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Target: {habit.target} {habit.unit}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input
                      id={`habit-${habit.id}`}
                      type="range"
                      min="0"
                      max={habit.target * 2}
                      step="1"
                      value={checkInValues[habit.id] || 0}
                      onChange={(e) =>
                        setCheckInValues({
                          ...checkInValues,
                          [habit.id]: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-3 text-sm font-medium dark:text-white w-12 text-right">
                      {checkInValues[habit.id] || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckIn}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Progress
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Add the new modal render functions after the existing modal render functions

  // Edit Profile Modal
  const renderEditProfileModal = () => (
    <AnimatePresence>
      {showEditProfileModal && editedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Edit Profile</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <Image
                      src={editedUser.avatar || "/placeholder.svg"}
                      alt="User avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    className="absolute bottom-0 right-0 bg-purple-600 text-white p-1 rounded-full"
                    onClick={() => {
                      // In a real app, this would open a file picker
                      // For demo purposes, we'll just cycle through some avatars
                      const avatars = [
                        "https://randomuser.me/api/portraits/men/32.jpg",
                        "https://randomuser.me/api/portraits/women/44.jpg",
                        "https://randomuser.me/api/portraits/men/86.jpg",
                        "https://randomuser.me/api/portraits/women/63.jpg",
                      ]
                      const currentIndex = avatars.indexOf(editedUser.avatar)
                      const nextIndex = (currentIndex + 1) % avatars.length
                      setEditedUser({
                        ...editedUser,
                        avatar: avatars[nextIndex],
                      })
                    }}
                  >
                    📷
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Date</label>
                <input
                  type="date"
                  value={editedUser.joinDate}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      joinDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Confirm Reset Modal
  const renderConfirmResetModal = () => (
    <AnimatePresence>
      {showConfirmResetModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Reset All Data</h2>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to reset all your data? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmResetModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Reset Data
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Update the Settings Modal to use the new functionality
  // Replace the entire renderSettingsModal function with this updated version
  const renderSettingsModal = () => (
    <AnimatePresence>
      {showSettingsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <h2 className="text-2xl font-bold mb-4 dark:text-white">Settings</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium dark:text-white">Dark Mode</span>
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    darkMode ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      darkMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium dark:text-white mb-2">Account</h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={user?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
                      alt="User avatar"
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium dark:text-white">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Member since {user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(true)}
                  className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  Edit Profile
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium dark:text-white mb-2">Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm dark:text-white">Daily Reminders</span>
                    <button
                      type="button"
                      onClick={() => toggleNotification("dailyReminders")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notifications.dailyReminders ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notifications.dailyReminders ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm dark:text-white">Weekly Reports</span>
                    <button
                      type="button"
                      onClick={() => toggleNotification("weeklyReports")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        notifications.weeklyReports ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          notifications.weeklyReports ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium dark:text-white mb-2">Data</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Export Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmResetModal(true)}
                    className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Reset All Data
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Onboarding Modal
  const renderOnboardingModal = () => (
    <AnimatePresence>
      {isFirstVisit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Welcome to Habit Tracker!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Track your habits, build consistency, and achieve your goals.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="font-bold dark:text-white">Track Your Progress</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Monitor your habits with beautiful charts and visualizations.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h3 className="font-bold dark:text-white">Daily Check-ins</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Log your activities and maintain your streaks with daily check-ins.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h3 className="font-bold dark:text-white">Set Goals</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Define targets for each habit and track your progress towards them.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFirstVisit(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg"
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button onClick={() => setActiveTab("landing")} className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-bold text-xl dark:text-white">HabitTracker</span>
                </button>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "dashboard"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setShowCheckInModal(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Check In
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Settings
                </button>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {darkMode ? "🌞" : "🌙"}
                </button>
              </div>

              {/* Mobile Navigation Button */}
              <div className="flex md:hidden items-center">
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {isNavOpen ? "✕" : "☰"}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <AnimatePresence>
            {isNavOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden"
              >
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                  <button
                    onClick={() => {
                      setActiveTab("dashboard")
                      setIsNavOpen(false)
                    }}
                    className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                      activeTab === "dashboard"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-100"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setShowCheckInModal(true)
                      setIsNavOpen(false)
                    }}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                  >
                    Check In
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsModal(true)
                      setIsNavOpen(false)
                    }}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setDarkMode(!darkMode)
                      setIsNavOpen(false)
                    }}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                  >
                    {darkMode ? "Light Mode 🌞" : "Dark Mode 🌙"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main>
          {activeTab === "landing" && renderLandingPage()}
          {activeTab === "dashboard" && !selectedHabit && renderDashboard()}
          {selectedHabit && renderHabitDetail()}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📊</span>
                <span className="font-bold text-xl dark:text-white">HabitTracker</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your habits, transform your life.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Privacy
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Terms
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                Help
              </a>
            </div>
          </div>
        </footer>

        {/* Modals */}
        {renderAddHabitModal()}
        {renderCheckInModal()}
        {renderSettingsModal()}
        {renderEditProfileModal()}
        {renderConfirmResetModal()}
        {renderOnboardingModal()}
      </div>
    </div>
  )
}
