# Badge Wall System

## Overview

The Badge Wall system is a visual gamification feature that displays your learning progress across 8 progressive badge tiers. Badges unlock as you complete milestones across different learning activities.

## Features

### 🎯 Badge Tiers (8 Levels)

1. **Wood** - Tier 1 - Your first steps in learning
2. **Iron** - Tier 2 - Building solid foundations
3. **Bronze** - Tier 3 - Bronze medallion achievement
4. **Silver** - Tier 4 - Rising in rank
5. **Gold** - Tier 5 - Golden achievement
6. **Platinum** - Tier 6 - Premium mastery
7. **Diamond** - Tier 7 - Rare brilliance
8. **Ruby** - Tier 8 - Ultimate achievement

### 📊 Milestone Tracking

Each badge requires you to complete goals in 5 areas:
- **📚 Words** - Add words to your vocabulary
- **❓ Quizzes** - Complete quiz exercises
- **🧠 Matches** - Finish matching activities
- **🗂️ Flashcards** - Practice with flashcards
- **📝 Sentences** - Practice sentence construction

### 🎨 Visual Indicators

- **Unlocked Badges**: Display in full color with a checkmark (✓)
- **Locked Badges**: Grayed out with a progress counter (e.g., "3/5" goals)
- **Next Badge**: Highlighted with a glowing "Next" label
- **Progress Ring**: Shows how many requirements are met

## How to Use

### Tracking Progress

1. Navigate to the **Badges & Progress** tab
2. View the **Badge Wall** - A grid showing all 8 badge tiers
3. See your current progress toward unlocking the next badge
4. Completed goals are highlighted in green

### Understanding Your Progress

- **Current Badge**: Your highest unlocked tier
- **Next Badge**: The badge you're currently working toward
- **Progress Summary**: Shows your counts in each activity area
- **Goal Requirements**: Displays exact targets for the next badge

## Component Structure

### BadgeWall Component (`BadgeWall.jsx`)

Main component that renders:
- Badge grid (responsive: 2-6 columns based on screen size)
- Progress indicators for each badge
- Activity summary section
- Next badge goals section

**Props:**
- `stats` (object): User statistics including words, quizzes, matches, flashcards, sentences

**Features:**
- Hover tooltips showing badge status
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Color-coded progress visualization

### BadgesTab Component (`BadgesTab.jsx`)

Full-featured badges page that includes:
- Header with back navigation
- BadgeWall component
- Current badge showcase
- Level and XP display
- Detailed badge progression timeline

## Example Usage

```jsx
import BadgeWall from '@/components/gamification/BadgeWall'

// In your component
const stats = {
  words: 150,
  quizzes: 75,
  matches: 60,
  flashcards: 90,
  sentences: 40,
}

<BadgeWall stats={stats} />
```

## Badge Progression Path

### Example Journey:
1. Start with **Wood** badge (10 words, 5 of each activity)
2. Progress to **Iron** badge (50 words, 25 of each activity)
3. Continue through **Bronze** → **Silver** → **Gold** → **Platinum** → **Diamond** → **Ruby**

Each tier requires **increasingly challenging goals**, motivating continuous learning.

## Animations & Effects

- **Badge Unlock**: Smooth color transition with glow effect
- **Checkmark Bounce**: Subtle bounce animation on unlocked badges
- **Next Badge Pulse**: Gentle pulse effect on the next badge to chase
- **Hover Effects**: Scale up on hover for better interactivity
- **Progress Indicators**: Smooth number transitions

## Customization Options

### Changing Badge Colors

Edit `src/lib/gamification-simple.js` and modify the `color` property for each tier:

```javascript
{
  tier: 1,
  name: 'Wood',
  color: '#92400e',  // Customize this color
  emoji: '🪵',
  goals: { /* ... */ }
}
```

### Adjusting Goal Requirements

Modify the `goals` object for any badge tier:

```javascript
goals: {
  words: 10,        // Increase/decrease targets
  quizzes: 5,
  matches: 5,
  flashcards: 5,
  sentences: 5,
}
```

### Adding Custom Badges

1. Add new badge object to `BADGE_TIERS` array
2. Update tier numbers accordingly
3. Define goals and visual properties
4. BadgeWall will automatically render it

## Integration with Dashboard

The Badge Wall is integrated into the main `BadgesTab` module and can be accessed from:
- Dashboard navigation → Badges & Progress
- User profile → Gamification section
- Study statistics → Badge tracking

## Performance

The BadgeWall component is optimized with:
- `useMemo` for badge calculations
- Minimal re-renders
- Efficient grid layout
- Light animations (CSS-based)

## Mobile Responsive Design

- **Mobile (< 640px)**: 2-column grid
- **Tablet (640px - 1024px)**: 3-4 column grid
- **Desktop (> 1024px)**: 6-column grid

## Future Enhancements

Potential improvements:
- Badge collection achievements
- Milestone notifications
- Badge sharing functionality
- Historical badge timeline
- Rare/special achievement badges
- Social badge comparisons
