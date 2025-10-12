# Fleet Management CSS Quick Reference

## 🎯 Quick Start Guide for Developers

### Animation Classes

#### Entry Animations
```css
.slideDown       /* 0.4s slide down */
.gridFadeIn      /* Grid items fade + slide */
.tableFadeIn     /* Table container entry */
.badgeFadeIn     /* Badge entry */
.emptyFadeIn     /* Empty state entry */
.rowFadeIn       /* Table row entry */
```

#### Continuous Animations
```css
.backgroundPulse   /* 15s background pulse */
.iconPulse         /* 2s icon scale */
.iconFloat         /* 3s vertical float */
.badgePulse        /* 2s badge glow */
.criticalPulse     /* 1.5s expanding ring */
```

#### Hover Animations
```css
.shine            /* Diagonal sweep */
.ripple           /* Expanding circle */
.shimmer          /* Light sweep */
```

---

## 📦 Component Classes

### Tabs
```css
.fleet-tabs              /* Tab container */
.fleet-tab               /* Individual tab */
.fleet-tab.active        /* Active state with glow line */
```

### Statistics
```css
.stats-grid              /* Grid container */
.stat-card               /* Card with hover effects */
.stat-icon               /* Floating icon */
.stat-value              /* Gradient text */
.stat-label              /* Label text */
```

### Buttons
```css
.btn-add                 /* Add button with rotation */
.btn-submit              /* Submit with check bounce */
.results-button          /* Results action button */
.empty-action            /* Empty state CTA */
```

### Forms
```css
.add-form-panel          /* Form container with glow */
.form-row                /* 2-column row (responsive) */
.form-input              /* Input with focus halo */
.form-select             /* Select with custom arrow */
.form-textarea           /* Textarea (resizable) */
.form-note               /* Info box with icon */
.cost-preview            /* Pulsing cost display */
```

### Tables
```css
.table-container         /* Wrapper with shadow */
.data-table              /* Table element */
.data-row                /* Row with stagger animation */
```

### Badges
```css
/* Status Badges */
.status-scheduled        /* Blue */
.status-in_progress      /* Orange + pulse */
.status-active           /* Orange + pulse */
.status-completed        /* Green */
.status-cancelled        /* Red */

/* Priority Badges */
.priority-low            /* Teal */
.priority-normal         /* Blue */
.priority-high           /* Orange */
.priority-critical       /* Red + ring pulse */

/* Strategy Badges */
.strategy-fastest        /* Purple */
.strategy-shortest       /* Light blue */
.strategy-economical     /* Green */
```

### Special Elements
```css
.route-path              /* Route container */
.route-origin            /* With 📍 pin */
.route-arrow             /* Sliding arrow */
.route-destination       /* With 🏁 flag */
.route-waypoints         /* Waypoint list */

.rating                  /* Star rating container */
.rating-star             /* Twinkling star */
.rating-value            /* Numeric value */

.percentage.high         /* Green with progress */
.percentage.medium       /* Orange with progress */
.percentage.low          /* Red with progress */

.cost-cell               /* Highlighted cost */
.time-saved              /* Green with shine */
.usage-count             /* Usage counter */
```

### Empty & Loading
```css
.empty-state             /* Empty container */
.empty-icon              /* Floating icon */
.empty-action            /* CTA button */

.loading-spinner         /* Spinner container */
.spinner-circle          /* Double ring */
.loading-text            /* Pulsing text */
.loading-dots            /* Bouncing dots */
.skeleton-loader         /* Moving gradient */
```

---

## 🎨 CSS Variables

### Colors
```css
--primary: #ff4d00;
--text-primary: #111;
--text-secondary: #666;
--border-color: #e0e0e0;
--hover-bg: #f5f5f5;

/* Dark Mode */
--dark-card: #1a1a1a;
--dark-input: #0f0f0f;
--dark-text: #fff;
--dark-text-secondary: #999;
--dark-border: #333;
--dark-hover: #252525;
```

### Usage
```css
color: var(--primary, #ff4d00);  /* Fallback included */
```

---

## 🔧 Utility Patterns

### Gradient Backgrounds
```css
/* Light to dark */
background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);

/* Primary gradient */
background: linear-gradient(135deg, #ff4d00 0%, #ff6f00 100%);

/* Success gradient */
background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
```

### Shadows
```css
/* Subtle */
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

/* Medium */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

/* Strong */
box-shadow: 
  0 8px 24px rgba(0, 0, 0, 0.12),
  0 4px 8px rgba(0, 0, 0, 0.08);

/* Glow */
box-shadow: 0 0 12px rgba(255, 77, 0, 0.4);
```

### Transforms
```css
/* Lift */
transform: translateY(-2px);

/* Scale */
transform: scale(1.05);

/* Combo */
transform: translateY(-8px) scale(1.02);

/* Rotation */
transform: rotate(5deg);
```

### Transitions
```css
/* Fast */
transition: all 0.2s ease;

/* Medium */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Slow */
transition: all 0.5s ease-out;
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop first */
@media (max-width: 1024px) {
  /* Tablet landscape */
}

@media (max-width: 768px) {
  /* Tablet portrait */
}

@media (max-width: 480px) {
  /* Mobile */
}
```

---

## ♿ Accessibility

### Focus States
```css
.element:focus-visible {
  outline: 3px solid var(--primary, #ff4d00);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255, 77, 0, 0.2);
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  .element {
    border: 2px solid currentColor;
  }
}
```

---

## 🎬 Animation Recipes

### Fade In + Slide Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.element {
  animation: fadeInUp 0.5s ease-out;
}
```

### Pulse
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.element {
  animation: pulse 2s ease-in-out infinite;
}
```

### Shimmer
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.element {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
```

### Spin
```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.element {
  animation: spin 1s linear infinite;
}
```

---

## 🔥 Common Patterns

### Card Hover Effect
```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

### Button Ripple
```css
.button {
  position: relative;
  overflow: hidden;
}

.button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.button:hover::after {
  width: 300px;
  height: 300px;
}
```

### Floating Animation
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.icon {
  animation: float 3s ease-in-out infinite;
}
```

---

## 🐛 Debugging Tips

### Test Dark Mode
```javascript
// In browser console
document.documentElement.setAttribute('data-theme', 'dark');
```

### Test Reduced Motion
```css
/* Force in dev tools */
*,
*::before,
*::after {
  animation-duration: 0.01ms !important;
}
```

### Visualize Transforms
```css
/* Add to see boundaries */
* {
  outline: 1px solid red;
}
```

### Performance Testing
```javascript
// Check frame rate
const logFPS = () => {
  let lastTime = performance.now();
  const fps = [];
  
  const check = () => {
    const now = performance.now();
    fps.push(1000 / (now - lastTime));
    lastTime = now;
    
    if (fps.length > 60) {
      console.log('Avg FPS:', 
        fps.reduce((a,b) => a+b) / fps.length
      );
      fps.length = 0;
    }
    
    requestAnimationFrame(check);
  };
  
  check();
};

logFPS();
```

---

## 📚 Further Reading

- [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [CSS Tricks - Animation](https://css-tricks.com/almanac/properties/a/animation/)
- [Web.dev - Animations Performance](https://web.dev/animations/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 💡 Tips & Best Practices

1. **Use transforms**: Better performance than position changes
2. **Prefer opacity**: Hardware accelerated
3. **Test reduced motion**: Use `prefers-reduced-motion`
4. **Keep animations short**: <300ms for UI, <1s for page
5. **Use cubic-bezier**: More natural than `ease`
6. **Add will-change**: For frequently animated elements
7. **Test on mobile**: Slower devices, touch interactions
8. **Check contrast**: Ensure text readability
9. **Validate focus states**: Keyboard navigation critical
10. **Measure performance**: Use DevTools Performance tab

---

## ✅ Pre-launch Checklist

- [ ] All animations work in all browsers
- [ ] Dark mode tested
- [ ] Reduced motion tested
- [ ] Focus states visible
- [ ] Mobile responsive
- [ ] Touch targets ≥44px
- [ ] Color contrast ≥4.5:1
- [ ] Performance ≥60fps
- [ ] No layout shifts
- [ ] Print stylesheet working

---

**Version**: 1.0  
**Last Updated**: 2025  
**Maintainer**: Fleet Management Team
