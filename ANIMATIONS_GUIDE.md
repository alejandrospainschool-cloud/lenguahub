// ANIMATION COMPONENTS GUIDE

This guide explains how to use the new animation components added to your Lenguahub app.

## 🎬 Animation Components

### 1. **LevelUpAnimation**
Triggered when a user reaches a new level. Shows a celebratory animation with particle effects.

**Location**: `src/components/animations/LevelUpAnimation.jsx`

**Usage**:
```jsx
import LevelUpAnimation from '../../components/animations/LevelUpAnimation'

<LevelUpAnimation 
  level={newLevelReached}
  isVisible={showLevelUpAnimation}
  onComplete={() => setShowLevelUpAnimation(false)}
/>
```

**Features**:
- Crown icon with glow effects
- Particle confetti animation
- Auto-closes after 3.5 seconds
- Fullscreen overlay with backdrop blur

---

### 2. **StreakAnimation**
Displays when a user hits a streak milestone (5, 10, 30, 100 days).

**Location**: `src/components/animations/StreakAnimation.jsx`

**Usage**:
```jsx
import StreakAnimation from '../../components/animations/StreakAnimation'

<StreakAnimation
  streak={stats.streak}
  isVisible={showStreakAnimation}
  onComplete={() => setShowStreakAnimation(false)}
/>
```

**Features**:
- Flame icon with bouncing animation
- Glowing rings effect
- Automatic dismissal after 2.5 seconds

---

### 3. **DailyWelcomeScreen**
Shows when user logs in for the first time in the day. Displays their streak and motivational messages.

**Location**: `src/components/animations/DailyWelcomeScreen.jsx`

**Usage**:
```jsx
import DailyWelcomeScreen from '../../components/animations/DailyWelcomeScreen'

<DailyWelcomeScreen
  userName={user?.displayName?.split(' ')[0] || 'Student'}
  streak={streakCount}
  isVisible={showDailyWelcome}
  onDismiss={() => setShowDailyWelcome(false)}
/>
```

**Features**:
- Staggered content animation
- Stats display (streak, daily goal)
- Gradient backgrounds with animated elements
- Auto-triggered on dashboard first visit each day

---

### 4. **ConfettiEffect**
Generic confetti animation for celebrations. Can be triggered for any achievement.

**Location**: `src/components/animations/ConfettiEffect.jsx`

**Usage**:
```jsx
import ConfettiEffect from '../../components/animations/ConfettiEffect'

const [triggerConfetti, setTriggerConfetti] = useState(false)

<ConfettiEffect trigger={triggerConfetti} />

// Trigger it:
setTriggerConfetti(true)
```

**Features**:
- 50 animated confetti pieces
- Multiple colors
- 4-second animation
- Auto-cleanup

---

### 5. **AnimatedToast**
Notification component for user feedback (success, error, info, achievement).

**Location**: `src/components/animations/AnimatedToast.jsx`

**Usage**:
```jsx
import AnimatedToast from '../../components/animations/AnimatedToast'

const [showToast, setShowToast] = useState(false)
const [toastMessage, setToastMessage] = useState('')
const [toastType, setToastType] = useState('success')

<AnimatedToast
  message={toastMessage}
  type={toastType}  // 'success', 'error', 'info', 'achievement'
  isVisible={showToast}
  onClose={() => setShowToast(false)}
  duration={3000}  // ms
/>
```

**Examples**:
```jsx
// Success
setToastMessage('Word saved successfully!')
setToastType('success')
setShowToast(true)

// Achievement
setToastMessage('You unlocked a new streak badge!')
setToastType('achievement')
setShowToast(true)

// Error
setToastMessage('Failed to save word')
setToastType('error')
setShowToast(true)
```

---

### 6. **AnimatedStatCard**
Reusable stat card with hover animations and trend indicators.

**Location**: `src/components/animations/AnimatedStatCard.jsx`

**Usage**:
```jsx
import AnimatedStatCard from '../../components/animations/AnimatedStatCard'
import { Trophy, Flame } from 'lucide-react'

<AnimatedStatCard
  icon={Trophy}
  title="Words Learned"
  value="342"
  description="Keep learning!"
  color="blue"  // 'blue', 'purple', 'orange', 'green', 'yellow'
  trend={+15}
  onClick={() => navigate('/words')}
/>
```

---

## 📚 Animation Helpers

**Location**: `src/lib/animationHelpers.js`

Utility functions for managing animations:

```jsx
import {
  hasSeenDailyWelcomeToday,
  markDailyWelcomeAsSeen,
  checkLevelUp,
  getPreviousStats,
  saveCurrentStats,
  isStreakMilestone,
  getStreakMessage,
  getCelebrationMessages,
  disableScroll,
  enableScroll,
} from '../../lib/animationHelpers'

// Check if should show daily welcome
if (!hasSeenDailyWelcomeToday(user)) {
  setShowDailyWelcome(true)
  markDailyWelcomeAsSeen(user)
}

// Check for level ups
const prevStats = getPreviousStats(user)
if (checkLevelUp(prevStats, currentStats)) {
  setShowLevelUpAnimation(true)
}

// Check streak milestones
if (isStreakMilestone(stats.streak)) {
  setShowStreakAnimation(true)
  const message = getStreakMessage(stats.streak)
}

// Disable scroll during animations
disableScroll()
// ... animation ...
enableScroll()

// Get random celebration message
const msg = getCelebrationMessages() // "You're on fire! 🔥"
```

---

## 🎨 Tailwind Animations

New animations added to `tailwind.config.js`:

- `animate-bounce-in` - Scale and bounce entrance
- `animate-spin-in` - Spin and scale entrance  
- `animate-zoom-in-50` - Zoom from 50% scale
- `animate-slide-in-from-bottom-8` - Slide up from 32px
- `animate-slide-in-from-bottom-4` - Slide up from 16px
- `animate-shake` - Shake effect
- `animate-flip` - 3D flip effect
- `animate-scale-in-center` - Scale from center

---

## 🚀 Integration Checklist

- [x] LevelUpAnimation added to Dashboard
- [x] StreakAnimation added to Dashboard
- [x] DailyWelcomeScreen added to App.jsx
- [x] Animation helpers created
- [x] Tailwind config extended with animations
- [ ] Add ConfettiEffect to milestones
- [ ] Add AnimatedToast to feedback flows
- [ ] Add AnimatedStatCard to dashboard stats

---

## 💡 Usage Tips

1. **Level Ups**: Automatically triggered when users gain XP
2. **Streaks**: Show milestone animations (5, 10, 30, 100 days)
3. **Daily Welcome**: Only shown once per day
4. **Toasts**: Use for immediate user feedback
5. **Confetti**: Use for extra celebrations on first achievements

---

## 📝 Example: Complete Flow

```jsx
// In Dashboard
const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false)

// Check level ups
useEffect(() => {
  const prev = getPreviousStats(user)
  if (prev && checkLevelUp(prev, stats)) {
    setShowLevelUpAnimation(true)
  }
  saveCurrentStats(user, stats)
}, [stats])

// Render
return (
  <>
    <LevelUpAnimation
      level={stats.level}
      isVisible={showLevelUpAnimation}
      onComplete={() => setShowLevelUpAnimation(false)}
    />
    {/* Rest of dashboard */}
  </>
)
```

---

Enjoy the enhanced interactivity! 🎉
