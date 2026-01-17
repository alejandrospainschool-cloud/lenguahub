// QUICK START: Using Animations in Your App

## 🎬 Example 1: Add Achievement Toast When User Saves First Word

**File**: `src/modules/dashboard/Dashboard.jsx`

```jsx
import AnimatedToast from '../../components/animations/AnimatedToast'

function Dashboard({ user, words = [], ... }) {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const saveToWordBank = async () => {
    // ... existing save logic ...
    
    // Show achievement on first word
    if (words.length === 1) {
      setToastMessage("🎉 First word saved! You're on your way!")
      setToastType('achievement')
      setShowToast(true)
    }
  }

  return (
    <>
      <AnimatedToast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      {/* Rest of dashboard */}
    </>
  )
}
```

---

## 🎯 Example 2: Celebrate 100 Words Milestone

**File**: `src/modules/dashboard/Dashboard.jsx`

```jsx
import ConfettiEffect from '../../components/animations/ConfettiEffect'
import AnimatedToast from '../../components/animations/AnimatedToast'

function Dashboard({ user, words = [], ... }) {
  const [triggerConfetti, setTriggerConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Check for milestone
  useEffect(() => {
    if (words.length === 100 && !localStorage.getItem(`milestone_100_${user.uid}`)) {
      setTriggerConfetti(true)
      setShowToast(true)
      localStorage.setItem(`milestone_100_${user.uid}`, 'true')
    }
  }, [words.length, user])

  return (
    <>
      <ConfettiEffect trigger={triggerConfetti} />
      <AnimatedToast
        message="🏆 You've learned 100 words! Amazing milestone!"
        type="achievement"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
      {/* Rest of dashboard */}
    </>
  )
}
```

---

## 📱 Example 3: Add Animated Stats to Dashboard Header

**File**: `src/modules/dashboard/Dashboard.jsx`

```jsx
import AnimatedStatCard from '../../components/animations/AnimatedStatCard'
import { Trophy, Flame, BookOpen, BarChart } from 'lucide-react'

function Dashboard({ user, words = [], events = [], ... }) {
  const stats = calculateStats(words)
  
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AnimatedStatCard
          icon={Trophy}
          title="Level"
          value={stats.level}
          description="Keep learning!"
          color="yellow"
          trend={+1}
        />
        <AnimatedStatCard
          icon={Flame}
          title="Streak"
          value={stats.streak}
          description={`${stats.streak} days`}
          color="orange"
          trend={stats.streak > 0 ? 0 : -1}
        />
        <AnimatedStatCard
          icon={BookOpen}
          title="Words"
          value={words.length}
          description="Vocabulário"
          color="blue"
          onClick={() => navigate('/words')}
        />
        <AnimatedStatCard
          icon={BarChart}
          title="Events"
          value={events.length}
          description="Upcoming"
          color="purple"
          onClick={() => navigate('/calendar')}
        />
      </div>
    </>
  )
}
```

---

## 🎉 Example 4: Confetti on Study Completion

**File**: `src/modules/study/Study.jsx`

```jsx
import ConfettiEffect from '../../components/animations/ConfettiEffect'
import AnimatedToast from '../../components/animations/AnimatedToast'

function Study({ words = [], ... }) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const completeQuiz = async (score) => {
    // Trigger celebration if scored above 80%
    if (score >= 80) {
      setShowConfetti(true)
      setToastMessage(`Perfect! You scored ${score}%! 🎯`)
      setShowToast(true)
    }
  }

  return (
    <>
      <ConfettiEffect trigger={showConfetti} />
      <AnimatedToast
        message={toastMessage}
        type="achievement"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
      />
      {/* Study content */}
    </>
  )
}
```

---

## 🌟 Example 5: Custom Streak Celebration

**File**: Any component**

```jsx
import AnimatedToast from '../../components/animations/AnimatedToast'
import { getStreakMessage } from '../../lib/animationHelpers'

function MyComponent({ streak }) {
  const [showToast, setShowToast] = useState(false)

  const handleStreakCheck = () => {
    if (streak % 5 === 0) { // Every 5 days
      setShowToast(true)
    }
  }

  return (
    <>
      <AnimatedToast
        message={getStreakMessage(streak)}
        type="achievement"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </>
  )
}
```

---

## 💾 Example 6: Save State & Prevent Duplicate Animations

**File**: Any component**

```jsx
import {
  hasSeenDailyWelcomeToday,
  markDailyWelcomeAsSeen,
  getPreviousStats,
  saveCurrentStats,
  checkLevelUp
} from '../../lib/animationHelpers'

function Component({ user, stats }) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    if (!user) return

    // Check if already showed today
    if (hasSeenDailyWelcomeToday(user)) {
      return
    }

    // Check if leveled up since last visit
    const prevStats = getPreviousStats(user)
    if (prevStats && checkLevelUp(prevStats, stats)) {
      setShowAnimation(true)
    }

    // Save for next comparison
    saveCurrentStats(user, stats)
  }, [stats, user])

  return <>...</>
}
```

---

## 🚀 Example 7: Multi-Step Animation Sequence

**File**: Any component**

```jsx
function CompleteChallenge() {
  const [step, setStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleComplete = async () => {
    // Step 1: Show initial toast
    setStep(1)
    setToastMessage('Challenge completed!')
    setShowToast(true)

    // Wait 1 second
    await new Promise(r => setTimeout(r, 1000))

    // Step 2: Show confetti
    setStep(2)
    setShowConfetti(true)

    // Wait for confetti to finish
    await new Promise(r => setTimeout(r, 3000))

    // Step 3: Show final toast
    setStep(3)
    setToastMessage('You earned 50 XP!')
    setShowToast(true)
  }

  return (
    <>
      <ConfettiEffect trigger={showConfetti} />
      <AnimatedToast
        message={toastMessage}
        type={step === 2 ? 'achievement' : 'success'}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <button onClick={handleComplete}>Complete Challenge</button>
    </>
  )
}
```

---

## 🎨 Example 8: Conditional Animations Based on User Tier

**File**: `src/modules/dashboard/Dashboard.jsx`

```jsx
import ConfettiEffect from '../../components/animations/ConfettiEffect'

function Dashboard({ user, words = [], isPremium, ... }) {
  const [triggerConfetti, setTriggerConfetti] = useState(false)

  // Premium users get extra celebration
  const saveFeedback = async () => {
    // Save word logic...

    if (isPremium && words.length % 10 === 0) {
      setTriggerConfetti(true) // Extra confetti for premium
    }
  }

  return <>...</>
}
```

---

## 📝 Example 9: Toast Error Handling

**File**: Any component with API calls**

```jsx
import AnimatedToast from '../../components/animations/AnimatedToast'

function APIComponent() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      
      setToastMessage('Data loaded successfully!')
      setToastType('success')
      setShowToast(true)
    } catch (error) {
      setToastMessage('Failed to load data: ' + error.message)
      setToastType('error')
      setShowToast(true)
    }
  }

  return (
    <>
      <AnimatedToast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
```

---

## ✨ Example 10: Guided Tour with Animations

**File**: Any onboarding component**

```jsx
import AnimatedToast from '../../components/animations/AnimatedToast'

function GuidedTour() {
  const [step, setStep] = useState(0)
  const [showToast, setShowToast] = useState(false)

  const tourSteps = [
    { message: '👋 Welcome to Word Bank!', type: 'info' },
    { message: '📝 Add words to build your vocabulary', type: 'info' },
    { message: '🎯 Take quizzes to practice', type: 'info' },
    { message: '🏆 Reach new levels and unlock achievements', type: 'achievement' },
  ]

  const goToNextStep = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1)
      setShowToast(true)
    }
  }

  const current = tourSteps[step] || {}

  return (
    <>
      <AnimatedToast
        message={current.message}
        type={current.type}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
      <button onClick={goToNextStep}>Next</button>
    </>
  )
}
```

---

## 🎯 Quick Copy-Paste Snippets

### Show Success Toast
```jsx
const [show, setShow] = useState(false)
<AnimatedToast message="Success!" type="success" isVisible={show} onClose={() => setShow(false)} />
```

### Show Achievement
```jsx
const [show, setShow] = useState(false)
<AnimatedToast message="Achievement unlocked!" type="achievement" isVisible={show} onClose={() => setShow(false)} />
```

### Trigger Confetti
```jsx
const [trigger, setTrigger] = useState(false)
<ConfettiEffect trigger={trigger} />
// In handler:
setTrigger(true)
```

### Stat Card
```jsx
<AnimatedStatCard
  icon={Trophy}
  title="Score"
  value="1000"
  color="yellow"
  onClick={() => navigate('/scores')}
/>
```

---

That's it! Mix and match these patterns to add delightful animations throughout your app. 🚀
