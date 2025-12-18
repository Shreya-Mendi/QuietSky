# Frontend Interactive Upgrades - What To Add

## Each Component Needs:

### 1. Instruction Overlay (Always Visible)
```jsx
<div style={styles.instructionBox}>
  <p style={styles.instructionTitle}>🎯 HOW TO PLAY</p>
  <p style={styles.instructionText}>
    [Mode-specific instructions]
  </p>
  <p style={styles.exampleText}>
    Example: [What to say]
  </p>
</div>
```

### 2. Live Feedback During Recording  
Add visual pulsing/shaking based on `audioLevel` while `isRecording`:
- Rocket: Pulses and shakes
- Monster: Grows/shrinks
- Bird: Flaps wings faster
- Traveler: Glows brighter

### 3. Recording Status Display
```jsx
{isRecording && (
  <div style={styles.liveBox}>
    <p style={styles.liveIndicator}>🔴 RECORDING</p>
    <p style={styles.liveHint}>Keep speaking...</p>
    <div style={styles.audioMeter}>
      <div style={{...styles.audioFill, width: `${audioLevel * 100}%`}} />
    </div>
  </div>
)}
```

### 4. Debug Display (Bottom Corner)
```jsx
<div style={styles.debugBox}>
  <p>Fuel: {rocketFuel.toFixed(2)}</p>
  <p>Height: {Math.round(rocketHeight)}m</p>
  {features && (
    <p>Continuity: {features.continuity}</p>
  )}
</div>
```

### 5. Prominent Result Display
After analyzing, show BIG visible changes with the transcript.

## Mode-Specific Instructions:

**Rocket Flight**: 
"Say smooth, long sounds like 'Aaaah' or 'Ooooh'. The smoother and longer, the more fuel you get!"

**Monster Echo**:
"Repeat the word shown above clearly. Saying it multiple times creates combos for extra damage!"

**Echo Bird**:
"Make rhythmic sounds like 'La la la' or 'Ba ba ba'. Long sounds make you glide, short sounds make you flap!"

**Treasure Talk**:
"Speak freely about anything! Describe what you see, tell a story, or share your thoughts. More words = more progress!"
